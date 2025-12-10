# Integration Guide: Optimized OTP Handler

This guide shows how to integrate the optimized `fix.js` OTP handler into your existing bot.js and air.js implementations.

## 🎯 Quick Start

### Step 1: Ensure Dependencies

The optimized handler uses the same dependencies as your existing code:
- `imap` - Already used in bot.js and air.js
- `mailparser` - Already used in bot.js and air.js

No additional dependencies needed!

### Step 2: Choose Integration Method

You have two options:

#### Option A: Direct Replacement (Recommended)
Replace the existing `fetchFromGmail()` function with the optimized version.

#### Option B: Side-by-Side
Keep both implementations and gradually migrate.

## 📝 Integration for bot.js

### Current Implementation (Slow)

The current `bot.js` has this function around line 1052:

```javascript
function fetchFromGmail(service = 'paypal', targetEmail = null, fetchType = 'login') {
  return new Promise((resolve) => {
    const imap = new Imap({...});  // Creates new connection every time
    // ... sequential folder checking with 2-3s delays
  });
}
```

### Optimized Implementation

#### Step 1: Add at the top of bot.js (after other requires)

```javascript
// Add after line 6 (after existing requires)
const { OptimizedOtpHandler, fetchOTPWithRetry } = require('./fix');

// Initialize handler (add after line 605, before loadUsers())
let otpHandler = null;

async function initializeOtpHandler() {
  if (otpHandler) return;
  
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('❌ Gmail credentials not configured');
    return;
  }
  
  const config = {
    user: GMAIL_USER,
    password: GMAIL_APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993
  };
  
  try {
    otpHandler = new OptimizedOtpHandler(config);
    await otpHandler.initialize();
    console.log('✅ Optimized OTP Handler initialized');
  } catch (err) {
    console.error('❌ Failed to initialize OTP Handler:', err.message);
  }
}
```

#### Step 2: Initialize at startup

```javascript
// Add after line 2839 (after loadStats() call)
initializeOtpHandler().catch(err => {
  console.error('❌ OTP Handler initialization error:', err);
});
```

#### Step 3: Replace fetchFromGmail function

Replace the entire `fetchFromGmail` function (lines 1052-1261) with:

```javascript
async function fetchFromGmail(service = 'paypal', targetEmail = null, fetchType = 'login') {
  // Fallback to old implementation if handler not ready
  if (!otpHandler) {
    console.log('[Gmail] Using fallback implementation...');
    // Keep the old function as fetchFromGmailLegacy() for fallback
    return fetchFromGmailLegacy(service, targetEmail, fetchType);
  }
  
  if (!targetEmail) {
    console.error('[Gmail] ERROR: targetEmail is required');
    return null;
  }
  
  console.log(`[Gmail] 🔍 Searching for: ${targetEmail} (${service}/${fetchType})`);
  
  try {
    const result = await fetchOTPWithRetry(otpHandler, service, targetEmail, fetchType);
    
    if (result) {
      console.log(`[Gmail] ✅ Found OTP/link for ${targetEmail}`);
      return {
        code: result.code || null,
        resetLink: result.resetLink || null,
        from: result.from,
        subject: result.subject,
        date: result.date,
        source: 'gmail',
        folder: result.folder,
        timeTaken: result.timeTaken || 0
      };
    }
    
    console.log(`[Gmail] ❌ No OTP found for ${targetEmail}`);
    return null;
    
  } catch (err) {
    console.error(`[Gmail] Error:`, err.message);
    return null;
  }
}

// Rename old function for fallback
function fetchFromGmailLegacy(service = 'paypal', targetEmail = null, fetchType = 'login') {
  // Keep the entire old implementation here
  // ... (copy the old fetchFromGmail code)
}
```

#### Step 4: Add cleanup on exit

```javascript
// Add to the existing SIGINT handler (around line 2817)
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  if (bot) {
    try {
      bot.stopPolling();
    } catch (e) {}
  }
  
  // Add this cleanup
  if (otpHandler) {
    try {
      await otpHandler.destroy();
      console.log('✅ OTP Handler cleaned up');
    } catch (e) {
      console.error('❌ OTP Handler cleanup error:', e.message);
    }
  }
  
  process.exit(0);
});
```

## 📝 Integration for air.js

### Current Implementation (Slow)

The current `air.js` has the same slow implementation as bot.js.

### Optimized Implementation

The integration is exactly the same as for bot.js. Follow the same 4 steps:

1. Add requires and initialization function at the top
2. Initialize at startup
3. Replace fetchFromGmail with optimized version
4. Add cleanup on exit

The code is identical since both files use the same structure.

## 🔄 Migration Strategy

### Phase 1: Side-by-Side (Safe)

Keep both implementations and use a flag to switch:

```javascript
const USE_OPTIMIZED_OTP = process.env.USE_OPTIMIZED_OTP === 'true';

async function fetchFromGmail(service, targetEmail, fetchType) {
  if (USE_OPTIMIZED_OTP && otpHandler) {
    return await fetchFromGmailOptimized(service, targetEmail, fetchType);
  } else {
    return await fetchFromGmailLegacy(service, targetEmail, fetchType);
  }
}
```

Enable with: `USE_OPTIMIZED_OTP=true node bot.js`

### Phase 2: Monitor Performance

Monitor the metrics to verify improvements:

```javascript
// Add periodic metrics logging
setInterval(async () => {
  if (otpHandler) {
    const metrics = await otpHandler.getMetrics();
    console.log('📊 OTP Handler Metrics:', {
      avgFetchTime: metrics.handler.avgFetchTime + 'ms',
      cacheHitRate: metrics.cache.hitRate,
      poolUtilization: `${metrics.pool.inUse}/${metrics.pool.poolSize}`
    });
  }
}, 300000); // Every 5 minutes
```

