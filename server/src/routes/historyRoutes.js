const express = require('express');
const { getAnalysisHistory, deleteAnalysisLog, clearAnalysisHistory } = require('../controllers/analysisController');

const router = express.Router();

// Mounted at /api/history -> GET /api/history, DELETE /api/history/:id, DELETE /api/history
router.get('/', getAnalysisHistory);
router.delete('/:id', deleteAnalysisLog);
router.delete('/', clearAnalysisHistory);

module.exports = router;
