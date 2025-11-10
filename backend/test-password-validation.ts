import { validatePasswordStrength, calculatePasswordStrength, getPasswordStrengthLabel } from './src/utils/passwordValidation';

console.log('🧪 Testing Password Validation...\n');

// Test cases
const testCases = [
  { password: 'weak', expected: false, description: 'Too short' },
  { password: 'weakpass', expected: false, description: 'No uppercase, number, or special char' },
  { password: 'WeakPass', expected: false, description: 'No number or special char' },
  { password: 'WeakPass1', expected: false, description: 'No special char' },
  { password: 'WeakPass1!', expected: true, description: 'Valid password' },
  { password: 'StrongP@ssw0rd123!', expected: true, description: 'Strong password' },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = validatePasswordStrength(testCase.password);
  const score = calculatePasswordStrength(testCase.password);
  const label = getPasswordStrengthLabel(score);
  
  if (result.valid === testCase.expected) {
    console.log(`✅ ${testCase.description}: "${testCase.password}" - ${result.valid ? 'Valid' : 'Invalid'} (${label})`);
    passed++;
  } else {
    console.log(`❌ ${testCase.description}: "${testCase.password}" - Expected ${testCase.expected}, got ${result.valid}`);
    console.log(`   Errors: ${result.errors.join(', ')}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All password validation tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}

