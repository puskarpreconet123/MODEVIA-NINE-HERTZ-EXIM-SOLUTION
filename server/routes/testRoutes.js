const express = require('express');
const router = express.Router();
const { prepareAirpayHostedPayload, getAirpayAccessToken, getEncryptionKey } = require('../services/airpayService');
const { getMySQLStatus } = require('../config/mysql');
const { getDBStatus } = require('../config/db');

// GET /airpay-test -> Render HTML test page
router.get('/', async (req, res) => {
  const merchantId = process.env.AIRPAY_MERCHANT_ID || '363996';
  const domain = process.env.AIRPAY_MERCHANT_DOMAIN || 'https://www.modevianinehertz.in/';
  const dbType = getMySQLStatus() ? 'MariaDB / MySQL (Active ✅)' : (getDBStatus() ? 'MongoDB (Active ✅)' : 'Memory Store (Active ⚠️)');

  let oauthStatus = 'Checking...';
  let tokenSnippet = '';
  try {
    const token = await getAirpayAccessToken();
    if (token) {
      oauthStatus = 'Connected & Valid ✅';
      tokenSnippet = token.substring(0, 12) + '...';
    } else {
      oauthStatus = 'Token generation failed ❌';
    }
  } catch (e) {
    oauthStatus = 'Error: ' + e.message;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Airpay Gateway Test | Modevia Nine Hertz</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 520px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #0369a1; color: #e0f2fe; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
    p.subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .info-box { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #1e293b; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; }
    .info-value { color: #38bdf8; font-weight: 600; font-family: monospace; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; font-weight: 500; color: #cbd5e1; margin-bottom: 6px; }
    input { width: 100%; padding: 10px 14px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #f8fafc; font-size: 14px; }
    input:focus { outline: none; border-color: #38bdf8; }
    .btn-test { width: 100%; padding: 14px; border-radius: 10px; border: none; background: linear-gradient(135deg, #2563eb, #0284c7); color: #ffffff; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; }
    .btn-test:hover { background: linear-gradient(135deg, #1d4ed8, #0369a1); transform: translateY(-1px); }
    .btn-test:active { transform: translateY(0); }
    .note { text-align: center; color: #64748b; font-size: 12px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🛡️ Airpay Integration Test Suite</div>
    <h1>Airpay Payment Flow Verification</h1>
    <p class="subtitle">Test the end-to-end Airpay gateway connection with live ₹1.00 authorization.</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Merchant ID:</span><span class="info-value">${merchantId}</span></div>
      <div class="info-row"><span class="info-label">Whitelisted Domain:</span><span class="info-value">${domain}</span></div>
      <div class="info-row"><span class="info-label">Database Status:</span><span class="info-value">${dbType}</span></div>
      <div class="info-row"><span class="info-label">Airpay OAuth:</span><span class="info-value">${oauthStatus}</span></div>
      ${tokenSnippet ? `<div class="info-row"><span class="info-label">Live Token:</span><span class="info-value">${tokenSnippet}</span></div>` : ''}
    </div>

    <form method="POST" action="/airpay-test/initiate">
      <div class="form-group">
        <label>Customer Name</label>
        <input type="text" name="name" value="Puskar Roy" required>
      </div>
      <div class="form-group">
        <label>Customer Phone</label>
        <input type="tel" name="phone" value="8777342997" required>
      </div>
      <div class="form-group">
        <label>Customer Email</label>
        <input type="email" name="email" value="modevianine@gmail.com" required>
      </div>
      <div class="form-group">
        <label>Amount (INR)</label>
        <input type="text" name="amount" value="1.00" readonly style="background: #1e293b; color: #4ade80; font-weight: 700; font-size: 18px;">
      </div>

      <button type="submit" class="btn-test">
        ⚡ Pay ₹1.00 (Test Airpay Gateway)
      </button>
    </form>

    <p class="note">Submits directly to payments.airpay.co.in/pay/v4/ with registered credentials.</p>
  </div>
</body>
</html>`;

  res.send(html);
});

// POST /airpay-test/initiate -> Generates live payload and auto-submits Airpay form
router.post('/initiate', async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;
    const cleanAmount = (parseFloat(amount) || 1.00).toFixed(2);
    const orderId = `TEST_${Date.now()}`;

    const hosted = await prepareAirpayHostedPayload({
      orderId,
      amount: cleanAmount,
      customerName: name || 'Puskar Roy',
      customerEmail: email || 'modevianine@gmail.com',
      customerPhone: phone || '8777342997'
    });

    const hiddenInputs = Object.entries(hosted.fields).map(([key, val]) => {
      const safeVal = String(val).replace(/"/g, '&quot;');
      return `<input type="hidden" name="${key}" value="${safeVal}">`;
    }).join('\n    ');

    const autoSubmitHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Redirecting to Airpay Payment Gateway...</title>
  <style>
    body { background: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .spinner { border: 4px solid #334155; border-top: 4px solid #38bdf8; border-radius: 50%; width: 44px; height: 44px; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h2 { font-size: 20px; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body onload="document.getElementById('airpay_form').submit();">
  <div class="spinner"></div>
  <h2>Connecting to Airpay Secure Gateway...</h2>
  <p>Order ID: <strong>${orderId}</strong> | Amount: <strong>₹${cleanAmount}</strong></p>
  <p>Please wait, do not refresh this page.</p>

  <form id="airpay_form" method="POST" action="${hosted.actionUrl}">
    ${hiddenInputs}
  </form>
</body>
</html>`;

    res.send(autoSubmitHtml);
  } catch (error) {
    res.status(500).send(`<h3>Error initiating test payment:</h3><pre>${error.message}</pre><p><a href="/airpay-test">Go Back</a></p>`);
  }
});

module.exports = router;
