/**
 * Test suite for authentication validators
 * Run with: npm test
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { signupSchema, loginSchema, validate } = require('../src/utils/validators');

test('Validators - Signup validation', async (t) => {
  await t.test('should accept valid signup data', () => {
    const data = {
      email: 'test@example.com',
      password: 'SecurePass123',
    };
    const { error } = validate(data, signupSchema);
    assert.strictEqual(error, undefined);
  });

  await t.test('should reject invalid email', () => {
    const data = {
      email: 'invalid-email',
      password: 'SecurePass123',
    };
    const { error } = validate(data, signupSchema);
    assert.ok(error);
  });

  await t.test('should reject weak password', () => {
    const data = {
      email: 'test@example.com',
      password: 'weak',
    };
    const { error } = validate(data, signupSchema);
    assert.ok(error);
  });

  await t.test('should reject password without uppercase', () => {
    const data = {
      email: 'test@example.com',
      password: 'secure123',
    };
    const { error } = validate(data, signupSchema);
    assert.ok(error);
  });

  await t.test('should reject password without lowercase', () => {
    const data = {
      email: 'test@example.com',
      password: 'SECURE123',
    };
    const { error } = validate(data, signupSchema);
    assert.ok(error);
  });

  await t.test('should reject password without numbers', () => {
    const data = {
      email: 'test@example.com',
      password: 'SecurePassword',
    };
    const { error } = validate(data, signupSchema);
    assert.ok(error);
  });
});

test('Validators - Login validation', async (t) => {
  await t.test('should accept valid login data', () => {
    const data = {
      email: 'test@example.com',
      password: 'any_password_works_for_login',
    };
    const { error } = validate(data, loginSchema);
    assert.strictEqual(error, undefined);
  });

  await t.test('should reject invalid email', () => {
    const data = {
      email: 'invalid',
      password: 'password',
    };
    const { error } = validate(data, loginSchema);
    assert.ok(error);
  });

  await t.test('should require password', () => {
    const data = {
      email: 'test@example.com',
    };
    const { error } = validate(data, loginSchema);
    assert.ok(error);
  });
});

test('Validators - Email normalization', async (t) => {
  await t.test('should normalize email to lowercase', () => {
    const data = {
      email: 'TEST@EXAMPLE.COM',
      password: 'SecurePass123',
    };
    const { value } = validate(data, signupSchema);
    assert.strictEqual(value.email, 'test@example.com');
  });

  await t.test('should trim email whitespace', () => {
    const data = {
      email: '  test@example.com  ',
      password: 'SecurePass123',
    };
    const { value } = validate(data, signupSchema);
    assert.strictEqual(value.email, 'test@example.com');
  });
});
