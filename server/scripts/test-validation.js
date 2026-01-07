// Simple test script to verify Joi validation schemas
const { registerSchema, loginSchema } = require('../src/validation/auth.validation');

const goodRegister = { username: 'alice', email: 'alice@example.com', password: 'strongPassword123' };
const badRegister = { username: 'al', email: 'not-an-email', password: 'short' };

const goodLogin = { email: 'alice@example.com', password: 'strongPassword123' };
const badLogin = { email: 'bad-email', password: '' };

function runTest(schema, data, label) {
  const { error, value } = schema.validate(data, { abortEarly: false, allowUnknown: false });
  if (error) {
    console.log(`${label}: INVALID`);
    error.details.forEach(d => console.log(` - ${d.path.join('.')}: ${d.message}`));
  } else {
    console.log(`${label}: VALID`);
    console.log(value);
  }
}

console.log('--- Register good ---');
runTest(registerSchema, goodRegister, 'register-good');
console.log('\n--- Register bad ---');
runTest(registerSchema, badRegister, 'register-bad');

console.log('\n--- Login good ---');
runTest(loginSchema, goodLogin, 'login-good');
console.log('\n--- Login bad ---');
runTest(loginSchema, badLogin, 'login-bad');
