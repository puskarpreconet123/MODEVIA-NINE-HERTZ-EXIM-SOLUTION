const express = require('express');
const router = express.Router();
const {
  findMerchantByApiKey,
  createBridgeOrder,
  getBridgeOrder
} = require('../services/bridgeService');
const { prepareAirpayHostedPayload } = require('../services/airpayService');

// Middleware to extract API key from body, query, or standard headers
async function bridgeAuthMiddleware(req, res, next) {
  const apiKey =
    req.body?.api_key ||
    req.query?.api_key ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null) ||
    req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API Key missing. Pass "api_key" in JSON body or Authorization: Bearer <key> header.'
    });
  }

  try {
    const merchant = await findMerchantByApiKey(apiKey);
    if (!merchant) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or inactive API Key. Please verify your key in the Modevia Admin panel.'
      });
    }
    req.merchant = merchant;
    next();
  } catch (err) {
    console.error('[Bridge Auth] Error:', err);
    res.status(500).json({ success: false, message: 'Authentication verification error' });
  }
}

/**
 * POST /api/v1/bridge/orders
 * Public API for external merchant servers to initiate payments
 */
router.post('/orders', bridgeAuthMiddleware, async (req, res) => {
  try {
    const {
      amount,
      return_url,
      returnUrl,
      client_order_id,
      clientOrderId,
      webhook_url,
      webhookUrl,
      customer,
      currency
    } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Field "amount" is required.'
      });
    }

    const host = req.headers['x-forwarded-host'] || req.get('host') || 'www.modevianinehertz.in';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';

    const orderResult = await createBridgeOrder({
      merchant: req.merchant,
      clientOrderId: client_order_id || clientOrderId,
      amount,
      currency: currency || 'INR',
      customer: customer || {},
      returnUrl: return_url || returnUrl,
      webhookUrl: webhook_url || webhookUrl,
      protocol,
      host
    });

    console.log(`[Bridge API] ⚡ Order created: ${orderResult.bridge_order_id} for ₹${orderResult.amount} (${req.merchant.name})`);

    return res.status(201).json(orderResult);
  } catch (error) {
    console.error('[Bridge API] Order creation error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create bridge order'
    });
  }
});

/**
 * GET /api/v1/bridge/orders/:bridgeOrderId
 * Verification endpoint for merchant backend to verify order status
 */
router.get('/orders/:bridgeOrderId', async (req, res) => {
  try {
    const { bridgeOrderId } = req.params;
    const order = await getBridgeOrder(bridgeOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${bridgeOrderId}" not found.`
      });
    }

    return res.json({
      success: true,
      data: {
        bridge_order_id: order.bridgeOrderId,
        client_order_id: order.clientOrderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        status: order.status,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        webhook_status: order.webhookStatus,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      }
    });
  } catch (error) {
    console.error('[Bridge API] Order lookup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /bridge/pay/:bridgeOrderId
 * Browser Checkout Handoff Page (Auto-submits to Airpay under Modevia's whitelisted domain)
 */
router.get('/pay/:bridgeOrderId', async (req, res) => {
  try {
    const { bridgeOrderId } = req.params;
    const order = await getBridgeOrder(bridgeOrderId);

    if (!order) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>Payment Link Invalid</title>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
            .card { background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: #94a3b8; font-size: 0.95rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Payment Link Not Found</h2>
            <p>The requested order <code>${escapeHtml(bridgeOrderId)}</code> does not exist or has expired.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (order.status === 'success') {
      const returnUrl = new URL(order.returnUrl);
      returnUrl.searchParams.set('status', 'success');
      returnUrl.searchParams.set('bridge_order_id', order.bridgeOrderId);
      if (order.clientOrderId) returnUrl.searchParams.set('client_order_id', order.clientOrderId);
      return res.redirect(303, returnUrl.toString());
    }

    // Prepare Airpay Hosted Payload using Modevia's verified keys and whitelisted mer_dom
    const hostedPayload = await prepareAirpayHostedPayload({
      orderId: order.bridgeOrderId,
      amount: order.amount,
      customerName: order.customerName || 'Customer',
      customerEmail: order.customerEmail || 'customer@example.com',
      customerPhone: order.customerPhone || '9999999999'
    });

    // Render elegant auto-submitting checkout form
    const formInputsHtml = Object.entries(hostedPayload.fields)
      .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(String(v))}"/>`)
      .join('\n');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Modevia Secure Payment Gateway</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #0b0f19 0%, #111827 100%);
            color: #f3f4f6;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1rem;
          }
          .checkout-container {
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 16px;
            padding: 2.5rem 2rem;
            max-width: 440px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #374151;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 1.5rem auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 { margin: 0 0 0.5rem 0; font-size: 1.35rem; font-weight: 700; color: #ffffff; }
          .subtitle { color: #9ca3af; font-size: 0.9rem; margin-bottom: 1.5rem; }
          .order-box {
            background: #111827;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            border: 1px solid #2d3748;
            text-align: left;
          }
          .order-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.88rem;
            margin-bottom: 0.5rem;
            color: #9ca3af;
          }
          .order-row:last-child { margin-bottom: 0; }
          .order-row strong { color: #f9fafb; }
          .price-row strong { color: #10b981; font-size: 1.1rem; }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            padding: 0.35rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.95rem;
            transition: background 0.2s;
          }
          button:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="checkout-container">
          <div class="badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            256-Bit SSL Encrypted
          </div>
          <div class="spinner"></div>
          <h2>Redirecting to Payment Gateway</h2>
          <p class="subtitle">Please wait while we connect securely with Airpay...</p>

          <div class="order-box">
            <div class="order-row">
              <span>Order ID:</span>
              <strong>${escapeHtml(order.bridgeOrderId)}</strong>
            </div>
            <div class="order-row price-row">
              <span>Total Payable:</span>
              <strong>₹${Number(order.amount).toFixed(2)}</strong>
            </div>
          </div>

          <form id="airpayForm" method="POST" action="${escapeHtml(hostedPayload.actionUrl)}">
            ${formInputsHtml}
            <noscript>
              <button type="submit">Click Here to Pay ₹${Number(order.amount).toFixed(2)}</button>
            </noscript>
          </form>

          <script>
            // Automatically submit after DOM loads
            window.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                document.getElementById('airpayForm').submit();
              }, 400);
            });
          </script>
        </div>
      </body>
      </html>
    `;

    return res.send(html);
  } catch (error) {
    console.error('[Bridge Pay] Error preparing hosted checkout:', error);
    return res.status(500).send(`<h3>Error initiating payment gateway</h3><p>${escapeHtml(error.message)}</p>`);
  }
});

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = router;
