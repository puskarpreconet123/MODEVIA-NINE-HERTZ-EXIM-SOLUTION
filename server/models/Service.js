const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  period: { type: String, required: true },
  features: [{ type: String }],
  popular: { type: Boolean, default: false }
});

const serviceFeatureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  points: [{ type: String }]
});

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  services: [serviceFeatureSchema],
  pricing: [pricingPlanSchema]
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
