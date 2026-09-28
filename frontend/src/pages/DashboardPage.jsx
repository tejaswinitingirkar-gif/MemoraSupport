import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { memoryAPI, ticketsAPI, conversationsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MemoryBadge from '../components/MemoryBadge';
import { 
  MessageSquare, 
  Brain, 
  Ticket, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [memories, setMemories] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memRes, tickRes, convRes] = await Promise.all([
          memoryAPI.getMemories(),
          ticketsAPI.list(),
          conversationsAPI.list()
        ]);
        setMemories(memRes.data);
        setTickets(tickRes.data);
        setConversations(convRes.data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartChat = async () => {
    try {
      const res = await conversationsAPI.create("New Support Conversation");
      navigate(`/chat?id=${res.data.id}`);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || 'Customer'} 👋
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Your AI agent is ready with long-term memory stored in bank <code className="text-indigo-300 font-mono">customer_{user?.id?.slice(0, 8)}</code>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <MemoryBadge isFallback={memories?.is_fallback} bankId={`customer_${user?.id?.slice(0, 8)}`} />
              <button
                onClick={handleStartChat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>New Conversation</span>
              </button>
            </div>
          </div>

          {/* Quick Stats & Action Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Total Memories</span>
                <Brain className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {memories?.raw_memories?.length || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Retained facts in Hindsight</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Conversations</span>
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {conversations.length}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Active customer sessions</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Open Tickets</span>
                <Ticket className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Pending support requests</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Preferences Saved</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {memories?.preferences?.length || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Communication & order preferences</p>
            </div>
          </div>

          {/* Grid Layout: Memory Breakdown + Recent Tickets */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hindsight Customer Memory Widget */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">Your Hindsight Memory</h3>
                </div>
                <Link to="/memory" className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="text-xs text-slate-500 py-6 text-center">Loading memories...</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Preferences
                    </span>
                    {memories?.preferences?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {memories.preferences.map((p, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No preferences recorded yet.</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Previous Issues
                    </span>
                    {memories?.previous_issues?.length > 0 ? (
                      <ul className="space-y-1.5 text-slate-300">
                        {memories.previous_issues.map((iss, idx) => (
                          <li key={idx} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{iss}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">No previous issues recorded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Support Tickets Widget */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">Support Tickets</h3>
                </div>
                <Link to="/tickets" className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1">
                  <span>Manage Tickets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="text-xs text-slate-500 py-6 text-center">Loading tickets...</div>
              ) : tickets.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {tickets.slice(0, 3).map((tick) => (
                    <div key={tick.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-200">{tick.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{tick.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        tick.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {tick.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No active support tickets. The AI agent resolves most queries automatically using memory!
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
