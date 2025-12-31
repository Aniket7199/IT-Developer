const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();
const db = new sqlite3.Database("./database.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      status TEXT,
      position INTEGER
    )
  `);
});

// Register
app.post("/register", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  db.run(
    "INSERT INTO users (username, password) VALUES (?,?)",
    [req.body.username, hashed],
    err => {
      if (err) return res.send("User already exists");
      res.send("Registered successfully");
    }
  );
});

// Login
app.post("/login", (req, res) => {
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [req.body.username],
    async (err, user) => {
      if (!user) return res.send("Invalid login");
      const match = await bcrypt.compare(req.body.password, user.password);
      if (!match) return res.send("Invalid login");
      req.session.user = user;
      res.redirect("/dashboard.html");
    }
  );
});

// Middleware
function auth(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

// Get tasks
app.get("/tasks", auth, (req, res) => {
  db.all(
    "SELECT * FROM tasks WHERE user_id=? ORDER BY position",
    [req.session.user.id],
    (err, rows) => res.json(rows)
  );
});

// Add task
app.post("/tasks", auth, (req, res) => {
  db.run(
    "INSERT INTO tasks (user_id, title, status, position) VALUES (?,?,?,?)",
    [req.session.user.id, req.body.title, "pending", Date.now()],
    () => res.sendStatus(200)
  );
});

// Update order/status
app.post("/update", auth, (req, res) => {
  req.body.forEach(t => {
    db.run(
      "UPDATE tasks SET status=?, position=? WHERE id=?",
      [t.status, t.position, t.id]
    );
  });
  res.sendStatus(200);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
