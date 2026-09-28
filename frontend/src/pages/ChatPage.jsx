import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { conversationsAPI, chatAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MemoryBadge from '../components/MemoryBadge';
import MemoryDrawer from '../components/MemoryDrawer';
import { 
  Send, 
  Brain, 
  Plus, 
  MessageSquare, 
  Bot, 
  User as UserIcon, 
  Ticket, 
  Sparkles,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('id');
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [hindsightStatus, setHindsightStatus] = useState(null);
  const [ticketAlert, setTicketAlert] = useState(null);
  const [latestLearnedAlert, setLatestLearnedAlert] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (conversationIdParam) {
      fetchConversation(conversationIdParam);
    } else {
      handleCreateNewConversation();
    }
  }, [conversationIdParam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const fetchConversation = async (id) => {
    try {
      const res = await conversationsAPI.get(id);
      setConversation(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      const res = await conversationsAPI.create("New Support Conversation");
      setConversation(res.data);
      setMessages(res.data.messages || []);
      navigate(`/chat?id=${res.data.id}`, { replace: true });
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userText = inputMessage;
    setInputMessage('');
    setSending(true);
    setTicketAlert(null);
    setLatestLearnedAlert(null);

    // Optimistically append user message to UI
    const tempUserMsg = {
      id: Date.now().toString(),
      sender: 'customer',
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatAPI.sendMessage(conversation?.id, userText);
      const data = res.data;

      setHindsightStatus(data.hindsight_status);

      if (data.ticket_created) {
        setTicketAlert(data.ticket_created);
      }

      if (data.new_memories_saved && data.new_memories_saved.length > 0) {
        setLatestLearnedAlert(data.new_memories_saved);
      }

      const agentMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        content: data.response,
        memories_used: data.memories_used,
        new_memories_saved: data.new_memories_saved,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col bg-slate-950/40 relative">
          {/* Header */}
          <div className="border-b border-slate-800 p-4 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{conversation?.title || 'AI Support Agent'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Online
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Persistent Customer Memory Active &bull; Bank: <code className="text-indigo-300 font-mono text-[10px]">{hindsightStatus?.bank_id || 'customer_bank'}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MemoryBadge 
                isFallback={hindsightStatus?.is_fallback} 
                bankId={hindsightStatus?.bank_id} 
              />
              <button
                onClick={handleCreateNewConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Ticket Alert Banner */}
          {ticketAlert && (
            <div className="m-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Support Ticket Auto-Opened:</strong> #{ticketAlert.id.slice(0, 8)} ({ticketAlert.title})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold">
                {ticketAlert.status}
              </span>
            </div>
          )}

          {/* Real-Time Learning Toast Banner */}
          {latestLearnedAlert && latestLearnedAlert.length > 0 && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <div>
                  <strong className="font-semibold text-emerald-200">
                    🧠 Learned {latestLearnedAlert.length} new {latestLearnedAlert.length === 1 ? 'memory' : 'memories'}:
                  </strong>{' '}
                  <span className="text-emerald-300">
                    {latestLearnedAlert.map(m => m.content).join(' • ')}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setLatestLearnedAlert(null)}
                className="text-[10px] text-emerald-400/80 hover:text-emerald-200 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'customer';
              let memoriesUsed = [];
              if (msg.memories_json) {
                try {
                  memoriesUsed = JSON.parse(msg.memories_json);
                } catch (e) {}
              } else if (msg.memories_used) {
                memoriesUsed = msg.memories_used;
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                      : 'bg-slate-900 border border-slate-800 text-indigo-400'
                  }`}>
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Memories Used Drawer */}
                    {!isUser && <MemoryDrawer memories={memoriesUsed} />}

                    {/* Inline Learning Indicator under Agent Message */}
                    {!isUser && msg.new_memories_saved && msg.new_memories_saved.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 max-w-xl">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Learned {msg.new_memories_saved.length} new {msg.new_memories_saved.length === 1 ? 'memory' : 'memories'}:</span>
                        </div>
                        <ul className="space-y-1 pl-1">
                          {msg.new_memories_saved.map((m, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{m.content}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 font-mono uppercase">
                                {m.category}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-3 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Recalling Hindsight memories & generating personalized response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about orders, request refunds, state preferences..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
