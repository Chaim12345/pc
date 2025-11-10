import { recordLoginAttempt, isAccountLocked, getRemainingAttempts, clearLoginAttempts } from './src/utils/accountLockout';

console.log('🧪 Testing Account Lockout...\n');

const testEmail = 'test@example.com';

// Clear any existing attempts
clearLoginAttempts(testEmail);

console.log('1. Testing initial state...');
let lockoutStatus = isAccountLocked(testEmail);
console.log(`   Locked: ${lockoutStatus.locked} (expected: false)`);
console.log(`   Remaining attempts: ${getRemainingAttempts(testEmail)} (expected: 5)`);

console.log('\n2. Testing failed login attempts...');
for (let i = 1; i <= 5; i++) {
  recordLoginAttempt(testEmail, false);
  lockoutStatus = isAccountLocked(testEmail);
  const remaining = getRemainingAttempts(testEmail);
  console.log(`   Attempt ${i}: Remaining: ${remaining}, Locked: ${lockoutStatus.locked}`);
  
  if (i === 5 && !lockoutStatus.locked) {
    console.log('   ⚠️  Account should be locked after 5 failed attempts');
  }
}

console.log('\n3. Testing successful login clears attempts...');
recordLoginAttempt(testEmail, true);
lockoutStatus = isAccountLocked(testEmail);
console.log(`   Locked: ${lockoutStatus.locked} (expected: false)`);
console.log(`   Remaining attempts: ${getRemainingAttempts(testEmail)} (expected: 5)`);

console.log('\n4. Testing lockout after 5 failed attempts...');
clearLoginAttempts(testEmail);
for (let i = 0; i < 5; i++) {
  recordLoginAttempt(testEmail, false);
}
lockoutStatus = isAccountLocked(testEmail);
if (lockoutStatus.locked) {
  console.log(`   ✅ Account locked correctly`);
  console.log(`   Unlock time: ${lockoutStatus.unlockTime?.toISOString()}`);
} else {
  console.log('   ❌ Account should be locked');
}

console.log('\n✅ Account lockout tests completed!');

