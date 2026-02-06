require("dotenv").config();
const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.post("/api/auth/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();

  db.run(
    "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
    [email.toLowerCase(), passwordHash, createdAt],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({ message: "Email already registered." });
        }
        return res.status(500).json({ message: "Server error." });
      }

      const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("auth", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({ message: "Signup successful." });
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  db.get(
    "SELECT id, email, password_hash FROM users WHERE email = ?",
    [email.toLowerCase()],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Server error." });
      }
      if (!row) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const isMatch = bcrypt.compareSync(password, row.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("auth", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ message: "Login successful." });
    }
  );
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("auth");
  return res.json({ message: "Logged out." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
