import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Database, 
  Bot, 
  RefreshCw,
  Play
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>HackwithHyderabad 3.0 Hackathon Project</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          AI Customer Support with <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
            Long-Term Persistent Memory
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 font-normal leading-relaxed">
          MemoraSupport uses <strong className="text-indigo-300 font-semibold">Hindsight</strong> to remember every customer's previous conversations, issues, preferences, and solutions. No more asking customers to repeat themselves.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            to="/demo"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Hackathon Demo</span>
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <span>Try AI Support</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 text-left mb-20">
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">The Problem</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Support reps constantly ask customers for order IDs, communication preferences, and past complaints that were already discussed.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Hindsight Memory Engine</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Biomimetic Retain-Recall-Reflect memory engine maintains an isolated memory bank (<code className="text-indigo-300">bank_id</code>) for every single customer.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Hyper-Personalized AI</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The AI agent instantly recalls past order #4521 details, preferences, and open issues when a customer starts a new conversation.
            </p>
          </div>
        </div>

        {/* Architecture & Workflow Diagram */}
        <div className="glass-card p-8 rounded-3xl border border-slate-800 text-left max-w-4xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-xl text-white">System Architecture & Memory Pipeline</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-indigo-400 mb-1">1. Customer Input</div>
              <p className="text-slate-400">Message received & customer ID authenticated via JWT.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-indigo-400 mb-1">2. Recall Hindsight</div>
              <p className="text-slate-400">Multi-strategy search in <code className="text-indigo-300">bank_id</code> returns past preferences & issues.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-indigo-400 mb-1">3. Agentic Reasoning</div>
              <p className="text-slate-400">LLM prompt injected with recalled customer memory context.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-indigo-400 mb-1">4. Retain Useful Facts</div>
              <p className="text-slate-400">New long-term facts stored into Hindsight for future chats.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        MemoraSupport — Built for HackwithHyderabad 3.0 Hackathon • Persistent Customer Memory powered by Hindsight
      </footer>
    </div>
  );
}
