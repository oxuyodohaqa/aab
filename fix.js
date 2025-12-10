/**
 * Optimized IMAP OTP Handler - fix.js
 * 
 * High-performance IMAP OTP fetching solution with:
 * - Connection pooling (10 concurrent connections)
 * - Parallel folder checking
 * - Adaptive retry logic (0.5s starting)
 * - Request queuing
 * - In-memory caching (5 min TTL)
 * - Efficient search (last 30 emails)
 * - Timeout management
 * - Detailed logging
 * 
 * Author: Optimized for production use
 * Date: 2025-12-10
 */

// Dependency validation
try {
  var Imap = require('imap');
  var { simpleParser } = require('mailparser');
  var { EventEmitter } = require('events');
} catch (err) {
  console.error('❌ Missing required dependencies. Install with:');
  console.error('   npm install imap mailparser');
  process.exit(1);
}

// ════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════

const CONFIG = {
  // Connection pooling
  POOL_SIZE: 10,
  CONNECTION_TIMEOUT: 30000,
  KEEPALIVE_INTERVAL: 10000,
  
  // Retry logic
  INITIAL_RETRY_DELAY: 500,  // Start with 0.5s
  MAX_RETRY_DELAY: 5000,     // Max 5s
  RETRY_MULTIPLIER: 1.5,
  MAX_RETRIES: 24,           // 24 retries over ~60s
  
  // Search optimization
  MAX_EMAILS_TO_CHECK: 30,
  
  // Caching
  CACHE_TTL: 300000,         // 5 minutes
  
  // Queue
  MAX_QUEUE_SIZE: 100,
  QUEUE_TIMEOUT: 120000,     // 2 minutes
  
  // Folders to check (in parallel)
  FOLDERS: ['INBOX', '[Gmail]/Spam', '[Gmail]/All Mail'],
  
  // Timeouts
  FETCH_END_TIMEOUT: 1000,   // Wait for fetch end event
  
  // Logging
  DEBUG: process.env.DEBUG === 'true',
  LOG_PERFORMANCE: true
};

// ════════════════════════════════════════════════════════════
// CONNECTION POOL
// ════════════════════════════════════════════════════════════

class ImapConnectionPool extends EventEmitter {
  constructor(config, poolSize = CONFIG.POOL_SIZE) {
    super();
    this.config = config;
    this.poolSize = poolSize;
    this.pool = [];
    this.available = [];
    this.metrics = {
      created: 0,
      destroyed: 0,
      borrowed: 0,
      returned: 0,
      errors: 0
    };
  }

  async initialize() {
    console.log(`[Pool] Initializing ${this.poolSize} connections...`);
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < this.poolSize; i++) {
      promises.push(this._createConnection(i));
    }
    
    await Promise.all(promises);
    
    const elapsed = Date.now() - startTime;
    console.log(`[Pool] ✅ Initialized in ${elapsed}ms`);
  }

  async _createConnection(id) {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host || 'imap.gmail.com',
        port: this.config.port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: CONFIG.CONNECTION_TIMEOUT,
        authTimeout: CONFIG.CONNECTION_TIMEOUT,
        keepalive: {
          interval: CONFIG.KEEPALIVE_INTERVAL,
          idleInterval: CONFIG.KEEPALIVE_INTERVAL,
          forceNoop: true
        }
      });

      const connection = {
        id,
        imap,
        inUse: false,
        lastUsed: Date.now(),
        errors: 0
      };

      imap.once('ready', () => {
        if (CONFIG.DEBUG) console.log(`[Pool] Connection ${id} ready`);
        this.pool.push(connection);
        this.available.push(connection);
        this.metrics.created++;
        resolve(connection);
      });

      imap.once('error', (err) => {
        console.error(`[Pool] Connection ${id} error:`, err.message);
        this.metrics.errors++;
        
        // Try to reconnect
        setTimeout(() => this._reconnect(connection), 5000);
      });

      imap.once('end', () => {
        if (CONFIG.DEBUG) console.log(`[Pool] Connection ${id} ended`);
        // Remove from available pool
        this.available = this.available.filter(c => c.id !== id);
      });

      imap.connect();
    });
  }

  async _reconnect(connection) {
    console.log(`[Pool] Reconnecting ${connection.id}...`);
    
    try {
      // Remove old connection
      this.available = this.available.filter(c => c.id !== connection.id);
      this.pool = this.pool.filter(c => c.id !== connection.id);
      
      // Create new one
      await this._createConnection(connection.id);
    } catch (err) {
      console.error(`[Pool] Reconnect failed for ${connection.id}:`, err.message);
    }
  }

  async acquire() {
    // Wait for available connection
    let attempts = 0;
    while (this.available.length === 0 && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (this.available.length === 0) {
      throw new Error('No connections available in pool');
    }

    const connection = this.available.shift();
    connection.inUse = true;
    connection.lastUsed = Date.now();
    this.metrics.borrowed++;
    
    if (CONFIG.DEBUG) console.log(`[Pool] Acquired connection ${connection.id}`);
    return connection;
  }

  release(connection) {
    connection.inUse = false;
    connection.lastUsed = Date.now();
    
    if (!this.available.find(c => c.id === connection.id)) {
      this.available.push(connection);
      this.metrics.returned++;
      if (CONFIG.DEBUG) console.log(`[Pool] Released connection ${connection.id}`);
    }
  }

  async destroy() {
    console.log('[Pool] Destroying all connections...');
    
    for (const connection of this.pool) {
      try {
        connection.imap.end();
        this.metrics.destroyed++;
      } catch (err) {
        // Ignore
      }
    }
    
    this.pool = [];
    this.available = [];
  }

  getMetrics() {
    return {
      ...this.metrics,
      poolSize: this.pool.length,
      available: this.available.length,
      inUse: this.pool.length - this.available.length
    };
  }
}

