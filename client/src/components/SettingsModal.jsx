import React, { useState, useEffect } from 'react';
import { X, Sliders, BellRing, Phone, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export function SettingsModal({ isOpen, onClose, currentSettings, onSettingsUpdated }) {
  const [threshold, setThreshold] = useState(70);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [phone, setPhone] = useState('+15005550006');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (currentSettings) {
      setThreshold(currentSettings.alertThreshold ?? 70);
      setSmsEnabled(currentSettings.smsEnabled ?? true);
      setPhone(currentSettings.phoneNumber || '+15005550006');
    }
  }, [currentSettings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg('');
    try {
      const res = await api.updateSettings({
        alertThreshold: Number(threshold),
        smsEnabled,
        phoneNumber: phone
      });
      setStatusMsg('Settings saved successfully!');
      if (onSettingsUpdated) onSettingsUpdated(res.data);
      setTimeout(() => {
        setStatusMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      setStatusMsg(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
            <Sliders className="w-5 h-5" />
            VoiceGuard Alert Configuration
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {statusMsg}
          </div>
        )}

        <div className="space-y-6">
          {/* Threshold Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-indigo-400" />
                Alert Risk Threshold
              </label>
              <span className="text-sm font-mono font-extrabold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {threshold} / 100
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10 (Sensitive)</span>
              <span>70 (Recommended)</span>
              <span>95 (Strict)</span>
            </div>
          </div>

          {/* SMS Notification Toggle */}
          <div className="flex items-center justify-between bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">Twilio SMS Alerts</div>
              <div className="text-[11px] text-slate-400">Dispatch SMS when risk score &gt;= threshold</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-cyan-400" />
              Recipient Phone Number (E.164)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15005550006"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Note: Mock Sandbox mode logs SMS payload to server console if Twilio credentials are not set.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
}
