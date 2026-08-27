import React from 'react';
import { ShieldAlert, X, MessageSquare, PhoneCall } from 'lucide-react';

export function AlertToast({ alertData, onClose }) {
  if (!alertData) return null;

  const { filename, riskScore, alertDetails } = alertData;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl p-5 shadow-2xl shadow-rose-950/50 flex flex-col gap-3">
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 text-rose-400 font-extrabold text-sm uppercase tracking-wide">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            AI Voice Cloning Alert Triggered!
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-1">
          <div><span className="text-slate-400">Target File:</span> <strong className="text-white font-mono">{filename}</strong></div>
          <div><span className="text-slate-400">Risk Score:</span> <strong className="text-rose-400 font-mono">{riskScore}/100 (High Risk)</strong></div>
          {alertDetails && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Twilio SMS dispatched ({alertDetails.mode === 'mock' ? 'Sandbox Mode' : 'Live'}) to {alertDetails.recipient}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
