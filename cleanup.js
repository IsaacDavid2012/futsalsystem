const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/auth.db');

db.run("DELETE FROM users WHERE email LIKE '%@example.com%' AND email NOT IN ('admin@localhost.com')", function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`Cleanup complete. Deleted ${this.changes} test users.`);
  }
});
