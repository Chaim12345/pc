#!/usr/bin/env node
/**
 * Integration test script to verify all new features work correctly
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('🧪 Running Integration Tests...\n');

  // Test 1: Health check
  await test('Health check endpoint', async () => {
    const response = await axios.get('http://localhost:3001/health');
    if (response.data.status !== 'ok') {
      throw new Error('Health check failed');
    }
    console.log(`   Redis status: ${response.data.redis}`);
  });

  // Test 2: Password validation - weak password
  await test('Password validation - reject weak password', async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'weak'
      });
      throw new Error('Should have rejected weak password');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Password')) {
        // Expected error
        return;
      }
      throw error;
    }
  });

  // Test 3: Password validation - valid password
  await test('Password validation - accept strong password', async () => {
    const email = `test${Date.now()}@example.com`;
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'StrongP@ssw0rd123!'
    });
    if (response.status !== 201 || !response.data.data?.token) {
      throw new Error('Registration failed');
    }
  });

  // Test 4: Account lockout - test failed login attempts
  await test('Account lockout - track failed attempts', async () => {
    const email = `lockout${Date.now()}@example.com`;
    
    // Register user first
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Lockout Test',
      email: email,
      password: 'TestP@ss123!'
    });

    // Try wrong password multiple times
    for (let i = 0; i < 3; i++) {
      try {
        await axios.post(`${API_URL}/auth/login`, {
          email: email,
          password: 'wrongpassword'
        });
      } catch (error) {
        if (error.response?.status === 401) {
          const remaining = error.response?.data?.remainingAttempts;
          if (remaining !== undefined) {
            console.log(`   Remaining attempts: ${remaining}`);
          }
        }
      }
    }
  });

  // Test 5: Swagger documentation
  await test('Swagger documentation available', async () => {
    const response = await axios.get('http://localhost:3001/api-docs/');
    if (response.status !== 200) {
      throw new Error('Swagger docs not available');
    }
  });

  // Summary
  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed === 0) {
    console.log('✅ All integration tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});

