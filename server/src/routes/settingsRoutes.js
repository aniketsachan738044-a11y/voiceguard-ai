const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', getSettings);
router.post('/', updateSettings);

module.exports = router;