### Phase 3: Full Migration

Once confident, remove the legacy implementation:

```javascript
// Simply remove fetchFromGmailLegacy() and USE_OPTIMIZED_OTP check
```

## 🧪 Testing

### Test 1: Simple OTP Fetch

```javascript
// Add a test command in your bot
bot.onText(/\/testopt/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAdmin(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Admin only');
  }
  
  bot.sendMessage(chatId, '🧪 Testing optimized OTP handler...');
  
  const testEmail = 'test@puella.shop';
  const result = await fetchFromGmail('spotify', testEmail, 'otp');
  
  if (result) {
    bot.sendMessage(chatId, `✅ Success!\nCode: ${result.code || 'N/A'}\nTime: ${result.timeTaken}ms`);
  } else {
    bot.sendMessage(chatId, '❌ No OTP found');
  }
});
```

### Test 2: Performance Test

```javascript
bot.onText(/\/testperf/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAdmin(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Admin only');
  }
  
  const metrics = await otpHandler.getMetrics();
  
  const text = `📊 OTP Handler Performance:\n\n` +
    `Total Requests: ${metrics.handler.totalRequests}\n` +
    `Successful: ${metrics.handler.successfulFetches}\n` +
    `Failed: ${metrics.handler.failedFetches}\n` +
    `Avg Fetch Time: ${metrics.handler.avgFetchTime.toFixed(0)}ms\n` +
    `Cache Hit Rate: ${metrics.cache.hitRate}\n` +
    `Pool Utilization: ${metrics.pool.inUse}/${metrics.pool.poolSize}\n` +
    `Queue Size: ${metrics.queue.queueSize}`;
  
  bot.sendMessage(chatId, text);
});
```

### Test 3: Load Test

```javascript
bot.onText(/\/testload/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAdmin(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Admin only');
  }
  
  bot.sendMessage(chatId, '🔥 Starting load test (10 concurrent requests)...');
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetchFromGmail('spotify', `test${i}@puella.shop`, 'otp')
    );
  }
  
  await Promise.all(promises);
  
  const elapsed = Date.now() - startTime;
  bot.sendMessage(chatId, `✅ Load test complete!\nTime: ${elapsed}ms for 10 requests\nAvg: ${(elapsed/10).toFixed(0)}ms per request`);
});
```

## 🐛 Troubleshooting

### Issue: Handler not initializing

```
❌ Failed to initialize OTP Handler
```

**Solutions:**
1. Check Gmail credentials are set
2. Verify IMAP is enabled in Gmail settings
3. Check network connectivity
4. Look for firewall blocking port 993

### Issue: Slow performance despite optimization

```
⏱️ Taking 10-15s instead of 3-5s
```

**Solutions:**
1. Check pool size: `CONFIG.POOL_SIZE = 15;`
2. Verify network latency
3. Check if Gmail is rate-limiting
4. Monitor pool utilization in metrics

### Issue: Cache not working

```
Cache Hit Rate: 0%
```

**Solutions:**
1. Verify same email is being requested
2. Check cache TTL: `CONFIG.CACHE_TTL = 600000;`
3. Ensure handler is not being recreated

### Issue: Queue backing up

```
Queue Size: 50+
```

**Solutions:**
1. Increase pool size: `CONFIG.POOL_SIZE = 20;`
2. Increase concurrent processing limit in RequestQueue
3. Check for slow email searches

## 📊 Performance Monitoring

### Add Health Check Endpoint

```javascript
// Add a health check for the OTP handler
bot.onText(/\/health/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!otpHandler) {
    return bot.sendMessage(chatId, '❌ OTP Handler not initialized');
  }
  
  const metrics = await otpHandler.getMetrics();
  
  // Calculate health score
  const poolHealth = metrics.pool.available / metrics.pool.poolSize * 100;
  const cacheHealth = metrics.cache.hitRate ? parseFloat(metrics.cache.hitRate) : 0;
  const queueHealth = metrics.queue.queueSize < 10 ? 100 : (100 - metrics.queue.queueSize);
  
  const overallHealth = (poolHealth + cacheHealth + queueHealth) / 3;
  
  let status = '✅ Healthy';
  if (overallHealth < 50) status = '❌ Critical';
  else if (overallHealth < 70) status = '⚠️ Warning';
  
  const text = `${status}\n\n` +
    `Health Score: ${overallHealth.toFixed(0)}%\n\n` +
    `Pool: ${poolHealth.toFixed(0)}% (${metrics.pool.available}/${metrics.pool.poolSize} available)\n` +
    `Cache: ${cacheHealth.toFixed(0)}% hit rate\n` +
    `Queue: ${queueHealth.toFixed(0)}% (${metrics.queue.queueSize} pending)`;
  
  bot.sendMessage(chatId, text);
});
```

## 🚀 Next Steps

After successful integration:

1. **Monitor**: Watch metrics for 24-48 hours
2. **Tune**: Adjust CONFIG based on actual load
3. **Scale**: Increase pool size if needed
4. **Document**: Update team docs with new behavior
5. **Remove**: Delete old implementation once stable

## 📞 Support

If you encounter issues:

1. Check the main README: `FIX_README.md`
2. Enable debug mode: `DEBUG=true`
3. Check metrics with `/testperf` command
4. Review logs for error messages

---

**Remember**: The optimized handler is designed to be a drop-in replacement. It maintains the same interface as the old implementation, so integration should be straightforward!
