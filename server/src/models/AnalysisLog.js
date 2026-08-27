const mongoose = require('mongoose');

const analysisLogSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  durationSeconds: { type: Number, required: true },
  fileSize: { type: Number, required: true },
  riskScore: { type: Number, required: true },
  verdict: { type: String, enum: ['genuine', 'spoofed'], required: true },
  riskLabel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  confidence: { type: Number, required: true },
  modelInfo: { type: String },
  featuresSummary: {
    spectral_flatness_score: Number,
    pitch_consistency_score: Number,
    high_freq_artifact_ratio: Number,
    acoustic_naturalness: Number,
    spectral_centroid_hz: Number,
    pitch_jitter: Number,
    delta_mfcc_var: Number
  },
  alertTriggered: { type: Boolean, default: false },
  alertDetails: {
    channel: String,
    status: String,
    sid: String,
    recipient: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnalysisLog', analysisLogSchema);
