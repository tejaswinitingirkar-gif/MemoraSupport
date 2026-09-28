import React, { useState, useEffect } from 'react';
import { memoryAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MemoryBadge from '../components/MemoryBadge';
import { 
  Brain, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Package,
  Info,
  RefreshCw,
  Filter
} from 'lucide-react';

const CATEGORY_STYLES = {
  preference: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', label: 'Preference' },
  communication_preference: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', label: 'Communication' },
  solution: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Successful Solution' },
  issue: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Previous Issue' },
  unresolved: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Unresolved' },
  order_information: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', label: 'Order Info' },
  account_information: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', label: 'Account Info' },
  important_fact: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Important Fact' },
};

export default function MemoryPage() {
  const [memories, setMemories] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await memoryAPI.getMemories();
      setMemories(res.data);
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const rawList = memories?.raw_memories || [];

  // Filter raw memories by active category and search query
  const filteredMemories = rawList.filter((m) => {
    const content = (m.content || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    // Category filter
    if (activeCategory === 'preferences') {
      if (!cat.includes('preference') && !content.includes('prefer')) return false;
    } else if (activeCategory === 'issues') {
      if (!cat.includes('issue') && !content.includes('delayed') && !content.includes('failed')) return false;
    } else if (activeCategory === 'solutions') {
      if (!cat.includes('solution') && !content.includes('resolved') && !content.includes('fixed')) return false;
    } else if (activeCategory === 'unresolved') {
      if (!cat.includes('unresolved') && !content.includes('pending')) return false;
    } else if (activeCategory === 'orders') {
      if (!cat.includes('order') && !content.includes('order #')) return false;
    }

    // Search query filter
    if (query && !content.includes(query) && !cat.includes(query)) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-400" />
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Your Hindsight Memory Dashboard
                </h1>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Persistent customer memories retained by Hindsight across all support conversations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <MemoryBadge 
                isFallback={memories?.is_fallback} 
                bankId={memories?.bank_id} 
              />
              <button
                onClick={fetchMemories}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Refresh Memory Bank"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories in your Hindsight bank..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-3">
            {[
              { id: 'all', label: 'All Memories', count: rawList.length },
              { id: 'preferences', label: 'Preferences', count: memories?.preferences?.length || 0 },
              { id: 'issues', label: 'Previous Issues', count: memories?.previous_issues?.length || 0 },
              { id: 'solutions', label: 'Successful Solutions', count: memories?.successful_solutions?.length || 0 },
              { id: 'unresolved', label: 'Unresolved Issues', count: memories?.unresolved_issues?.length || 0 },
              { id: 'orders', label: 'Orders', count: memories?.orders?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeCategory === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeCategory === tab.id ? 'bg-indigo-900/60 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Memories Card Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">Loading customer memories...</div>
          ) : filteredMemories.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {filteredMemories.map((m, idx) => {
                const cat = m.category || 'important_fact';
                const style = CATEGORY_STYLES[cat] || {
                  bg: 'bg-slate-900',
                  border: 'border-slate-800',
                  text: 'text-slate-300',
                  label: cat
                };

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${style.border} ${style.bg} transition-all space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                        {style.label}
                      </span>
                      {m.importance && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          m.importance === 'high' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {m.importance} Priority
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-100 font-medium leading-relaxed">
                      {m.content}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                      <span>Learned in Support Session</span>
                      {m.created_at && (
                        <span>{new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl glass-card border border-slate-800 text-center space-y-2 mb-8">
              <Brain className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No matching memories found</h3>
              <p className="text-xs text-slate-500">
                {searchQuery ? `No memories match "${searchQuery}".` : 'No memories in this category yet.'}
              </p>
            </div>
          )}

          {/* Quick Summary Cards by Category */}
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            {/* Preferences */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-xs text-white">Preferences</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {memories?.preferences?.length > 0 ? (
                  memories.preferences.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic text-[11px]">None recorded yet</li>
                )}
              </ul>
            </div>

            {/* Previous Issues */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs text-white">Previous Issues</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {memories?.previous_issues?.length > 0 ? (
                  memories.previous_issues.map((iss, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span>{iss}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic text-[11px]">No issues recorded</li>
                )}
              </ul>
            </div>

            {/* Successful Solutions */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-white">Successful Solutions</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {memories?.successful_solutions?.length > 0 ? (
                  memories.successful_solutions.map((sol, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{sol}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic text-[11px]">No solutions recorded yet</li>
                )}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
