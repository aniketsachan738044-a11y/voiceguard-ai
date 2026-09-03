import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioInputSection } from './components/AudioInputSection';
import { RiskGauge } from './components/RiskGauge';
import { FeatureDiagnostics } from './components/FeatureDiagnostics';
import { HistoryTable } from './components/HistoryTable';
import { SettingsModal } from './components/SettingsModal';
import { AlertToast } from './components/AlertToast';
import { api } from './services/api';
import { ShieldCheck, ShieldAlert, Cpu, Sparkles, Layers, Info } from 'lucide-react';

export default function App() {
  const [isOnline, setIsOnline] = useState(false);
  const [modelInfo, setModelInfo] = useState('AASIST3 Engine');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [globalError, setGlobalError] = useState('');

  // Initial Load
  useEffect(() => {
    checkHealth();
    fetchHistory();
    fetchSettings();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.checkHealth();
      setIsOnline(true);
      if (res.model) setModelInfo(res.model);
    } catch (err) {
      setIsOnline(false);
      // Don't show error banner for background health checks
    }
  };

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await api.getHistory();
      if (res.data) setHistory(res.data);
    } catch (err) {
      // Silent fail for background data fetch
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.data) setSettings(res.data);
    } catch (err) {
      // Silent fail for background settings fetch
    }
  };

  const handleAnalyzeAudio = async (audioBlobOrFile, filename) => {
    setIsLoading(true);
    setGlobalError('');
    try {
      const response = await api.analyzeAudio(audioBlobOrFile, filename);
      if (response.status === 'success' && response.data) {
        const result = response.data;
        setCurrentAnalysis(result);
        setIsOnline(true); // Mark as online since analysis succeeded

        // Check if alert was triggered
        if (result.alertTriggered) {
          setActiveAlert({
            filename: result.filename,
            riskScore: result.riskScore,
            alertDetails: result.alertDetails
          });
        }

        // Refresh History
        fetchHistory();
      }
    } catch (err) {
      console.error("Analysis Error:", err);
      const errMsg = err.response?.data?.message || err.message || 'Audio analysis failed.';
      setGlobalError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await api.deleteHistoryItem(id);
      fetchHistory();
    } catch (err) {
      console.error("Delete log failed:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all analysis history?")) return;
    try {
      await api.clearHistory();
      fetchHistory();
      setCurrentAnalysis(null);
    } catch (err) {
      console.error("Clear logs failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOnline={isOnline}
        modelInfo={modelInfo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Smart India Hackathon Prototype (SIH26104)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Real-Time AI Voice Cloning & Deepfake Detection
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Detect synthetic speech, cloned audio, and generative deepfakes using deep neural spectro-temporal feature extraction models. Automatically triggers SMS alerts when risk thresholds are exceeded.
            </p>
          </div>
        </div>

        {globalError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{globalError}</span>
            </div>
            <button onClick={() => setGlobalError('')} className="text-xs hover:underline">Dismiss</button>
          </div>
        )}

        {/* Top Section: Audio Input & Analysis Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Audio Recorder / Uploader */}
          <div className="lg:col-span-6 space-y-6">
            <AudioInputSection onAnalyze={handleAnalyzeAudio} isLoading={isLoading} />
          </div>

          {/* Right Column: Risk Gauge & Acoustic Diagnostics */}
          <div className="lg:col-span-6 space-y-6">
            {currentAnalysis ? (
              <>
                <RiskGauge analysisResult={currentAnalysis} />
                <FeatureDiagnostics featuresSummary={currentAnalysis.featuresSummary} />
              </>
            ) : (
              <div className="bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">No Audio Analyzed Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Record a 5–15s voice clip or drag & drop an audio file on the left to view real-time risk scores and acoustic diagnostic metrics.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Section: History & Logs Table */}
        <HistoryTable
          history={history}
          onSelectRecord={(item) => setCurrentAnalysis(item)}
          onDeleteRecord={handleDeleteHistory}
          onClearHistory={handleClearHistory}
          onRefresh={fetchHistory}
          isLoading={isHistoryLoading}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>VoiceGuard AI</strong> — SIH26104 Prototype | Powered by FastAPI, Express, PyTorch &amp; React
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">AASIST3 Engine</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Twilio Alerting</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">MongoDB Logging</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={settings}
        onSettingsUpdated={(newSettings) => setSettings(newSettings)}
      />

      {/* Alert Toast Notification */}
      <AlertToast
        alertData={activeAlert}
        onClose={() => setActiveAlert(null)}
      />

    </div>
  );
}
