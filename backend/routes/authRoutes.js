const express = require('express');
const { signup, login } = require('../controllers/authController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Middleware for input validation
const validateInput = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  next();
};

// Signup Route
router.post('/signup', validateInput, signup);

// Login Route
router.post('/login', validateInput, login);

// Route to verify authentication
router.get('/verify', authMiddleware.authenticateToken, (req, res) => {
  res.status(200).json({ message: 'User is authenticated.', user: req.user });
});

module.exports = router;