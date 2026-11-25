const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const { getDBStatus } = require('../config/db');
const { getMySQLStatus, saveOrder, updateOrderStatus, getAllOrders, getOrderByOrderId } = require('../config/mysql');
const authMiddleware = require('../middleware/auth');
const { initiateAirpayOrder, prepareAirpayHostedPayload, decrypt, getEncryptionKey } = require('../services/airpayService');
const { getBridgeOrder, updateBridgeOrderResult } = require('../services/bridgeService');

// In-memory fallback orders store
const memoryOrders = [];

// POST create order & initiate payment with Airpay & UPI
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      serviceId,
      serviceTitle,
      planName,
      amount,
      address,
      city,
      state,
      country,
      pincode,
      bankCode
    } = req.body;

    console.log('\n================================================================');
    console.log(`[Order API] 📥 Received order creation request`);
    console.log(`Customer: ${name} | Email: ${email} | Phone: ${phone}`);
    console.log(`Amount: ₹${amount} | Service: ${serviceTitle || serviceId} (${planName})`);

    if (!name || !email || !phone || !amount) {
      console.warn('[Order API] ⚠️ Missing required fields (name, email, phone, or amount)');
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and amount are required.'
      });
    }

    const cleanAmount = String(amount).replace(/[^\d]/g, '');
    const clientId = `TEST_${Date.now()}`;
    const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    console.log(`[Order API] Generated Order ID: ${orderId}`);

    // 1. Initiate Airpay Seamless Payment Request
    const airpayResult = await initiateAirpayOrder({
      orderId,
      amount: cleanAmount,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: address,
      customerCity: city,
      customerState: state,
      customerCountry: country,
      customerPincode: pincode,
      bankCode: bankCode || process.env.AIRPAY_BANK_CODE || 'XYZ',
      channel: process.env.AIRPAY_CHANNEL || 'pg'
    });

    // 2. Prepare Airpay Hosted Checkout Form payload
    const hostedPayload = await prepareAirpayHostedPayload({
      orderId,
      amount: cleanAmount,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: address,
      customerCity: city,
      customerState: state,
      customerCountry: country,
      customerPincode: pincode,
      bankCode: bankCode || process.env.AIRPAY_BANK_CODE || 'XYZ',
      channel: process.env.AIRPAY_CHANNEL || 'pg'
    });

    let paymentUrl = null;
    let qrString = null;

    if (airpayResult.success && airpayResult.data) {
      if (airpayResult.data.payment_url || airpayResult.data.redirect_url) {
        paymentUrl = airpayResult.data.payment_url || airpayResult.data.redirect_url;
      }
      if (airpayResult.data.qr_string || airpayResult.data.qrString || airpayResult.data.intent_url) {
        qrString = airpayResult.data.qr_string || airpayResult.data.qrString || airpayResult.data.intent_url;
      }
    }

    const orderData = {
      orderId,
      clientId,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      serviceId: serviceId || 'general',
      serviceTitle: serviceTitle || 'Service Plan',
      planName: planName || 'Standard',
      amount: Number(cleanAmount),
      currency: 'INR',
      status: 'pending',
      qrString,
      paymentUrl,
      gatewayResponse: airpayResult,
      createdAt: new Date()
    };

    // Save to MySQL if active
    if (getMySQLStatus()) {
      try {
        await saveOrder(orderData);
        console.log(`[Order API] ✅ Order ${orderId} saved to cPanel MySQL successfully.`);
        console.log('================================================================\n');
        return res.status(201).json({
          success: true,
          message: 'Order created with Airpay gateway (cPanel MySQL)',
          data: orderData,
          paymentUrl,
          qrString,
          hostedPayload,
          airpay: airpayResult
        });
      } catch (sqlErr) {
        console.error('[Order API] ❌ MySQL Order Save Error:', sqlErr.message);
      }
    }

    // Save to MongoDB if active
    if (getDBStatus()) {
      try {
        const saved = await Order.create(orderData);
        console.log(`[Order API] ✅ Order ${orderId} saved to MongoDB successfully.`);
        console.log('================================================================\n');
        return res.status(201).json({
          success: true,
          message: 'Order created with Airpay gateway',
          data: saved,
          paymentUrl,
          qrString,
          hostedPayload,
          airpay: airpayResult
        });
      } catch (dbErr) {
        console.error('[Order API] ❌ MongoDB Order Save Error:', dbErr.message);
      }
    }

    memoryOrders.unshift(orderData);
    console.log(`[Order API] ✅ Order ${orderId} saved to in-memory store.`);
    console.log('================================================================\n');
    return res.status(201).json({
      success: true,
      message: 'Order created with Airpay gateway (memory store)',
      data: orderData,
      paymentUrl,
      qrString,
      hostedPayload,
      airpay: airpayResult
    });
  } catch (error) {
    console.error('[Order API] ❌ Order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// POST & GET /api/orders/airpay-callback (Airpay Webhook / Response callback)
const handleAirpayCallback = async (req, res) => {
  try {
    console.log('\n================================================================');
    console.log(`[Airpay Callback] 🔔 Incoming ${req.method} callback received:`);
    console.log('Query:', JSON.stringify(req.query));
    console.log('Body:', JSON.stringify(req.body));
    console.log('Headers User-Agent:', req.headers['user-agent']);

    const params = { ...req.query, ...req.body };
    const { encdata } = params;
    let decryptedData = null;

    if (encdata) {
      try {
        const key = getEncryptionKey();
        decryptedData = JSON.parse(decrypt(encdata, key));
        console.log('[Airpay Callback] 🔓 Decrypted callback data:', decryptedData);
      } catch (decErr) {
        console.warn('[Airpay Callback] ⚠️ Callback decryption notice:', decErr.message);
      }
    }

    // Extract Order ID across all possible Airpay fields
    const currentOrderId =
      params.TRANSACTIONID ||
      params.orderid ||
      params.order_id ||
      params.OrderId ||
      params.ORDERID ||
      params.TRANSACTION_ID ||
      decryptedData?.order_id ||
      decryptedData?.orderid ||
      decryptedData?.TRANSACTIONID ||
      '';

    // Extract Status across all possible Airpay response indicators
    const rawStatus = String(
      params.TRANSACTIONSTATUS ||
      decryptedData?.TRANSACTIONSTATUS ||
      params.status ||
      decryptedData?.status ||
      ''
    ).trim();

    const rawMessage = String(
      params.MESSAGE ||
      decryptedData?.MESSAGE ||
      params.msg ||
      decryptedData?.msg ||
      ''
    ).toUpperCase();

    // In Airpay: TRANSACTIONSTATUS === '200' means SUCCESSFUL payment
    const isSuccess =
      rawStatus === '200' ||
      rawStatus.toLowerCase() === 'success' ||
      rawMessage.includes('SUCCESS');

    const status = isSuccess ? 'success' : 'failed';
    const gatewayDetails = decryptedData || params;

    // Check if this is an external Bridge Order (starts with BR_ or found in bridge orders)
    const isBridgeOrder = currentOrderId && currentOrderId.startsWith('BR_');

    if (isBridgeOrder) {
      console.log(`[Airpay Callback] 🌉 Processing BRIDGE Order: ${currentOrderId} (Status: ${status})`);
      const bridgeOrder = await updateBridgeOrderResult(currentOrderId, status, gatewayDetails);

      // Check if browser request
      const userAgent = (req.headers['user-agent'] || '').toLowerCase();
      const acceptHeader = (req.headers['accept'] || '').toLowerCase();
      const isBrowser =
        req.method === 'GET' ||
        acceptHeader.includes('text/html') ||
        req.headers['sec-fetch-dest'] === 'document' ||
        req.headers['sec-fetch-mode'] === 'navigate' ||
        userAgent.includes('mozilla') ||
        userAgent.includes('chrome') ||
        userAgent.includes('safari') ||
        userAgent.includes('edge') ||
        userAgent.includes('mobile');

      if (isBrowser) {
        if (bridgeOrder && bridgeOrder.returnUrl) {
          try {
            const clientReturnUrl = new URL(bridgeOrder.returnUrl);
            clientReturnUrl.searchParams.set('status', status);
            clientReturnUrl.searchParams.set('bridge_order_id', currentOrderId);
            if (bridgeOrder.clientOrderId) {
              clientReturnUrl.searchParams.set('client_order_id', bridgeOrder.clientOrderId);
            }
            clientReturnUrl.searchParams.set('amount', bridgeOrder.amount);
            console.log(`[Airpay Callback] 🌐 Browser redirecting to original client site: ${clientReturnUrl.toString()}`);
            console.log('================================================================\n');
            return res.redirect(303, clientReturnUrl.toString());
          } catch (urlErr) {
            const sep = bridgeOrder.returnUrl.includes('?') ? '&' : '?';
            const fallback = `${bridgeOrder.returnUrl}${sep}status=${status}&bridge_order_id=${encodeURIComponent(currentOrderId)}`;
            console.log(`[Airpay Callback] 🌐 Browser redirecting (fallback) to: ${fallback}`);
            console.log('================================================================\n');
            return res.redirect(303, fallback);
          }
        }
      }

      console.log('[Airpay Callback] 🤖 Responding to Bridge webhook with JSON');
      console.log('================================================================\n');
      return res.json({ success: true, message: 'Bridge callback processed', status, bridge_order_id: currentOrderId });
    }

    if (currentOrderId) {
      console.log(`[Airpay Callback] Updating direct order ${currentOrderId} status to "${status}" (rawStatus: ${rawStatus}, rawMessage: ${rawMessage})`);

      if (getMySQLStatus()) {
        try {
          await updateOrderStatus(currentOrderId, status, gatewayDetails);
        } catch (dbErr) {
          console.error('[Airpay Callback] ❌ MySQL update error:', dbErr.message);
        }
      } else if (getDBStatus()) {
        try {
          await Order.findOneAndUpdate(
            { orderId: currentOrderId },
            { status, gatewayResponse: gatewayDetails }
          );
        } catch (dbErr) {
          console.error('[Airpay Callback] ❌ Mongo update error:', dbErr.message);
        }
      }

      const mem = memoryOrders.find(o => o.orderId === currentOrderId);
      if (mem) {
        mem.status = status;
        mem.gatewayResponse = gatewayDetails;
      }
    } else {
      console.warn('[Airpay Callback] ⚠️ No order ID found in incoming callback parameters.');
    }

    // Check if this request originated from a browser (user checkout flow)
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const acceptHeader = (req.headers['accept'] || '').toLowerCase();
    const isBrowser =
      req.method === 'GET' ||
      acceptHeader.includes('text/html') ||
      req.headers['sec-fetch-dest'] === 'document' ||
      req.headers['sec-fetch-mode'] === 'navigate' ||
      userAgent.includes('mozilla') ||
      userAgent.includes('chrome') ||
      userAgent.includes('safari') ||
      userAgent.includes('edge') ||
      userAgent.includes('mobile');

    if (isBrowser) {
      const redirectUrl = `/?payment=${status}${currentOrderId ? `&orderId=${encodeURIComponent(currentOrderId)}` : ''}`;
      console.log(`[Airpay Callback] 🌐 Browser redirecting customer to frontend: ${redirectUrl}`);
      console.log('================================================================\n');
      return res.redirect(303, redirectUrl);
    }

    console.log('[Airpay Callback] 🤖 Responding to automated server webhook with JSON');
    console.log('================================================================\n');
    return res.json({ success: true, message: 'Callback processed', status, orderId: currentOrderId });
  } catch (err) {
    console.error('[Airpay Callback] ❌ Callback error:', err);
    // Even on error, if it's a browser, redirect them to the home page with failed status
    const acceptHeader = (req.headers['accept'] || '').toLowerCase();
    if (req.method === 'GET' || acceptHeader.includes('text/html') || req.headers['sec-fetch-dest'] === 'document') {
      return res.redirect(303, '/?payment=failed');
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

router.post('/airpay-callback', handleAirpayCallback);
router.get('/airpay-callback', handleAirpayCallback);

// GET all orders (Protected - Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (getMySQLStatus()) {
      const orders = await getAllOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    }
    if (getDBStatus()) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, data: orders });
    }
    return res.json({ success: true, count: memoryOrders.length, data: memoryOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single order by orderId (Protected - Admin only)
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    if (getMySQLStatus()) {
      const order = await getOrderByOrderId(orderId);
      if (order) return res.json({ success: true, data: order });
    }
    if (getDBStatus()) {
      const order = await Order.findOne({ orderId });
      if (order) return res.json({ success: true, data: order });
    }
    const mem = memoryOrders.find(o => o.orderId === orderId);
    if (mem) return res.json({ success: true, data: mem });
    return res.status(404).json({ success: false, message: 'Order not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH update status (Protected - Admin only)
router.patch('/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!['pending', 'success', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (getMySQLStatus()) {
      await updateOrderStatus(orderId, status, null);
      const order = await getOrderByOrderId(orderId);
      if (order) return res.json({ success: true, data: order });
    }

    if (getDBStatus()) {
      const updated = await Order.findOneAndUpdate(
        { orderId },
        { status },
        { new: true }
      );
      if (updated) return res.json({ success: true, data: updated });
    }

    const mem = memoryOrders.find(o => o.orderId === orderId);
    if (mem) {
      mem.status = status;
      return res.json({ success: true, data: mem });
    }

    return res.status(404).json({ success: false, message: 'Order not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
