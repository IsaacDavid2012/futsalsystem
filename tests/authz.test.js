/**
 * Authz regression tests
 */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
};

const uniqueToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminEmail = `admin-${uniqueToken}@example.com`;
const overviewAdminEmail = `overview-admin+${uniqueToken}@example.com`;
const userEmail = `user-${uniqueToken}@example.com`;
const overviewUserEmail = `overview-user+${uniqueToken}@example.com`;
const testSecret = `test-secret-${uniqueToken}`;

let server;
let baseUrl;
let db;

const readCookie = (response) => {
  const cookie = response.headers.get('set-cookie');
  return cookie ? cookie.split(';')[0] : '';
};

const request = (url, options = {}) => fetch(url, {
  redirect: 'manual',
  ...options,
});

const ensureAccount = async (email, password) => {
  const signupResponse = await request(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (signupResponse.status === 201) {
    return readCookie(signupResponse);
  }

  if (signupResponse.status !== 409) {
    const body = await signupResponse.text();
    throw new Error(`Unexpected account setup response for ${email}: ${signupResponse.status} ${body}`);
  }

  const loginResponse = await request(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.strictEqual(loginResponse.status, 200);
  return readCookie(loginResponse);
};

const runSql = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) {
      reject(err);
      return;
    }

    resolve(this);
  });
});

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = testSecret;
  process.env.ADMIN_EMAILS = [adminEmail, overviewAdminEmail].join(',');

  delete require.cache[require.resolve('../db')];
  delete require.cache[require.resolve('../server')];
  db = require('../db');
  const app = require('../server');
  server = app.listen(0);

  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  process.env.NODE_ENV = originalEnv.NODE_ENV;
  process.env.JWT_SECRET = originalEnv.JWT_SECRET;
  process.env.ADMIN_EMAILS = originalEnv.ADMIN_EMAILS;
});

test('admin route requires authentication and admin role', async () => {
  const adminCookie = await ensureAccount(adminEmail, 'IDC-201Two');
  const userCookie = await ensureAccount(userEmail, 'SecurePass123');

  const unauthenticated = await request(`${baseUrl}/admin`);
  assert.strictEqual(unauthenticated.status, 401);

  const forbidden = await request(`${baseUrl}/admin`, {
    headers: { Cookie: userCookie },
  });
  assert.strictEqual(forbidden.status, 403);

  const allowed = await request(`${baseUrl}/admin`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(allowed.status, 200);
  assert.match(await allowed.text(), /admin control room|manage courts|futsalhub admin/i);
});

test('api admin overview rejects non-admins and allows admins', async () => {
  const adminCookie = await ensureAccount(overviewAdminEmail, 'IDC-201Two');
  const userCookie = await ensureAccount(overviewUserEmail, 'SecurePass123');

  const forbidden = await request(`${baseUrl}/api/admin/overview?startDate=2026-01-01&endDate=2026-01-01`, {
    headers: { Cookie: userCookie },
  });
  assert.strictEqual(forbidden.status, 403);

  const allowed = await request(`${baseUrl}/api/admin/overview?startDate=2026-01-01&endDate=2026-01-01`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(allowed.status, 200);
  const body = await allowed.json();
  assert.equal(body.period.startDate, '2026-01-01');
});

test('no JWT fallback secret remains in source files', () => {
  const filesToScan = [
    'server.js',
    'src/utils/config.js',
    'src/middleware/authentication.js',
    'src/routes/auth.js',
  ];

  const forbiddenPatterns = [
    /dev_secret_change_me/,
    /Using insecure development fallback/,
    /\|\|\s*['"]dev_secret_change_me['"]/,
  ];

  filesToScan.forEach((relativePath) => {
    const content = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
    forbiddenPatterns.forEach((pattern) => {
      assert.ok(!pattern.test(content), `${relativePath} still contains a forbidden JWT fallback pattern: ${pattern}`);
    });
  });
});

test('config requires JWT_SECRET in every environment', () => {
  const configPath = require.resolve('../src/utils/config');
  delete require.cache[configPath];

  const savedSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = '';

  assert.throws(() => {
    require('../src/utils/config');
  }, /JWT_SECRET is required\./);

  process.env.JWT_SECRET = savedSecret;
  delete require.cache[configPath];
});

test('auth me returns stored profile fields for autofill', async () => {
  await runSql('UPDATE users SET full_name = ?, phone = ? WHERE email = ?', ['Booked Player', '5551234567', userEmail]);

  const userCookie = await ensureAccount(userEmail, 'SecurePass123');

  const meResponse = await request(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: userCookie },
  });

  assert.strictEqual(meResponse.status, 200);
  const body = await meResponse.json();
  assert.equal(body.user.fullName, 'Booked Player');
  assert.equal(body.user.phone, '5551234567');
});

test('admin users endpoint lists the seeded admin account', async () => {
  const adminCookie = await ensureAccount(adminEmail, 'IDC-201Two');

  const usersResponse = await request(`${baseUrl}/api/admin/users`, {
    headers: { Cookie: adminCookie },
  });

  assert.strictEqual(usersResponse.status, 200);
  const body = await usersResponse.json();
  assert.ok(Array.isArray(body.users));
  assert.ok(body.users.some((user) => user.email === adminEmail && user.role === 'admin'));
});