const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "data", "auth.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`
  );
});

module.exports = db;
