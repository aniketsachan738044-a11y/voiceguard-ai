const express = require('express');
const { getIsConnected } = require('../config/db');
const { isMockMode } = require('../config/twilio');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'VoiceGuard Express Orchestrator Backend',
    database: getIsConnected() ? 'MongoDB Connected' : 'In-Memory Store (Fallback)',
    twilioMode: isMockMode ? 'Mock Sandbox Mode' : 'Live Mode',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
