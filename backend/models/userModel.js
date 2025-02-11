const db = require('../db');

const User = {
  create: (username, email, password, callback) => {
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, password], (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        return callback(err, null);
      }
      return callback(null, result);
    });
  },

  findByEmail: (email, callback) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, result) => {
      if (err) {
        console.error('Error finding user by email:', err);
        return callback(err, null);
      }
      return callback(null, result);
    });
  },

  findById: (id, callback) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error finding user by ID:', err);
        return callback(err, null);
      }
      return callback(null, result);
    });
  },

  updatePassword: (id, newPassword, callback) => {
    const sql = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(sql, [newPassword, id], (err, result) => {
      if (err) {
        console.error('Error updating user password:', err);
        return callback(err, null);
      }
      return callback(null, result);
    });
  }
};

module.exports = User;