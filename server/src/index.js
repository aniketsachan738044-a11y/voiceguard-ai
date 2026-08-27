require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const healthRoutes = require('./routes/healthRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const historyRoutes = require('./routes/historyRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/analyze', analysisRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  VoiceGuard Backend running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
