const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase, saveDatabase, queryOne, execute, logActivity } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../config/validation');
const logger = require('../config/logger');

const router = express.Router();

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { username, password } = req.body;

    await getDatabase();
    const user = queryOne("SELECT * FROM Users WHERE UserName = ?", [username]);

    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = bcrypt.compareSync(password, user.Password);
    if (!isValid) {
      logger.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    execute("UPDATE Users SET LastLogin = datetime('now') WHERE UserName = ?", [username]);
    saveDatabase();

    // Set session (for web app)
    req.session.user = {
      username: user.UserName,
      role: user.Role
    };

    // Generate JWT (for API clients)
    const token = jwt.sign(
      { username: user.UserName, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logActivity(user.UserName, 'LOGIN', 'Users', user.UserName, null, req.ip);

    res.json({
      message: 'Login successful',
      user: { username: user.UserName, role: user.Role, email: user.Email },
      token
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  const username = req.user?.username || 'unknown';
  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    logActivity(username, 'LOGOUT', 'Users', username);
    res.json({ message: 'Logout successful' });
  });
});

// Check current session
router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

// Register new user (admin only)
router.post('/register', requireAuth, requireAdmin, registerValidation, async (req, res) => {
  try {
    const { username, password, role, email } = req.body;

    await getDatabase();
    const existing = queryOne("SELECT * FROM Users WHERE UserName = ?", [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    execute(
      "INSERT INTO Users (UserName, Password, Role, Email) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, role || 'viewer', email || null]
    );
    saveDatabase();

    logActivity(req.user.username, 'CREATE', 'Users', username, { role: role || 'viewer' }, req.ip);

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    await getDatabase();
    const { queryAll } = require('../config/db');
    const users = queryAll("SELECT UserName, Role, Email, CreatedAt, LastLogin FROM Users ORDER BY UserName");
    res.json(users);
  } catch (err) {
    logger.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify JWT token validity
router.post('/verify-token', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: { username: decoded.username, role: decoded.role } });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

module.exports = router;
