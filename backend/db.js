const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "glower",
  password: "Password@123",
  database: "glower",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

module.exports = db;
