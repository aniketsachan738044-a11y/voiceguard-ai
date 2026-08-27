import React from 'react';
import { Activity, Radio, Waves, Sparkles, Info } from 'lucide-react';

export function FeatureDiagnostics({ featuresSummary }) {
  if (!featuresSummary) return null;

  const {
    spectral_flatness_score = 50,
    pitch_consistency_score = 50,
    high_freq_artifact_ratio = 50,
    acoustic_naturalness = 50,
    spectral_centroid_hz,
    pitch_jitter
  } = featuresSummary;

  const metrics = [
    {
      title: 'Spectral Flatness Smoothness',
      score: spectral_flatness_score,
      icon: Waves,
      color: 'indigo',
      desc: 'Neural TTS vocoders generate abnormally smooth spectral envelopes in high-frequency bands.'
    },
    {
      title: 'Pitch Jitter Consistency',
      score: pitch_consistency_score,
      icon: Activity,
      color: 'violet',
      desc: 'Clones often display low micro-jitter or unnatural discrete pitch step transitions.'
    },
    {
      title: 'High-Frequency Artifacts',
      score: high_freq_artifact_ratio,
      icon: Radio,
      color: 'cyan',
      desc: 'Measures high-frequency phase ringing (>6 kHz) and spectral energy rolloff discontinuities.'
    },
    {
      title: 'Acoustic Vocal Tract Naturalness',
      score: acoustic_naturalness,
      icon: Sparkles,
      color: 'emerald',
      desc: 'Composite score evaluating frame-to-frame delta MFCC transitions and vocal tract resonance.'
    }
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-3">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Acoustic Feature Diagnostics
        </h3>
        <span className="text-xs text-slate-400 font-mono">Spectro-Temporal Analysis</span>
      </div>

      <div className="space-y-4">
        {metrics.map((m, idx) => {
          const IconComponent = m.icon;
          let barColor = 'bg-indigo-500';
          if (m.score > 70) barColor = 'bg-rose-500';
          else if (m.score > 40) barColor = 'bg-amber-500';
          else barColor = 'bg-emerald-500';

          return (
            <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-200">{m.title}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {m.score.toFixed(1)} / 100
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${m.score}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-1">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" />
                {m.desc}
              </p>
            </div>
          );
        })}
      </div>

      {(spectral_centroid_hz || pitch_jitter) && (
        <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Centroid: {spectral_centroid_hz ? `${spectral_centroid_hz} Hz` : 'N/A'}</span>
          <span>Pitch Jitter: {pitch_jitter ? pitch_jitter : 'N/A'}</span>
        </div>
      )}
    </div>
  );
}
