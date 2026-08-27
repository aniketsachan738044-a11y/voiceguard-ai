const AnalysisLog = require('../models/AnalysisLog');
const Settings = require('../models/Settings');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { analyzeAudioWithMLService } = require('../services/mlService');
const { triggerVoiceGuardAlert } = require('../services/alertService');

const getCurrentSettings = async () => {
  if (getIsConnected()) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ alertThreshold: 70, smsEnabled: true, phoneNumber: '+15005550006' });
    }
    return settings;
  }
  return getMemoryStore().settings;
};

const analyzeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No audio file provided.' });
    }

    const { originalname, buffer, mimetype, size } = req.file;

    // 1. Send file to Python ML microservice
    const mlResult = await analyzeAudioWithMLService(buffer, originalname, mimetype);

    // 2. Fetch current alert settings
    const settings = await getCurrentSettings();
    const threshold = settings.alertThreshold || 70;
    const smsEnabled = settings.smsEnabled !== false;
    const recipientPhone = settings.phoneNumber || '+15005550006';

    // 3. Check if alert threshold is crossed
    let alertInfo = { alertTriggered: false, alertDetails: { channel: 'None', status: 'not_triggered' } };
    if (mlResult.risk_score >= threshold && smsEnabled) {
      alertInfo = await triggerVoiceGuardAlert({
        filename: originalname,
        riskScore: mlResult.risk_score,
        riskLabel: mlResult.risk_label,
        threshold,
        recipientPhone
      });
    }

    // 4. Save analysis log
    const logData = {
      filename: originalname,
      durationSeconds: mlResult.duration_seconds,
      fileSize: size,
      riskScore: mlResult.risk_score,
      verdict: mlResult.verdict,
      riskLabel: mlResult.risk_label,
      confidence: mlResult.confidence,
      modelInfo: mlResult.model_info,
      featuresSummary: mlResult.features_summary,
      alertTriggered: alertInfo.alertTriggered,
      alertDetails: alertInfo.alertDetails,
      createdAt: new Date()
    };

    let savedLog;
    if (getIsConnected()) {
      savedLog = await AnalysisLog.create(logData);
    } else {
      const memoryLog = { _id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...logData };
      getMemoryStore().logs.unshift(memoryLog);
      savedLog = memoryLog;
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: savedLog._id,
        filename: savedLog.filename,
        durationSeconds: savedLog.durationSeconds,
        fileSize: savedLog.fileSize,
        riskScore: savedLog.riskScore,
        verdict: savedLog.verdict,
        riskLabel: savedLog.riskLabel,
        confidence: savedLog.confidence,
        modelInfo: savedLog.modelInfo,
        featuresSummary: savedLog.featuresSummary,
        alertTriggered: savedLog.alertTriggered,
        alertDetails: savedLog.alertDetails,
        threshold,
        createdAt: savedLog.createdAt
      }
    });

  } catch (error) {
    console.error('[Analysis Error]', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred during voice analysis.'
    });
  }
};

const getAnalysisHistory = async (req, res) => {
  try {
    const { search, verdict, limit = 50 } = req.query;

    if (getIsConnected()) {
      const query = {};
      if (verdict && verdict !== 'all') {
        query.verdict = verdict;
      }
      if (search) {
        query.filename = { $regex: search, $options: 'i' };
      }

      const logs = await AnalysisLog.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
      return res.status(200).json({ status: 'success', count: logs.length, data: logs });
    } else {
      let memoryLogs = [...getMemoryStore().logs];
      if (verdict && verdict !== 'all') {
        memoryLogs = memoryLogs.filter(l => l.verdict === verdict);
      }
      if (search) {
        memoryLogs = memoryLogs.filter(l => l.filename.toLowerCase().includes(search.toLowerCase()));
      }
      return res.status(200).json({ status: 'success', count: memoryLogs.length, data: memoryLogs.slice(0, parseInt(limit)) });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteAnalysisLog = async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsConnected()) {
      await AnalysisLog.findByIdAndDelete(id);
    } else {
      const store = getMemoryStore();
      store.logs = store.logs.filter(l => l._id !== id);
    }
    return res.status(200).json({ status: 'success', message: 'Log record deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const clearAnalysisHistory = async (req, res) => {
  try {
    if (getIsConnected()) {
      await AnalysisLog.deleteMany({});
    } else {
      getMemoryStore().logs = [];
    }
    return res.status(200).json({ status: 'success', message: 'History cleared successfully.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  analyzeAudio,
  getAnalysisHistory,
  deleteAnalysisLog,
  clearAnalysisHistory
};
