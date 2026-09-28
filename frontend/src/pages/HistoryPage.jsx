import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { MessageSquare, History, Trash2, ArrowRight, Clock } from 'lucide-react';

export default function HistoryPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchConversations = async () => {
    try {
      const res = await conversationsAPI.list();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await conversationsAPI.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <History className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Conversation History</h1>
              <p className="text-xs text-slate-400">All past support interactions and message logs</p>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-slate-500 py-12 text-center">Loading conversation history...</div>
          ) : conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat?id=${conv.id}`)}
                  className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-200">{conv.title}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(conv.updated_at).toLocaleDateString()} {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{conv.messages?.length || 0} messages</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              No conversations found. Start a new conversation to test Hindsight memory persistence!
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
