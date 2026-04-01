const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE (court_number, booking_date, time_slot)
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
  safeRun("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
  safeRun("ALTER TABLE bookings ADD COLUMN original_time_slot TEXT");
  safeRun("ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed'");
  safeRun("ALTER TABLE bookings ADD COLUMN refund_cents INTEGER NOT NULL DEFAULT 0");
  safeRun('ALTER TABLE bookings ADD COLUMN cancelled_at TEXT');
  safeRun('ALTER TABLE bookings ADD COLUMN cancel_reason TEXT');
  safeRun("ALTER TABLE payments ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'none'");
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
});

module.exports = db;
