import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket, Sparkles, Bell, CheckCircle2 } from "lucide-react";

export default function ComingSoonPage({ featureName = "Child Profiles" }) {
  const navigate = useNavigate();
  const [notified, setNotified] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#090C15] font-sans relative overflow-hidden p-4">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-4000" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Left Go Back Button */}
      <div className="absolute top-8 left-8 z-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group focus:outline-none"
        >
          <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/5 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Go Back</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-[#131826]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/80 p-8 sm:p-12 z-10 relative flex flex-col items-center text-center">
        {/* Animated Icon Group */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative h-20 w-20 bg-linear-to-br from-indigo-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <Rocket className="h-10 w-10 text-purple-400 -rotate-12" />
            <Sparkles className="absolute -top-3 -right-3 h-6 w-6 text-indigo-400 animate-bounce" />
          </div>
        </div>

        {/* Text Content */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wide uppercase mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          In Development
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
          <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
            {featureName}
          </span>
          <br /> is coming soon
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
          We're working hard in the lab to bring this feature to your dashboard.
          It will be available in an upcoming update!
        </p>

        {/* Action Button */}
        <button
          onClick={() => setNotified(true)}
          disabled={notified}
          className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            notified
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
              : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 active:scale-[0.98]"
          }`}
        >
          {notified ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              We'll notify you!
            </>
          ) : (
            <>
              <Bell className="h-5 w-5 text-slate-400" />
              Notify me when it's ready
            </>
          )}
        </button>
      </div>
    </div>
  );
}
