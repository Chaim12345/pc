import axios from 'axios';

async function testCaching() {
  console.log('Testing Redis caching with API endpoints...\n');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Redis: ${healthResponse.data.redis}`);
    console.log('');

    if (healthResponse.data.redis !== 'connected') {
      console.log('⚠️  Redis is not connected. Make sure Redis is running.');
      return;
    }

    // Note: To test actual caching, you would need to:
    // 1. Have a valid auth token
    // 2. Make authenticated requests to /api/boards, /api/items, etc.
    // 3. Check Redis for cached keys
    // 4. Make the same request again and verify it's served from cache
    
    console.log('✅ Health check passed!');
    console.log('✅ Redis is connected and ready for caching.');
    console.log('\nTo test actual caching:');
    console.log('1. Start the backend server: cd backend && npm run dev');
    console.log('2. Login to get an auth token');
    console.log('3. Make requests to /api/boards, /api/items/:id, etc.');
    console.log('4. Check Redis keys: docker exec monday-clone-redis redis-cli KEYS "*"');
    console.log('5. Make the same request again - should be faster (served from cache)');
    
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running.');
      console.log('   Start it with: cd backend && npm run dev');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCaching();

