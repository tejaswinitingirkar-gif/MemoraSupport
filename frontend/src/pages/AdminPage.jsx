import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MemoryBadge from '../components/MemoryBadge';
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Ticket, 
  Brain, 
  CheckCircle2, 
  Search,
  Sparkles,
  ChevronRight,
  Package,
  Award
} from 'lucide-react';

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metRes, custRes] = await Promise.all([
          adminAPI.getMetrics(),
          adminAPI.getCustomers()
        ]);
        setMetrics(metRes.data);
        setCustomers(custRes.data);
        if (custRes.data && custRes.data.length > 0) {
          handleSelectCustomer(custRes.data[0]);
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    try {
      const res = await adminAPI.getCustomerDetail(cust.id);
      setCustomerDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch customer detail:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Support Agent Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Business overview and customer memory deep-dive</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Total Customers</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics?.total_customers || 0}</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Active Sessions</span>
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics?.active_conversations || 0}</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Open Tickets</span>
                <Ticket className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics?.open_tickets || 0}</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Hindsight Memories</span>
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics?.total_memories || 0}</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-semibold">Verified Solutions</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metrics?.total_solutions || 0}</div>
            </div>
          </div>

          {/* Grid Layout: Customer List + Memory Inspector */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer List */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-base text-white mb-4">Customer Directory</h3>
              {loading ? (
                <div className="text-xs text-slate-500 py-6 text-center">Loading customers...</div>
              ) : customers.length > 0 ? (
                <div className="space-y-3">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedCustomer?.id === c.id
                          ? 'bg-indigo-950/40 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-white">{c.name}</h4>
                          <p className="text-[11px] text-slate-400">{c.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                              🧠 {c.memories_count || 0} memories
                            </span>
                            {c.successful_solutions?.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                                ✓ {c.successful_solutions.length} solved
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No registered customers.</div>
              )}
            </div>

            {/* Selected Customer Memory Deep Dive */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <span>Customer Hindsight Memory Bank</span>
              </h3>

              {customerDetail ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Bank Identity</span>
                      <div className="font-mono text-indigo-300 text-xs">{customerDetail.memories.bank_id}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                      Isolated
                    </span>
                  </div>

                  {/* Preferences */}
                  <div>
                    <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Stored Preferences:</span>
                    </h4>
                    {customerDetail.memories.preferences?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customerDetail.memories.preferences.map((p, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">None recorded</p>
                    )}
                  </div>

                  {/* Successful Solutions */}
                  <div>
                    <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Learned Successful Solutions:</span>
                    </h4>
                    {customerDetail.memories.successful_solutions?.length > 0 ? (
                      <ul className="space-y-1.5 text-slate-200">
                        {customerDetail.memories.successful_solutions.map((sol, idx) => (
                          <li key={idx} className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs">
                            {sol}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">No verified solutions recorded yet</p>
                    )}
                  </div>

                  {/* Previous Issues */}
                  <div>
                    <h4 className="font-bold text-slate-300 mb-2">Recorded Issues:</h4>
                    {customerDetail.memories.previous_issues?.length > 0 ? (
                      <ul className="space-y-1 text-slate-300">
                        {customerDetail.memories.previous_issues.map((iss, idx) => (
                          <li key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">{iss}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">None recorded</p>
                    )}
                  </div>

                  {/* Open Tickets */}
                  <div>
                    <h4 className="font-bold text-slate-300 mb-2">Tickets ({customerDetail.tickets?.length || 0}):</h4>
                    {customerDetail.tickets?.length > 0 ? (
                      customerDetail.tickets.map((t) => (
                        <div key={t.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between mb-1.5">
                          <span>{t.title}</span>
                          <span className={`font-bold ${t.status === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {t.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">No tickets</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Select a customer from the directory to inspect their isolated Hindsight memory bank.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
