const crypto = require('crypto');
const axios = require('axios');
const { prepareAirpayHostedPayload } = require('./airpayService');
const {
  getMySQLStatus,
  getPool,
  saveMerchant,
  getMerchantByApiKey,
  getAllMerchants,
  deleteMerchant,
  saveBridgeOrder,
  updateBridgeOrderStatus,
  getBridgeOrderByOrderId,
  getAllBridgeOrders
} = require('../config/mysql');

// In-memory fallback storage
const memoryMerchants = [
  {
    id: 1,
    merchantId: 'mch_default',
    name: 'Default Client Store',
    apiKey: 'mod_live_modevia_default_key',
    webhookUrl: '',
    returnUrl: '',
    isActive: 1,
    createdAt: new Date()
  }
];

const memoryBridgeOrders = [];

/**
 * Generate a new secure API Key
 */
function generateApiKey() {
  return 'mod_live_' + crypto.randomBytes(16).toString('hex');
}

/**
 * Find a merchant by API Key (checks MySQL or in-memory)
 */
async function findMerchantByApiKey(apiKey) {
  if (!apiKey) return null;
  const cleanKey = apiKey.trim();

  if (getMySQLStatus()) {
    try {
      const merchant = await getMerchantByApiKey(cleanKey);
      if (merchant) return merchant;
    } catch (err) {
      console.warn('[Bridge Service] MySQL merchant lookup error:', err.message);
    }
  }

  return memoryMerchants.find(m => m.apiKey === cleanKey && m.isActive) || null;
}

/**
 * Create a new merchant / API key
 */
async function createMerchant({ name, webhookUrl, returnUrl }) {
  const merchantId = 'mch_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const apiKey = generateApiKey();

  const merchantData = {
    merchantId,
    name: name || 'Merchant Store',
    apiKey,
    webhookUrl: webhookUrl || '',
    returnUrl: returnUrl || '',
    isActive: 1,
    createdAt: new Date()
  };

  if (getMySQLStatus()) {
    try {
      const saved = await saveMerchant(merchantData);
      if (saved) return saved;
    } catch (err) {
      console.warn('[Bridge Service] MySQL saveMerchant error:', err.message);
    }
  }

  merchantData.id = memoryMerchants.length + 1;
  memoryMerchants.unshift(merchantData);
  return merchantData;
}

/**
 * List all merchants
 */
async function listMerchants() {
  if (getMySQLStatus()) {
    try {
      const rows = await getAllMerchants();
      if (rows && rows.length > 0) return rows;
    } catch (err) {
      console.warn('[Bridge Service] MySQL getAllMerchants error:', err.message);
    }
  }
  return memoryMerchants;
}

/**
 * Revoke / Delete a merchant
 */
async function removeMerchant(id) {
  if (getMySQLStatus()) {
    try {
      await deleteMerchant(id);
    } catch (err) {
      console.warn('[Bridge Service] MySQL deleteMerchant error:', err.message);
    }
  }
  const idx = memoryMerchants.findIndex(m => String(m.id) === String(id) || m.merchantId === id);
  if (idx !== -1) memoryMerchants.splice(idx, 1);
  return true;
}

/**
 * Create a Bridge Order
 */
async function createBridgeOrder({
  merchant,
  clientOrderId,
  amount,
  currency = 'INR',
  customer = {},
  returnUrl,
  webhookUrl,
  protocol = 'https',
  host = 'www.modevianinehertz.in'
}) {
  const cleanAmount = parseFloat(String(amount).replace(/[^\d.]/g, '') || '0').toFixed(2);
  if (isNaN(cleanAmount) || Number(cleanAmount) <= 0) {
    throw new Error('A valid positive amount is required.');
  }

  // Resolve final return_url: priority to request, fallback to merchant settings
  const finalReturnUrl = returnUrl || merchant.returnUrl;
  if (!finalReturnUrl) {
    throw new Error('return_url is required (either in request body or configured on the merchant key).');
  }

  const finalWebhookUrl = webhookUrl || merchant.webhookUrl || '';

  // Generate Modevia Bridge Order ID
  const bridgeOrderId = `BR_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Default customer details if not supplied
  const customerName = (customer.name || customer.customerName || merchant.name || 'Customer User').trim();
  const customerEmail = (customer.email || customer.customerEmail || process.env.AIRPAY_DEFAULT_BUYER_EMAIL || 'customer@example.com').trim();
  const customerPhone = String(customer.phone || customer.customerPhone || process.env.AIRPAY_DEFAULT_BUYER_PHONE || '9999999999').replace(/[^\d]/g, '').slice(-10);

  const orderRecord = {
    bridgeOrderId,
    merchantId: merchant.merchantId,
    clientOrderId: clientOrderId ? String(clientOrderId).trim() : `CLI_${Date.now()}`,
    amount: Number(cleanAmount),
    currency,
    customerName,
    customerEmail,
    customerPhone,
    returnUrl: finalReturnUrl,
    webhookUrl: finalWebhookUrl,
    status: 'pending',
    gatewayResponse: null,
    webhookStatus: 'pending',
    createdAt: new Date()
  };

  if (getMySQLStatus()) {
    try {
      await saveBridgeOrder(orderRecord);
    } catch (err) {
      console.warn('[Bridge Service] MySQL saveBridgeOrder error:', err.message);
    }
  }

  memoryBridgeOrders.unshift(orderRecord);

  // Compute checkout URL on Modevia Bridge
  const checkoutUrl = `${protocol}://${host}/bridge/pay/${bridgeOrderId}`;

  return {
    success: true,
    message: 'Bridge order created successfully',
    bridge_order_id: bridgeOrderId,
    client_order_id: orderRecord.clientOrderId,
    amount: Number(cleanAmount),
    currency,
    checkout_url: checkoutUrl,
    status: 'pending',
    created_at: orderRecord.createdAt
  };
}

