const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const { getDBStatus } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { initiateAirpayOrder, prepareAirpayHostedPayload, decrypt, getEncryptionKey } = require('../services/airpayService');

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

    if (!name || !email || !phone || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and amount are required.'
      });
    }

    const cleanAmount = String(amount).replace(/[^\d]/g, '');
    const clientId = `TEST_${Date.now()}`;
    const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

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

    if (getDBStatus()) {
      try {
        const saved = await Order.create(orderData);
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
        console.error('MongoDB Order Save Error:', dbErr.message);
      }
    }

    memoryOrders.unshift(orderData);
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
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// POST /api/orders/airpay-callback (Airpay Webhook / Response callback)
router.post('/airpay-callback', async (req, res) => {
  try {
    const { encdata, orderid } = req.body;
    let decryptedData = null;

    if (encdata) {
      try {
        const key = getEncryptionKey();
        decryptedData = JSON.parse(decrypt(encdata, key));
      } catch (decErr) {
        console.warn('Airpay callback decryption notice:', decErr.message);
      }
    }

    const currentOrderId = orderid || decryptedData?.order_id || decryptedData?.orderid;

    if (currentOrderId) {
      const status = decryptedData?.status === 'success' || req.body.status === 'success' ? 'success' : 'failed';
      if (getDBStatus()) {
        await Order.findOneAndUpdate(
          { orderId: currentOrderId },
          { status, gatewayResponse: decryptedData || req.body }
        );
      }
    }

    return res.json({ success: true, message: 'Callback processed' });
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all orders (Protected - Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
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
