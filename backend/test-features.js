#!/usr/bin/env node
/**
 * Quick feature verification script
 * Tests password validation and account lockout logic
 */

const { validatePasswordStrength, calculatePasswordStrength, getPasswordStrengthLabel } = require('./src/utils/passwordValidation');
const { recordLoginAttempt, isAccountLocked, getRemainingAttempts, clearLoginAttempts } = require('./src/utils/accountLockout');

console.log('🧪 Feature Verification Tests\n');

// Test Password Validation
console.log('1. Password Validation Tests:');
const passwordTests = [
  { password: 'weak', expected: false },
  { password: 'weakpass', expected: false },
  { password: 'WeakPass', expected: false },
  { password: 'WeakPass1', expected: false },
  { password: 'WeakPass1!', expected: true },
];

let passCount = 0;
passwordTests.forEach((test) => {
  const result = validatePasswordStrength(test.password);
  const score = calculatePasswordStrength(test.password);
  const label = getPasswordStrengthLabel(score);
  
  if (result.valid === test.expected) {
    console.log(`   ✅ "${test.password}" - ${result.valid ? 'Valid' : 'Invalid'} (${label})`);
    passCount++;
  } else {
    console.log(`   ❌ "${test.password}" - Expected ${test.expected}, got ${result.valid}`);
  }
});

console.log(`\n   Password validation: ${passCount}/${passwordTests.length} tests passed\n`);

// Test Account Lockout
console.log('2. Account Lockout Tests:');
const testEmail = 'test@example.com';
clearLoginAttempts(testEmail);

// Test initial state
let lockoutStatus = isAccountLocked(testEmail);
let remaining = getRemainingAttempts(testEmail);
console.log(`   Initial state - Locked: ${lockoutStatus.locked}, Remaining: ${remaining}`);

// Test failed attempts
for (let i = 1; i <= 5; i++) {
  recordLoginAttempt(testEmail, false);
  lockoutStatus = isAccountLocked(testEmail);
  remaining = getRemainingAttempts(testEmail);
  console.log(`   After ${i} failed attempts - Locked: ${lockoutStatus.locked}, Remaining: ${remaining}`);
}

// Test successful login clears
recordLoginAttempt(testEmail, true);
lockoutStatus = isAccountLocked(testEmail);
remaining = getRemainingAttempts(testEmail);
console.log(`   After successful login - Locked: ${lockoutStatus.locked}, Remaining: ${remaining}`);

console.log('\n✅ Feature verification completed!');