/**
 * Retrieve a bridge order by bridgeOrderId
 */
async function getBridgeOrder(bridgeOrderId) {
  if (getMySQLStatus()) {
    try {
      const order = await getBridgeOrderByOrderId(bridgeOrderId);
      if (order) return order;
    } catch (err) {
      console.warn('[Bridge Service] MySQL getBridgeOrderByOrderId error:', err.message);
    }
  }
  return memoryBridgeOrders.find(o => o.bridgeOrderId === bridgeOrderId) || null;
}

/**
 * List all bridge orders (for admin ledger)
 */
async function listBridgeOrders() {
  if (getMySQLStatus()) {
    try {
      const rows = await getAllBridgeOrders();
      if (rows && rows.length > 0) return rows;
    } catch (err) {
      console.warn('[Bridge Service] MySQL getAllBridgeOrders error:', err.message);
    }
  }
  return memoryBridgeOrders;
}

/**
 * Update bridge order status upon Airpay callback
 */
async function updateBridgeOrderResult(bridgeOrderId, status, gatewayResponse) {
  if (getMySQLStatus()) {
    try {
      await updateBridgeOrderStatus(bridgeOrderId, status, gatewayResponse);
    } catch (err) {
      console.warn('[Bridge Service] MySQL updateBridgeOrderStatus error:', err.message);
    }
  }

  const mem = memoryBridgeOrders.find(o => o.bridgeOrderId === bridgeOrderId);
  if (mem) {
    mem.status = status;
    mem.gatewayResponse = gatewayResponse;
  }

  // Trigger S2S Webhook if client defined a webhook_url
  const order = await getBridgeOrder(bridgeOrderId);
  if (order && order.webhookUrl) {
    dispatchMerchantWebhook(order, status).catch(e => {
      console.warn(`[Bridge Webhook] Dispatch error for ${bridgeOrderId}:`, e.message);
    });
  }

  return order;
}

/**
 * Asynchronously notify the client merchant server
 */
async function dispatchMerchantWebhook(order, status) {
  if (!order.webhookUrl) return;

  const payload = {
    event: `payment.${status}`,
    bridge_order_id: order.bridgeOrderId,
    client_order_id: order.clientOrderId,
    amount: order.amount,
    currency: order.currency || 'INR',
    status: status,
    timestamp: new Date().toISOString()
  };

  console.log(`[Bridge Webhook] 🚀 Sending S2S notification to ${order.webhookUrl}...`);

  try {
    const res = await axios.post(order.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Modevia-Payment-Bridge/1.0'
      },
      timeout: 8000
    });

    console.log(`[Bridge Webhook] ✅ Delivered to ${order.webhookUrl} (HTTP ${res.status})`);
    if (getMySQLStatus()) {
      await updateBridgeOrderStatus(order.bridgeOrderId, status, order.gatewayResponse, 'delivered');
    }
    const mem = memoryBridgeOrders.find(o => o.bridgeOrderId === order.bridgeOrderId);
    if (mem) mem.webhookStatus = 'delivered';
  } catch (err) {
    console.warn(`[Bridge Webhook] ⚠️ Failed delivery to ${order.webhookUrl}: ${err.message}`);
    if (getMySQLStatus()) {
      await updateBridgeOrderStatus(order.bridgeOrderId, status, order.gatewayResponse, 'failed');
    }
    const mem = memoryBridgeOrders.find(o => o.bridgeOrderId === order.bridgeOrderId);
    if (mem) mem.webhookStatus = 'failed';
  }
}

module.exports = {
  generateApiKey,
  findMerchantByApiKey,
  createMerchant,
  listMerchants,
  removeMerchant,
  createBridgeOrder,
  getBridgeOrder,
  listBridgeOrders,
  updateBridgeOrderResult,
  dispatchMerchantWebhook
};
