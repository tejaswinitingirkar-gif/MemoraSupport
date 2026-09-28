import React from 'react';
import { Brain, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MemoryBadge({ isFallback = false, bankId = '' }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-sm">
      <Brain className="w-3.5 h-3.5 text-indigo-400" />
      <span className="font-semibold text-slate-300">Hindsight Memory:</span>
      
      {!isFallback ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Real Engine Connected
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400" title="Running with local Hindsight adapter while server is offline">
          <AlertCircle className="w-3 h-3 text-amber-400" /> Dev Fallback Adapter Active
        </span>
      )}

      {bankId && (
        <span className="text-[10px] font-mono text-slate-500 pl-1 border-l border-slate-800">
          bank: {bankId}
        </span>
      )}
    </div>
  );
}