// ════════════════════════════════════════════════════════════
// IN-MEMORY CACHE
// ════════════════════════════════════════════════════════════

class OtpCache {
  constructor(ttl = CONFIG.CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    if (CONFIG.DEBUG) console.log(`[Cache] HIT for ${key}`);
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    if (CONFIG.DEBUG) console.log(`[Cache] SET ${key}`);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getMetrics() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? 
        (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%' : 
        '0%'
    };
  }
}

// ════════════════════════════════════════════════════════════
// REQUEST QUEUE
// ════════════════════════════════════════════════════════════

class RequestQueue {
  constructor(maxSize = CONFIG.MAX_QUEUE_SIZE) {
    this.queue = [];
    this.processing = new Set();
    this.maxSize = maxSize;
    this.metrics = {
      queued: 0,
      processed: 0,
      failed: 0,
      timeouts: 0
    };
  }

  async enqueue(request) {
    if (this.queue.length >= this.maxSize) {
      throw new Error('Queue is full');
    }

    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.metrics.timeouts++;
        reject(new Error('Request timeout'));
      }, CONFIG.QUEUE_TIMEOUT);

      this.queue.push({
        request,
        resolve,
        reject,
        timeout,
        timestamp: Date.now()
      });
    });

    this.metrics.queued++;
    this._process();
    
    return promise;
  }

  async _process() {
    if (this.queue.length === 0) return;
    if (this.processing.size >= 10) return; // Limit concurrent processing

    const item = this.queue.shift();
    if (!item) return;

    this.processing.add(item);

    try {
      const result = await item.request();
      clearTimeout(item.timeout);
      item.resolve(result);
      this.metrics.processed++;
    } catch (err) {
      clearTimeout(item.timeout);
      item.reject(err);
      this.metrics.failed++;
    } finally {
      this.processing.delete(item);
      // Process next
      this._process();
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.queue.length,
      processing: this.processing.size
    };
  }
}

// ════════════════════════════════════════════════════════════
// OTP EXTRACTOR
// ════════════════════════════════════════════════════════════

