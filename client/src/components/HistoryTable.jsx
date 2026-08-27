import React, { useState } from 'react';
import { History, Search, Filter, Trash2, ShieldAlert, ShieldCheck, MessageSquare, RefreshCw } from 'lucide-react';

export function HistoryTable({ history, onSelectRecord, onDeleteRecord, onClearHistory, onRefresh, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerdict = verdictFilter === 'all' || item.verdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-xl">
      
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700/50">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Detection Logs & Analysis History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of all recorded and uploaded audio clips
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Verdicts</option>
            <option value="genuine">Genuine Only</option>
            <option value="spoofed">Spoofed Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Filename</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Verdict</th>
              <th className="py-3 px-4">SMS Alert</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No analysis records found.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => {
                const isSpoofed = item.verdict === 'spoofed';
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now';

                return (
                  <tr
                    key={item._id || item.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectRecord(item)}
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">{dateStr}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200 max-w-[180px] truncate" title={item.filename}>
                      {item.filename}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={item.riskScore >= 70 ? 'text-rose-400' : item.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}>
                        {item.riskScore?.toFixed(1)} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                          isSpoofed
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isSpoofed ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {isSpoofed ? 'Spoofed' : 'Genuine'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.alertTriggered ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-mono text-[10px]">
                          <MessageSquare className="w-3 h-3" /> SMS Sent
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecord(item._id || item.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
