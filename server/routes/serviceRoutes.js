const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const fallbackServices = require('../data/servicesData.json');
const { getDBStatus } = require('../config/db');

// Seed helper
const seedServicesIfEmpty = async () => {
  if (!getDBStatus()) return;
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.insertMany(fallbackServices);
      console.log('🌱 Seeded 13 services into MongoDB successfully.');
    }
  } catch (err) {
    console.error('Error seeding services:', err.message);
  }
};

// GET all services
router.get('/', async (req, res) => {
  try {
    if (getDBStatus()) {
      await seedServicesIfEmpty();
      const services = await Service.find().sort({ createdAt: 1 });
      if (services && services.length > 0) {
        return res.json({ success: true, count: services.length, data: services });
      }
    }
    // Fallback to static JSON
    return res.json({ success: true, count: fallbackServices.length, data: fallbackServices });
  } catch (error) {
    console.error('Get services error:', error);
    return res.json({ success: true, count: fallbackServices.length, data: fallbackServices });
  }
});

// GET single service by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (getDBStatus()) {
      const service = await Service.findOne({ id });
      if (service) {
        return res.json({ success: true, data: service });
      }
    }
    const fallback = fallbackServices.find(s => s.id === id);
    if (!fallback) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    return res.json({ success: true, data: fallback });
  } catch (error) {
    const fallback = fallbackServices.find(s => s.id === id);
    if (fallback) return res.json({ success: true, data: fallback });
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