function extractOTP(text = '', html = '', subject = '') {
  const combined = (subject + '\n' + text + '\n' + html)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try multiple patterns (ordered by specificity to avoid false positives)
  const patterns = [
    /\bcode[:\s]*(\d{6})\b/i,
    /\bverification[:\s]*(\d{6})\b/i,
    /\bOTP[:\s]*(\d{6})\b/i,
    /\bauthentication[:\s]*(\d{6})\b/i,
    /\bconfirm[:\s]*(\d{6})\b/i,
    // Generic 6-digit - last resort, may match dates/IDs
    /\b(\d{6})\b/
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function extractResetLink(text = '', html = '') {
  const combined = text + '\n' + html;
  
  const patterns = [
    /https?:\/\/[^\s<>"]+(?:reset|password|recovery|verify|confirm)[^\s<>"']*/gi
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match) return match[0];
  }

  return null;
}

// ════════════════════════════════════════════════════════════
// OPTIMIZED OTP HANDLER
// ════════════════════════════════════════════════════════════

class OptimizedOtpHandler {
  constructor(config) {
    this.config = config;
    this.pool = new ImapConnectionPool(config);
    this.cache = new OtpCache();
    this.queue = new RequestQueue();
    this.initialized = false;
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      successfulFetches: 0,
      failedFetches: 0,
      avgFetchTime: 0
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('[Handler] Initializing optimized OTP handler...');
    await this.pool.initialize();
    this.initialized = true;
    console.log('[Handler] ✅ Ready');
  }

  async fetchOTP(service, targetEmail, fetchType = 'login') {
    if (!this.initialized) {
      await this.initialize();
    }

    this.metrics.totalRequests++;
    const startTime = Date.now();

    // Check cache first
    const cacheKey = `${service}:${targetEmail}:${fetchType}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      this.metrics.cacheHits++;
      console.log(`[Handler] ✅ Cache hit for ${targetEmail}`);
      return cached;
    }

    // Queue the request
    try {
      const result = await this.queue.enqueue(async () => {
        return await this._fetchFromImap(service, targetEmail, fetchType);
      });

      const elapsed = Date.now() - startTime;
      
      if (result) {
        // Update metrics
        this.metrics.successfulFetches++;
        this.metrics.avgFetchTime = 
          (this.metrics.avgFetchTime * (this.metrics.successfulFetches - 1) + elapsed) / 
          this.metrics.successfulFetches;

        // Cache the result
        this.cache.set(cacheKey, result);

        if (CONFIG.LOG_PERFORMANCE) {
          console.log(`[Handler] ✅ Fetched in ${elapsed}ms (avg: ${this.metrics.avgFetchTime.toFixed(0)}ms)`);
        }

        return result;
      } else {
        this.metrics.failedFetches++;
        return null;
      }
    } catch (err) {
      this.metrics.failedFetches++;
      console.error(`[Handler] Error fetching OTP:`, err.message);
      return null;
    }
  }

  async _fetchFromImap(service, targetEmail, fetchType) {
    const connection = await this.pool.acquire();
    
    try {
      // Search criteria based on service
      const searchCriteria = this._buildSearchCriteria(service, targetEmail, fetchType);
      
      // Check all folders in parallel
      const results = await Promise.all(
        CONFIG.FOLDERS.map(folder => this._searchFolder(connection, folder, searchCriteria, targetEmail))
      );

      // Find first valid result
      for (const result of results) {
        if (result) {
          return result;
        }
      }

      return null;
    } finally {
      this.pool.release(connection);
    }
  }

  _buildSearchCriteria(service, targetEmail, fetchType) {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const criteria = [['SINCE', since]];
    
    if (targetEmail) {
      criteria.push(['TO', targetEmail]);
    }

    // Service-specific filters
    if (service === 'spotify') {
      criteria.push(['OR', ['FROM', 'no-reply@spotify.com'], ['FROM', 'no-reply@alerts.spotify.com']]);
      
      if (fetchType === 'reset') {
        criteria.push(['SUBJECT', 'Reset your password']);
      } else if (fetchType === 'otp') {
        criteria.push(['OR', ['SUBJECT', 'login code'], ['SUBJECT', 'Spotify login code']]);
      }
    } else if (service === 'paypal') {
      criteria.push(['FROM', 'service@intl.paypal.com']);
    } else if (service === 'canva') {
      criteria.push(['OR', ['FROM', 'no-reply@canva.com'], ['FROM', 'no-reply@account.canva.com']]);
    } else if (service === 'airwallex') {
      criteria.push(['FROM', 'noreply@airwallex.com']);
    }

    return criteria;
  }

  async _searchFolder(connection, folder, searchCriteria, targetEmail) {
    return new Promise((resolve) => {
      connection.imap.openBox(folder, true, (err, box) => {
        if (err) {
          if (CONFIG.DEBUG) console.log(`[Handler] Could not open ${folder}: ${err.message}`);
          return resolve(null);
        }

        connection.imap.search(searchCriteria, (err, results) => {
          if (err || !results || results.length === 0) {
            return resolve(null);
          }

          // Only check last N emails
          const recentResults = results.slice(-CONFIG.MAX_EMAILS_TO_CHECK);
          const fetch = connection.imap.fetch(recentResults, { bodies: '', struct: true });
          
          const emails = [];
          let processed = 0;

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                processed++;
                
                if (!err) {
                  const code = extractOTP(parsed.text || '', parsed.html || '', parsed.subject || '');
                  const resetLink = extractResetLink(parsed.text || '', parsed.html || '');
                  
                  if (code || resetLink) {
                    emails.push({
                      code: code || null,
                      resetLink: resetLink || null,
                      from: parsed.from?.text || 'Unknown',
                      subject: parsed.subject || '',
                      date: parsed.date || new Date(),
                      source: 'gmail',
                      folder: folder
                    });
                  }
                }

                if (processed >= recentResults.length) {
                  // Sort by date and return most recent
                  if (emails.length > 0) {
                    emails.sort((a, b) => b.date - a.date);
                    resolve(emails[0]);
                  } else {
                    resolve(null);
                  }
                }
              });
            });
          });

          fetch.once('error', () => resolve(null));
          fetch.once('end', () => {
            setTimeout(() => {
              if (processed === 0) resolve(null);
            }, CONFIG.FETCH_END_TIMEOUT);
          });
        });
      });
    });
  }

  async getMetrics() {
    return {
      handler: this.metrics,
      pool: this.pool.getMetrics(),
      cache: this.cache.getMetrics(),
      queue: this.queue.getMetrics()
    };
  }

  async destroy() {
    console.log('[Handler] Shutting down...');
    await this.pool.destroy();
    this.cache.clear();
    console.log('[Handler] ✅ Shutdown complete');
  }
}

// ════════════════════════════════════════════════════════════
// ADAPTIVE RETRY WITH BACKOFF
// ════════════════════════════════════════════════════════════

async function fetchOTPWithRetry(handler, service, targetEmail, fetchType = 'login') {
  let delay = CONFIG.INITIAL_RETRY_DELAY;
  let attempt = 0;

  while (attempt < CONFIG.MAX_RETRIES) {
    attempt++;

    if (CONFIG.DEBUG) {
      console.log(`[Retry] Attempt ${attempt}/${CONFIG.MAX_RETRIES} (delay: ${delay}ms)`);
    }

    const result = await handler.fetchOTP(service, targetEmail, fetchType);
    
    if (result) {
      console.log(`[Retry] ✅ Success on attempt ${attempt}`);
      return result;
    }

    if (attempt < CONFIG.MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Adaptive backoff
      delay = Math.min(delay * CONFIG.RETRY_MULTIPLIER, CONFIG.MAX_RETRY_DELAY);
    }
  }

  console.log(`[Retry] ❌ Failed after ${CONFIG.MAX_RETRIES} attempts`);
  return null;
}

// ════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════

module.exports = {
  OptimizedOtpHandler,
  fetchOTPWithRetry,
  CONFIG
};

// ════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ════════════════════════════════════════════════════════════

if (require.main === module) {
  (async () => {
    console.log('🚀 Optimized OTP Handler - Demo\n');
    
    // Configuration - Use environment variables only
    const config = {
      user: process.env.GMAIL_USER || 'YOUR_GMAIL_HERE',
      password: process.env.GMAIL_APP_PASSWORD || 'YOUR_APP_PASSWORD_HERE',
      host: 'imap.gmail.com',
      port: 993
    };
    
    if (config.user === 'YOUR_GMAIL_HERE' || config.password === 'YOUR_APP_PASSWORD_HERE') {
      console.error('❌ Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables');
      console.error('   Example: export GMAIL_USER=your-email@gmail.com');
      console.error('   Example: export GMAIL_APP_PASSWORD=your-app-password');
      process.exit(1);
    }

    const handler = new OptimizedOtpHandler(config);
    
    try {
      // Initialize
      await handler.initialize();
      
      // Example 1: Fetch Spotify OTP
      console.log('\n📧 Example 1: Fetching Spotify OTP...');
      const result1 = await fetchOTPWithRetry(
        handler, 
        'spotify', 
        'test@puella.shop', 
        'otp'
      );
      
      if (result1) {
        console.log('✅ Result:', result1);
      } else {
        console.log('❌ No OTP found');
      }

      // Example 2: Fetch PayPal OTP
      console.log('\n💳 Example 2: Fetching PayPal OTP...');
      const result2 = await fetchOTPWithRetry(
        handler, 
        'paypal', 
        'test@gmail.com', 
        'login'
      );
      
      if (result2) {
        console.log('✅ Result:', result2);
      } else {
        console.log('❌ No OTP found');
      }

      // Show metrics
      console.log('\n📊 Performance Metrics:');
      const metrics = await handler.getMetrics();
      console.log(JSON.stringify(metrics, null, 2));

    } catch (err) {
      console.error('❌ Error:', err);
    } finally {
      // Cleanup
      await handler.destroy();
    }
  })();
}
