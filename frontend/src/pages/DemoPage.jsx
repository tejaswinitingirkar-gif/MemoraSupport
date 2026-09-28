import React, { useState } from 'react';
import { demoAPI, authAPI, conversationsAPI, chatAPI, memoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MemoryBadge from '../components/MemoryBadge';
import { 
  Play, 
  Brain, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
  Bot,
  User as UserIcon,
  XCircle,
  Zap,
  Check,
  Award
} from 'lucide-react';

export default function DemoPage() {
  const { login } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [demoUser, setDemoUser] = useState(null);
  
  // Conversations
  const [conv1Id, setConv1Id] = useState(null);
  const [conv2Id, setConv2Id] = useState(null);
  const [conv3Id, setConv3Id] = useState(null);
  const [conv4Id, setConv4Id] = useState(null);
  
  // Responses
  const [conv1Response, setConv1Response] = useState(null);
  const [conv2Response, setConv2Response] = useState(null);
  const [conv3Response, setConv3Response] = useState(null);
  const [conv4Response, setConv4Response] = useState(null);

  const [bankMemories, setBankMemories] = useState(null);
  const [loading, setLoading] = useState(false);

  // STEP 1: Initialize Demo Customer
  const handleStep1 = async () => {
    setLoading(true);
    try {
      const res = await demoAPI.seed();
      setDemoUser(res.data.demo_user);
      
      const loginRes = await authAPI.login({
        email: res.data.demo_user.email,
        password: res.data.demo_user.password
      });
      login(loginRes.data.access_token, loginRes.data.user);

      // Create Conversation 1
      const convRes = await conversationsAPI.create("Conversation 1 — Initial Delay Complaint");
      setConv1Id(convRes.data.id);
      
      // Fetch fresh bank
      const memRes = await memoryAPI.getMemories();
      setBankMemories(memRes.data);

      setCurrentStep(2);
    } catch (err) {
      console.error("Step 1 failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Send Conversation 1 Message (Delay & Email Preference)
  const handleStep2 = async () => {
    setLoading(true);
    try {
      const res = await chatAPI.sendMessage(
        conv1Id, 
        "My order #4521 was delayed. I prefer email communication."
      );
      setConv1Response(res.data);
      
      const memRes = await memoryAPI.getMemories();
      setBankMemories(memRes.data);
      setCurrentStep(3);
    } catch (err) {
      console.error("Step 2 failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Start NEW Conversation 2 & Send Refund Query (Tests Cross-Conversation Recall)
  const handleStep3 = async () => {
    setLoading(true);
    try {
      const convRes = await conversationsAPI.create("Conversation 2 — Refund Inquiry");
      setConv2Id(convRes.data.id);

      const res = await chatAPI.sendMessage(
        convRes.data.id, 
        "My refund for that order hasn't arrived."
      );
      setConv2Response(res.data);

      const memRes = await memoryAPI.getMemories();
      setBankMemories(memRes.data);
      setCurrentStep(4);
    } catch (err) {
      console.error("Step 3 failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 4: Conversation 3 — Demonstrate Successful Solution Learning
  const handleStep4 = async () => {
    setLoading(true);
    try {
      const convRes = await conversationsAPI.create("Conversation 3 — Payment Issue Resolution");
      setConv3Id(convRes.data.id);

      // 1. Initial payment failure report
      await chatAPI.sendMessage(convRes.data.id, "My payment failed during checkout.");
      
      // 2. Customer confirms the solution worked
      const confirmRes = await chatAPI.sendMessage(convRes.data.id, "That worked. Thank you.");
      setConv3Response(confirmRes.data);

      const memRes = await memoryAPI.getMemories();
      setBankMemories(memRes.data);
      setCurrentStep(5);
    } catch (err) {
      console.error("Step 4 failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 5: Conversation 4 — Demonstrate Solution Recall on Recurring Problem
  const handleStep5 = async () => {
    setLoading(true);
    try {
      const convRes = await conversationsAPI.create("Conversation 4 — Recurring Payment Inquiry");
      setConv4Id(convRes.data.id);

      const res = await chatAPI.sendMessage(
        convRes.data.id, 
        "My payment failed again."
      );
      setConv4Response(res.data);

      const memRes = await memoryAPI.getMemories();
      setBankMemories(memRes.data);
      setCurrentStep(6);
    } catch (err) {
      console.error("Step 5 failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (demoUser?.id) {
      await demoAPI.resetMemory(demoUser.id);
    }
    setCurrentStep(1);
    setConv1Response(null);
    setConv2Response(null);
    setConv3Response(null);
    setConv4Response(null);
    setBankMemories(null);
  };

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
                <Play className="w-6 h-6 text-amber-400 fill-amber-400" />
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Hackathon Live Demonstration
                </h1>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Convincingly demonstrate zero-repetitive-question support, solution learning, and persistent Hindsight memory.
              </p>
            </div>

            <button
              onClick={handleResetDemo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Scenario</span>
            </button>
          </div>

          {/* 30-SECOND PROBLEM COMPARISON SHOWCASE */}
          <div className="mb-8 p-6 rounded-2xl glass-card border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/30 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                The 30-Second Problem & Solution Comparison
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Without Memory */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> WITHOUT MEMORY (Traditional Bots)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                      High Friction
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300 italic"><strong className="text-white not-italic">Customer:</strong> "My refund hasn't arrived."</p>
                    <p className="text-rose-200 bg-rose-900/20 p-2.5 rounded-lg border border-rose-500/20">
                      <strong>Basic Chatbot:</strong> "Please provide your order number and tell us how you want to be contacted."
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-rose-300/80 mt-3 border-t border-rose-500/20 pt-2">
                  ❌ Customers repeatedly forced to re-enter order IDs, preferences, and re-explain issues.
                </p>
              </div>

              {/* With Hindsight */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> WITH MEMORASUPPORT (Hindsight Active)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Zero Repetition
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300 italic"><strong className="text-white not-italic">Customer:</strong> "My refund hasn't arrived."</p>
                    <p className="text-emerald-200 bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-500/20">
                      <strong>MemoraSupport:</strong> "I remember your previous order #4521 and the earlier delivery issue. Your refund is being processed and an update has been sent to your email as preferred."
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-300/80 mt-3 border-t border-emerald-500/20 pt-2">
                  ✅ Remembers preferences, order history, and successful solutions across separate sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
            {[
              { num: 1, label: "1. Seed & Login" },
              { num: 2, label: "2. Order & Preference" },
              { num: 3, label: "3. New Conv Recall" },
              { num: 4, label: "4. Solution Learning & Reuse" }
            ].map((s) => (
              <div
                key={s.num}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  currentStep >= s.num + 1 || (s.num === 4 && currentStep >= 5)
                    ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300'
                    : currentStep === s.num
                    ? 'bg-slate-900 border-indigo-500/50 text-white shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                  currentStep > s.num
                    ? 'bg-emerald-600 text-white'
                    : currentStep === s.num
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentStep > s.num ? <Check className="w-3 h-3" /> : s.num}
                </div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step Action Cards & Live Output */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Left: Step Execution Controller */}
            <div className="space-y-4">
              {/* STAGE 1: Seed Demo User */}
              <div className={`glass-card p-5 rounded-2xl border transition-all ${
                currentStep === 1 ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stage 1</span>
                  {currentStep > 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">Authenticate Customer Alex Rivera</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Initializes customer identity and mounts isolated Hindsight memory bank <code className="text-indigo-300 font-mono">customer_alex</code>.
                </p>
                {currentStep === 1 && (
                  <button
                    onClick={handleStep1}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Initializing..." : "Start Demo & Mount Bank"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* STAGE 2: Conversation 1 - Delay & Preference */}
              <div className={`glass-card p-5 rounded-2xl border transition-all ${
                currentStep === 2 ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stage 2: Conversation 1</span>
                  {currentStep > 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">State Order & Email Preference</h3>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-3 italic">
                  "My order #4521 was delayed. I prefer email communication."
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Hindsight extracts structured memories: Order #4521, Delivery Delay, Email Preference.
                </p>
                {currentStep === 2 && (
                  <button
                    onClick={handleStep2}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Sending & Retaining..." : "Send Message & Retain Memories"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* STAGE 3: Conversation 2 - Follow Up in Brand New Session */}
              <div className={`glass-card p-5 rounded-2xl border transition-all ${
                currentStep === 3 ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stage 3: New Conversation 2</span>
                  {currentStep > 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">Ask About Refund Without Giving Order Number</h3>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-3 italic">
                  "My refund for that order hasn't arrived."
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Tests cross-session recall: AI links refund directly to order #4521 without asking Alex to repeat it.
                </p>
                {currentStep === 3 && (
                  <button
                    onClick={handleStep3}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Creating Conv 2 & Recalling..." : "Launch Conv 2 & Verify Recall"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* STAGE 4: Conversation 3 - Solution Learning */}
              <div className={`glass-card p-5 rounded-2xl border transition-all ${
                currentStep === 4 ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stage 4: Conversation 3</span>
                  {currentStep > 4 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">Learn Successful Solution</h3>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-3 space-y-1">
                  <p className="italic">Customer: "My payment failed."</p>
                  <p className="text-indigo-300">Agent: "Please retry the payment after reopening the payment page."</p>
                  <p className="italic font-semibold text-emerald-300">Customer: "That worked. Thank you."</p>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Hindsight learns the verified fix and stores it under the 'solution' category.
                </p>
                {currentStep === 4 && (
                  <button
                    onClick={handleStep4}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Learning Solution..." : "Verify Solution Learning"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* STAGE 5: Conversation 4 - Solution Reuse */}
              <div className={`glass-card p-5 rounded-2xl border transition-all ${
                currentStep === 5 ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stage 5: Conversation 4</span>
                  {currentStep > 5 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">Recall Solution for Recurring Problem</h3>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-3 italic">
                  "My payment failed again."
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  AI recalls the previously successful solution and suggests retrying after reopening the payment page.
                </p>
                {currentStep === 5 && (
                  <button
                    onClick={handleStep5}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Recalling Solution..." : "Recall Past Solution"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Hindsight Memory Bank Inspector */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">Live Hindsight Memory Inspector</h3>
                </div>
                <MemoryBadge isFallback={bankMemories?.is_fallback} bankId={bankMemories?.bank_id} />
              </div>

              {/* Latest AI Response & Recalled Memories */}
              {conv4Response ? (
                <div className="mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span>Stage 5: Solution Recalled & Reused!</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                      SUCCESS
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-200 leading-relaxed font-sans">
                    {conv4Response.response}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Recalled Memories Used in Prompt:
                    </span>
                    <div className="space-y-1">
                      {conv4Response.memories_used.map((m, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5 text-[11px] text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                          <div className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{m.content}</span>
                          </div>
                          {m.reason && (
                            <span className="text-[10px] text-slate-400 pl-5 italic">
                              Why used: {m.reason}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : conv2Response ? (
                <div className="mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span>Stage 3: Cross-Conversation Recall Successful!</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                      NO RE-ASKING
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-200 leading-relaxed font-sans">
                    {conv2Response.response}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Recalled Memories Used in Prompt:
                    </span>
                    <div className="space-y-1">
                      {conv2Response.memories_used.map((m, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5 text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                          <div className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{m.content}</span>
                          </div>
                          {m.reason && (
                            <span className="text-[10px] text-slate-400 pl-5 italic">
                              Why used: {m.reason}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-6 italic">
                  Run the step-by-step scenario to see live memory retention, cross-conversation recall, and solution learning.
                </div>
              )}

              {/* Stored Bank Facts */}
              <div className="mt-auto space-y-3">
                <h4 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Current Bank State:</span>
                  <span className="text-[10px] font-mono text-indigo-400">
                    {bankMemories?.raw_memories?.length || 0} total memories
                  </span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Preferences:</span>
                    <div className="text-slate-300 font-medium">
                      {bankMemories?.preferences?.join(", ") || "None"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Previous Issues:</span>
                    <div className="text-slate-300 font-medium">
                      {bankMemories?.previous_issues?.join(", ") || "None"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Successful Solutions:</span>
                    <div className="text-emerald-300 font-medium">
                      {bankMemories?.successful_solutions?.join(", ") || "None yet"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
