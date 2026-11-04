const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, username, userId, password } = req.body;
    const identifier = (email || username || userId || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password.'
      });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const adminUserId = (process.env.ADMIN_USER_ID || '').toLowerCase().trim();
    const adminUserPassword = process.env.ADMIN_USER_PASSWORD || '';
    const jwtSecret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured in environment variables.'
      });
    }

    // Match strictly against credentials defined in environment variables
    const isEmailMatch = adminEmail && identifier === adminEmail && password === adminPassword;
    const isUserIdMatch = adminUserId && (identifier === adminUserId || identifier === adminUserId.replace(/^m/i, '')) && password === adminUserPassword;

    if (!isEmailMatch && !isUserIdMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    const userEmail = isEmailMatch ? adminEmail : (adminUserId || 'admin');

    // Generate JWT token
    const token = jwt.sign(
      {
        email: userEmail,
        role: 'admin'
      },
      jwtSecret,
      { expiresIn }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        email: userEmail,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
