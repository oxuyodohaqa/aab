#!/usr/bin/env node
/**
 * Test script for High-Performance IMAP OTP Fetcher
 */

import { IMAPOTPFetcher } from './fix.js';

// Test configuration
const TEST_CONFIG = {
  user: process.env.GMAIL_USER || 'your-email@gmail.com',
  password: process.env.GMAIL_APP_PASSWORD || 'your-app-password',
  host: 'imap.gmail.com',
  port: 993
};

/**
 * Test 1: Basic OTP fetch
 */
async function testBasicFetch() {
  console.log('\n=== Test 1: Basic OTP Fetch ===\n');
  
  const fetcher = new IMAPOTPFetcher(TEST_CONFIG);
  
  try {
    const startTime = Date.now();
    
    // Test with actual email (replace with your test email)
    const targetEmail = process.argv[2] || 'test@example.com';
    const sender = 'noreply@tm.openai.com';
    
    console.log(`Fetching OTP for: ${targetEmail}`);
    console.log(`Expected sender: ${sender}`);
    console.log('This may take up to 2 minutes...\n');
    
    const result = await fetcher.fetchOTP(targetEmail, sender, 120000);
    
    const elapsed = Date.now() - startTime;
    
    console.log('✅ SUCCESS!');
    console.log(`   OTP: ${result.otp}`);
    console.log(`   Folder: ${result.folder}`);
    console.log(`   Subject: ${result.subject}`);
    console.log(`   Cached: ${result.cached}`);
    console.log(`   Fetch Time: ${elapsed}ms (${(elapsed / 1000).toFixed(2)}s)`);
    
    return true;
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    return false;
  } finally {
    await fetcher.close();
  }
}

/**
 * Test 2: Cache functionality
 */
async function testCache() {
  console.log('\n=== Test 2: Cache Functionality ===\n');
  
  const fetcher = new IMAPOTPFetcher(TEST_CONFIG);
  
  try {
    const targetEmail = 'cache-test@example.com';
    const sender = 'noreply@tm.openai.com';
    
    // First fetch (should miss cache)
    console.log('First fetch (cache miss expected)...');
    const result1 = await fetcher.fetchOTP(targetEmail, sender, 10000).catch(() => ({
      otp: '123456',
      cached: false,
      fetchTime: 5000
    }));
    
    console.log(`   Cached: ${result1.cached} (expected: false)`);
    console.log(`   Fetch Time: ${result1.fetchTime}ms`);
    
    // Manually set cache for testing
    fetcher.cache.set(targetEmail, sender, '123456');
    
    // Second fetch (should hit cache)
    console.log('\nSecond fetch (cache hit expected)...');
    const result2 = await fetcher.fetchOTP(targetEmail, sender, 10000);
    
    console.log(`   Cached: ${result2.cached} (expected: true)`);
    console.log(`   Fetch Time: ${result2.fetchTime}ms (expected: 0)`);
    
    if (result2.cached && result2.fetchTime === 0) {
      console.log('\n✅ Cache test PASSED!');
      return true;
    } else {
      console.log('\n❌ Cache test FAILED!');
      return false;
    }
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    return false;
  } finally {
    await fetcher.close();
  }
}

/**
 * Test 3: Connection pool statistics
 */
async function testPoolStats() {
  console.log('\n=== Test 3: Connection Pool Statistics ===\n');
  
  const fetcher = new IMAPOTPFetcher(TEST_CONFIG);
  
  try {
    const stats = fetcher.getStats();
    
    console.log('Pool Stats:');
    console.log(`   Pool Size: ${stats.pool.poolSize}`);
    console.log(`   Available: ${stats.pool.available}`);
    console.log(`   Total Created: ${stats.pool.totalCreated}`);
    console.log(`   Total Reused: ${stats.pool.totalReused}`);
    
    console.log('\nCache Stats:');
    console.log(`   Size: ${stats.cache.size}`);
    console.log(`   TTL: ${stats.cache.ttlMs}ms`);
    
    console.log('\nQueue Stats:');
    console.log(`   Active Requests: ${stats.queue.activeRequests}`);
    console.log(`   Queue Length: ${stats.queue.queueLength}`);
    console.log(`   Total Processed: ${stats.queue.totalProcessed}`);
    
    console.log('\n✅ Statistics retrieved successfully!');
    return true;
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    return false;
  } finally {
    await fetcher.close();
  }
}

/**
 * Test 4: Parallel requests
 */
async function testParallelRequests() {
  console.log('\n=== Test 4: Parallel Request Handling ===\n');
  
  const fetcher = new IMAPOTPFetcher(TEST_CONFIG);
  
  try {
    const targetEmails = [
      'test1@example.com',
      'test2@example.com',
      'test3@example.com'
    ];
    
    console.log(`Simulating ${targetEmails.length} parallel requests...`);
    
    const startTime = Date.now();
    
    // Manually set cache to avoid actual IMAP calls
    targetEmails.forEach((email, i) => {
      fetcher.cache.set(email, 'noreply@tm.openai.com', `12345${i}`);
    });
    
    const promises = targetEmails.map(email =>
      fetcher.fetchOTP(email, 'noreply@tm.openai.com', 5000)
    );
    
    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;
    
    console.log(`   All ${results.length} requests completed in ${elapsed}ms`);
    console.log(`   Average: ${(elapsed / results.length).toFixed(2)}ms per request`);
    
    const allCached = results.every(r => r.cached);
    console.log(`   Cache hits: ${results.filter(r => r.cached).length}/${results.length}`);
    
    if (allCached) {
      console.log('\n✅ Parallel requests test PASSED!');
      return true;
    } else {
      console.log('\n❌ Not all requests used cache');
      return false;
    }
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    return false;
  } finally {
    await fetcher.close();
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  High-Performance IMAP OTP Fetcher Tests  ║');
  console.log('╚════════════════════════════════════════════╝');
  
  const results = [];
  
  // Run tests
  results.push({ name: 'Cache Functionality', passed: await testCache() });
  results.push({ name: 'Connection Pool Statistics', passed: await testPoolStats() });
  results.push({ name: 'Parallel Request Handling', passed: await testParallelRequests() });
  
  // Optionally run basic fetch if email provided
  if (process.argv[2]) {
    results.push({ name: 'Basic OTP Fetch', passed: await testBasicFetch() });
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║              Test Summary                  ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${result.name}`);
  });
  
  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`\nTotal: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All tests passed! 🎉\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('\n❌ Test suite error:', err);
  process.exit(1);
});
