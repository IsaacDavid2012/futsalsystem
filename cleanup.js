const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/auth.db');



db.serialize(() => {
  db.run("DELETE FROM payments", function(err) {
    if (err) console.error("Error deleting payments:", err);
    else console.log(`Deleted ${this.changes} payments.`);
  });
  
  db.run("DELETE FROM bookings", function(err) {
    if (err) console.error("Error deleting bookings:", err);
    else console.log(`Deleted ${this.changes} bookings.`);
  });
  
  db.run("DELETE FROM users WHERE email != 'admin@localhost.com'", function(err) {
    if (err) console.error("Error deleting users:", err);
    else console.log(`Deleted ${this.changes} users.`);
  });
});
