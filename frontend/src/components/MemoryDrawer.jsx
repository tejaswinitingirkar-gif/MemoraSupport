import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, Check, HelpCircle } from 'lucide-react';

const CATEGORY_COLORS = {
  preference: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  communication_preference: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  solution: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  issue: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  unresolved: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  order_information: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  account_information: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  important_fact: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

export default function MemoryDrawer({ memories = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!memories || memories.length === 0) return null;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-medium hover:bg-indigo-900/40 transition-colors shadow-sm"
      >
        <Brain className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-semibold">🧠 Memories Used ({memories.length})</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2 p-3.5 rounded-xl bg-slate-900/95 border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 max-w-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recalled from Hindsight Bank
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Hindsight Memory</span>
          </div>

          <div className="space-y-2.5">
            {memories.map((mem, idx) => {
              const content = typeof mem === 'object' ? mem.content : mem;
              const category = typeof mem === 'object' ? (mem.category || 'important_fact') : 'important_fact';
              const reason = typeof mem === 'object' ? mem.reason : null;
              const importance = typeof mem === 'object' ? mem.importance : null;
              const badgeStyle = CATEGORY_COLORS[category] || 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-slate-200 font-medium leading-relaxed">
                        {content}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
                        {category.replace('_', ' ')}
                      </span>
                      {importance === 'high' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          HIGH
                        </span>
                      )}
                    </div>
                  </div>

                  {reason && (
                    <div className="pl-5 text-[10px] text-slate-400 italic flex items-center gap-1.5">
                      <span className="text-amber-400 font-semibold not-italic">Why used:</span>
                      <span>{reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
