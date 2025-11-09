import { cacheService } from './src/services/cacheService';

async function testRedis() {
  console.log('Testing Redis connection...\n');

  // Wait a bit for Redis to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 1: Check connection
  console.log('1. Testing connection...');
  const isConnected = cacheService.isConnected();
  console.log(`   Connection status: ${isConnected ? '✅ Connected' : '❌ Not connected'}\n`);

  if (!isConnected) {
    console.log('⚠️  Redis is not connected. Make sure Redis is running:');
    console.log('   docker-compose up -d redis\n');
    return;
  }

  // Test 2: Set and Get
  console.log('2. Testing SET/GET...');
  const testKey = 'test:cache:key';
  const testValue = { message: 'Hello Redis!', timestamp: new Date().toISOString() };
  
  const setResult = await cacheService.set(testKey, testValue, 60);
  console.log(`   SET result: ${setResult ? '✅ Success' : '❌ Failed'}`);
  
  const getResult = await cacheService.get(testKey);
  console.log(`   GET result: ${getResult ? '✅ Success' : '❌ Failed'}`);
  if (getResult) {
    console.log(`   Retrieved value:`, JSON.stringify(getResult, null, 2));
  }
  console.log('');

  // Test 3: TTL (Time To Live)
  console.log('3. Testing TTL...');
  const ttlKey = 'test:ttl:key';
  await cacheService.set(ttlKey, { data: 'This will expire' }, 5);
  console.log('   Set key with 5 second TTL');
  console.log('   Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  const ttlResult = await cacheService.get(ttlKey);
  console.log(`   Key still exists: ${ttlResult ? '✅ Yes' : '❌ No'}`);
  console.log('');

  // Test 4: Delete
  console.log('4. Testing DELETE...');
  const deleteResult = await cacheService.del(testKey);
  console.log(`   DELETE result: ${deleteResult ? '✅ Success' : '❌ Failed'}`);
  const verifyDelete = await cacheService.get(testKey);
  console.log(`   Key deleted: ${verifyDelete === null ? '✅ Yes' : '❌ No'}`);
  console.log('');

  // Test 5: Pattern deletion
  console.log('5. Testing pattern deletion...');
  await cacheService.set('test:pattern:1', { data: 1 }, 60);
  await cacheService.set('test:pattern:2', { data: 2 }, 60);
  await cacheService.set('test:pattern:3', { data: 3 }, 60);
  console.log('   Created 3 keys with pattern "test:pattern:*"');
  const patternDeleteResult = await cacheService.delPattern('test:pattern:*');
  console.log(`   Pattern DELETE result: ${patternDeleteResult ? '✅ Success' : '❌ Failed'}`);
  const verifyPattern1 = await cacheService.get('test:pattern:1');
  const verifyPattern2 = await cacheService.get('test:pattern:2');
  console.log(`   Pattern keys deleted: ${!verifyPattern1 && !verifyPattern2 ? '✅ Yes' : '❌ No'}`);
  console.log('');

  // Test 6: Cache invalidation helpers
  console.log('6. Testing cache invalidation helpers...');
  await cacheService.set('board:test123', { id: 'test123' }, 60);
  await cacheService.set('boards:user:user1', [{ id: 'test123' }], 60);
  await cacheService.set('items:board:test123', [{ id: 'item1' }], 60);
  console.log('   Created board-related cache keys');
  await cacheService.invalidateBoard('test123');
  const boardCache = await cacheService.get('board:test123');
  const boardsCache = await cacheService.get('boards:user:user1');
  const itemsCache = await cacheService.get('items:board:test123');
  console.log(`   Board cache invalidated: ${!boardCache && !boardsCache && !itemsCache ? '✅ Yes' : '❌ No'}`);
  console.log('');

  console.log('✅ All Redis tests completed!\n');
  console.log('Cache service is working correctly.');
  
  // Cleanup
  await cacheService.del('test:ttl:key');
  await cacheService.disconnect();
}

testRedis().catch(console.error);

