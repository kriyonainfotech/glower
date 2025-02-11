const express = require('express');
const router = express.Router();
const db = require('./db'); // Assuming this connects to your database

// Fetch all users
router.get('/users', (req, res) => {
  const query = 'SELECT id, username, email FROM users';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.status(200).json(results);
  });
});

// Add a user
router.post('/users', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(query, [username, email, password], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to add user' });
    res.status(201).json({ message: 'User added successfully' });
  });
});

// Delete a user
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete user' });
    res.status(200).json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
