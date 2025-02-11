const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    User.create(username, email, hashedPassword, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error creating user.' });
      }
      res.status(201).json({ message: 'User registered successfully.' });
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during signup.' });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  User.findByEmail(email, async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '2h' }
    );

    res.status(200).json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  });
};