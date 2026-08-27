const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  alertThreshold: { type: Number, default: 70, min: 0, max: 100 },
  smsEnabled: { type: Boolean, default: true },
  phoneNumber: { type: String, default: '+15005550006' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
