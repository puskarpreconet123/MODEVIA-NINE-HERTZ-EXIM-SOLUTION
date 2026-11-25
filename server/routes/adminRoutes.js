const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { prepareAirpayHostedPayload, getAirpayAccessToken } = require('../services/airpayService');
const {
  listMerchants,
  createMerchant,
  removeMerchant,
  listBridgeOrders
} = require('../services/bridgeService');
const { getMySQLStatus } = require('../config/mysql');
const { getDBStatus } = require('../config/db');

const envFilePath = path.join(__dirname, '../.env');

// Helper to update a key in .env file
function updateEnvFile(updates) {
  let content = '';
  if (fs.existsSync(envFilePath)) {
    content = fs.readFileSync(envFilePath, 'utf8');
  }

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined && val !== null) {
      process.env[key] = String(val);
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        content += `\n${key}=${val}`;
      }
    }
  }

  fs.writeFileSync(envFilePath, content, 'utf8');
}

// GET /api/admin/settings -> Fetch gateway & database configuration
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    let tokenStatus = 'Not Connected';
    try {
      const token = await getAirpayAccessToken();
      if (token) tokenStatus = 'Verified & Active ✅';
    } catch (e) {
      tokenStatus = 'Error: ' + e.message;
    }

    res.json({
      success: true,
      data: {
        merchantId: process.env.AIRPAY_MERCHANT_ID || '',
        username: process.env.AIRPAY_USERNAME || '',
        password: process.env.AIRPAY_PASSWORD || '',
        apiKey: process.env.AIRPAY_API_KEY || '',
        clientId: process.env.AIRPAY_CLIENT_ID || '',
        clientSecret: process.env.AIRPAY_CLIENT_SECRET || '',
        merchantDomain: process.env.AIRPAY_MERCHANT_DOMAIN || 'https://www.modevianinehertz.in/',
        databaseType: getMySQLStatus() ? 'MariaDB / MySQL' : (getDBStatus() ? 'MongoDB' : 'In-Memory Store'),
        tokenStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/settings -> Save updated Airpay gateway credentials
router.post('/settings', authMiddleware, async (req, res) => {
  try {
    const {
      merchantId,
      username,
      password,
      apiKey,
      clientId,
      clientSecret,
      merchantDomain
    } = req.body;

    const updates = {};
    if (merchantId !== undefined) updates.AIRPAY_MERCHANT_ID = merchantId.trim();
    if (username !== undefined) updates.AIRPAY_USERNAME = username.trim();
    if (password !== undefined) updates.AIRPAY_PASSWORD = password.trim();
    if (apiKey !== undefined) updates.AIRPAY_API_KEY = apiKey.trim();
    if (clientId !== undefined) updates.AIRPAY_CLIENT_ID = clientId.trim();
    if (clientSecret !== undefined) updates.AIRPAY_CLIENT_SECRET = clientSecret.trim();
    if (merchantDomain !== undefined) updates.AIRPAY_MERCHANT_DOMAIN = merchantDomain.trim();

    updateEnvFile(updates);

    console.log('[Admin Settings] ✅ Airpay credentials updated successfully by Admin.');

    res.json({
      success: true,
      message: 'Airpay credentials updated and persisted successfully.',
      data: {
        merchantId: process.env.AIRPAY_MERCHANT_ID,
        merchantDomain: process.env.AIRPAY_MERCHANT_DOMAIN
      }
    });
  } catch (error) {
    console.error('[Admin Settings] ❌ Error saving settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/test-payment -> Initiate custom test transaction from Admin UI
router.post('/test-payment', authMiddleware, async (req, res) => {
  try {
    const { amount, name, email, phone } = req.body;
    const numericAmount = parseFloat(String(amount || '1').replace(/[^\d.]/g, '') || '1').toFixed(2);
    const orderId = `TEST_ADM_${Date.now()}`;

    const hostedPayload = await prepareAirpayHostedPayload({
      orderId,
      amount: numericAmount,
      customerName: name || 'Admin Test User',
      customerEmail: email || 'modevianine@gmail.com',
      customerPhone: phone || '8777342997'
    });

    res.json({
      success: true,
      message: `Test payment payload prepared for ₹${numericAmount}`,
      orderId,
      amount: numericAmount,
      hostedPayload
    });
  } catch (error) {
    console.error('[Admin Test Payment] ❌ Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== Bridge Merchant & Integration Routes ====================

// GET /api/admin/merchants -> List all API keys / registered satellite clients
router.get('/merchants', authMiddleware, async (req, res) => {
  try {
    const merchants = await listMerchants();
    res.json({ success: true, data: merchants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/merchants -> Generate a new merchant API key
router.post('/merchants', authMiddleware, async (req, res) => {
  try {
    const { name, webhookUrl, returnUrl } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Merchant name is required' });
    }
    const newMerchant = await createMerchant({ name, webhookUrl, returnUrl });
    res.status(201).json({ success: true, data: newMerchant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/merchants/:id -> Revoke an API key
router.delete('/merchants/:id', authMiddleware, async (req, res) => {
  try {
    await removeMerchant(req.params.id);
    res.json({ success: true, message: 'API Key revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/bridge-orders -> List all bridge orders
router.get('/bridge-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await listBridgeOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
