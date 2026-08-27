const express = require('express');
const multer = require('multer');
const { analyzeAudio } = require('../controllers/analysisController');

const router = express.Router();

// Memory storage for fast streaming to Python service
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// Mounted at /api/analyze -> POST /api/analyze
router.post('/', upload.single('audio'), analyzeAudio);

module.exports = router;
