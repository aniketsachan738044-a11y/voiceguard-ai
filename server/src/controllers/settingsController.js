const Settings = require('../models/Settings');
const { getIsConnected, getMemoryStore } = require('../config/db');

const getSettings = async (req, res) => {
  try {
    if (getIsConnected()) {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({ alertThreshold: 70, smsEnabled: true, phoneNumber: '+15005550006' });
      }
      return res.status(200).json({ status: 'success', data: settings });
    } else {
      return res.status(200).json({ status: 'success', data: getMemoryStore().settings });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { alertThreshold, smsEnabled, phoneNumber } = req.body;

    const updatedFields = {};
    if (alertThreshold !== undefined) updatedFields.alertThreshold = Number(alertThreshold);
    if (smsEnabled !== undefined) updatedFields.smsEnabled = Boolean(smsEnabled);
    if (phoneNumber !== undefined) updatedFields.phoneNumber = String(phoneNumber);
    updatedFields.updatedAt = new Date();

    if (getIsConnected()) {
      let settings = await Settings.findOne();
      if (settings) {
        Object.assign(settings, updatedFields);
        await settings.save();
      } else {
        settings = await Settings.create(updatedFields);
      }
      return res.status(200).json({ status: 'success', message: 'Settings updated successfully.', data: settings });
    } else {
      const store = getMemoryStore();
      store.settings = { ...store.settings, ...updatedFields };
      return res.status(200).json({ status: 'success', message: 'Settings updated in memory store.', data: store.settings });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
