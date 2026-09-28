import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Brain, 
  Ticket, 
  History, 
  LayoutDashboard, 
  ShieldCheck, 
  PlayCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Support Chat', icon: MessageSquare },
    { to: '/memory', label: 'Your Memory', icon: Brain, badge: 'Hindsight' },
    { to: '/history', label: 'Conversations', icon: History },
    { to: '/tickets', label: 'Support Tickets', icon: Ticket },
    { to: '/demo', label: 'Memory Demo', icon: PlayCircle, highlight: true },
    { to: '/admin', label: 'Agent Admin', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : item.highlight 
                      ? 'text-amber-300 hover:bg-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 text-xs">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-200">Memory Isolated</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Each customer memory bank is strictly isolated using Hindsight <code className="text-indigo-300 font-mono text-[10px]">bank_id</code>.
        </p>
      </div>
    </aside>
  );
}
