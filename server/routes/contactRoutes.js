const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { getDBStatus } = require('../config/db');
const { getMySQLStatus, saveContact, getAllContacts } = require('../config/mysql');
const authMiddleware = require('../middleware/auth');

const memoryContacts = [];

// POST submit contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    const contactData = {
      name,
      email,
      phone: phone || '',
      message,
      status: 'new',
      createdAt: new Date()
    };

    if (getMySQLStatus()) {
      try {
        const saved = await saveContact(contactData);
        return res.status(201).json({
          success: true,
          message: 'Message sent successfully! We will get back to you soon.',
          data: saved
        });
      } catch (sqlErr) {
        console.error('[Contact API] ❌ MySQL Contact Save Error:', sqlErr.message);
      }
    }

    if (getDBStatus()) {
      try {
        const saved = await Contact.create(contactData);
        return res.status(201).json({
          success: true,
          message: 'Message sent successfully! We will get back to you soon.',
          data: saved
        });
      } catch (dbErr) {
        console.error('[Contact API] ❌ MongoDB Contact Save Error:', dbErr.message);
      }
    }

    memoryContacts.unshift(contactData);
    return res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: contactData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all contact messages (Protected - Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (getMySQLStatus()) {
      const contacts = await getAllContacts();
      return res.json({ success: true, count: contacts.length, data: contacts });
    }
    if (getDBStatus()) {
      const contacts = await Contact.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: contacts.length, data: contacts });
    }
    return res.json({ success: true, count: memoryContacts.length, data: memoryContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
