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

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@modevia.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const jwtSecret = process.env.JWT_SECRET || 'modevia_jwt_secret_key_2026_super_secure';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // Verify admin credentials
    if (identifier !== adminEmail && identifier !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    if (password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: adminEmail,
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
        email: adminEmail,
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
