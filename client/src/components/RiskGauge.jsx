import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export function RiskGauge({ analysisResult }) {
  if (!analysisResult) return null;

  const {
    riskScore = 0,
    verdict = 'genuine',
    riskLabel = 'Low',
    confidence = 0.90,
    filename = 'audio_sample.wav',
    durationSeconds = 5.0,
    modelInfo = 'AASIST3 Model',
    processingTimeMs = 300
  } = analysisResult;

  // Determine colors based on risk label / score
  let gaugeColor = '#22c55e'; // Green
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let Icon = ShieldCheck;

  if (riskScore >= 70) {
    gaugeColor = '#ef4444'; // Red
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    Icon = ShieldAlert;
  } else if (riskScore >= 40) {
    gaugeColor = '#f59e0b'; // Amber
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = AlertTriangle;
  }

  // Semi-circle gauge SVG calculations
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px]" title={filename}>
            {filename}
          </span>
          <span className="text-xs text-slate-400 font-mono">({durationSeconds}s)</span>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${badgeBg}`}>
          <Icon className="w-3.5 h-3.5" />
          {verdict === 'spoofed' ? 'Spoofed / AI Voice' : 'Genuine Voice'}
        </div>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg width="220" height="125" viewBox="0 0 200 115" className="transform overflow-visible">
          {/* Background Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Colored Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text Score */}
        <div className="absolute top-10 flex flex-col items-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {riskScore.toFixed(1)}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            Risk Score / 100
          </span>
          <span
            className="mt-1 text-xs font-bold px-2 py-0.5 rounded-md border"
            style={{ color: gaugeColor, borderColor: `${gaugeColor}40`, backgroundColor: `${gaugeColor}15` }}
          >
            {riskLabel} Risk
          </span>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/50">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Confidence</div>
            <div className="text-xs font-bold text-slate-100 font-mono">{(confidence * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Inference Time</div>
            <div className="text-xs font-bold text-slate-100 font-mono">{processingTimeMs || 320} ms</div>
          </div>
        </div>
      </div>

    </div>
  );
}
