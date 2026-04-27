const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const config = require('./src/utils/config');

const dbPath = path.join(__dirname, 'data', 'auth.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);

const safeRun = (sql) => {
  db.run(sql, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('DB migration error:', err.message);
    }
  });
};

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      full_name TEXT,
      phone TEXT,
      created_at TEXT NOT NULL
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      court_number INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      original_time_slot TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      refund_cents INTEGER NOT NULL DEFAULT 0,
      cancelled_at TEXT,
      cancel_reason TEXT,
      validation_token TEXT,
      arrival_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE (court_number, booking_date, time_slot),
      UNIQUE (validation_token)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      card_last4 TEXT,
      transaction_id TEXT,
      status TEXT NOT NULL,
      refund_status TEXT NOT NULL DEFAULT 'none',
      refunded_cents INTEGER NOT NULL DEFAULT 0,
      refunded_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  );

  // Safe migrations for existing databases.
  safeRun('ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT \'customer\'');
  safeRun('ALTER TABLE users ADD COLUMN full_name TEXT');
  safeRun('ALTER TABLE users ADD COLUMN phone TEXT');
  safeRun('ALTER TABLE bookings ADD COLUMN original_time_slot TEXT');
  safeRun('ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT \'confirmed\'');
  safeRun('ALTER TABLE bookings ADD COLUMN refund_cents INTEGER NOT NULL DEFAULT 0');
  safeRun('ALTER TABLE bookings ADD COLUMN cancelled_at TEXT');
  safeRun('ALTER TABLE bookings ADD COLUMN cancel_reason TEXT');
  safeRun('ALTER TABLE bookings ADD COLUMN validation_token TEXT');
  safeRun('CREATE UNIQUE INDEX IF NOT EXISTS idx_validation_token ON bookings(validation_token) WHERE validation_token IS NOT NULL');
  safeRun('ALTER TABLE bookings ADD COLUMN arrival_status TEXT NOT NULL DEFAULT \'pending\'');
  safeRun('ALTER TABLE payments ADD COLUMN refund_status TEXT NOT NULL DEFAULT \'none\'');
  safeRun('ALTER TABLE payments ADD COLUMN refunded_cents INTEGER NOT NULL DEFAULT 0');
  safeRun('ALTER TABLE payments ADD COLUMN refunded_at TEXT');
  safeRun('ALTER TABLE payments ADD COLUMN transaction_id TEXT');

  db.run(
    `UPDATE bookings
     SET original_time_slot = time_slot
     WHERE original_time_slot IS NULL OR original_time_slot = ''`
  );

  db.run(
    `UPDATE users
     SET role = 'customer'
     WHERE role IS NULL OR role = ''`
  );

  const adminPasswordHash = bcrypt.hashSync(config.admin.password, 12);
  config.admin.emails.forEach((email) => {
    db.run(
      `INSERT INTO users (email, password_hash, role, full_name, phone, created_at)
       VALUES (?, ?, 'admin', ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         password_hash = excluded.password_hash,
         role = 'admin',
         full_name = COALESCE(NULLIF(users.full_name, ''), excluded.full_name),
         phone = COALESCE(NULLIF(users.phone, ''), excluded.phone)` ,
      [email, adminPasswordHash, config.admin.name, config.admin.phone, new Date().toISOString()]
    );
  });
});

module.exports = db;
