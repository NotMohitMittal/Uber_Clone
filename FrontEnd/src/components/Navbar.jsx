import React, { useState, useEffect, useRef } from "react";
import {
  Zap, Menu, X, MapPin, Shield, Star, Clock,
  ChevronDown, Car, User, ArrowRight, Smartphone,
  Navigation, Lock, CreditCard, HeartHandshake,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// ── Feature mega-menu data ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Navigation,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    title: "Live GPS Tracking",
    desc: "Watch your captain move in real-time on an interactive dark map.",
  },
  {
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Trip Safety",
    desc: "OTP-verified pickups, route monitoring & emergency share.",
  },
  {
    icon: CreditCard,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    title: "Transparent Fares",
    desc: "See the fare breakdown before you confirm — no surprises.",
  },
  {
    icon: Clock,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    title: "Instant Booking",
    desc: "Get matched to a nearby captain in under 30 seconds.",
  },
  {
    icon: Lock,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    title: "Secure Auth",
    desc: "Email OTP verification + JWT sessions keep your account safe.",
  },
  {
    icon: HeartHandshake,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    title: "Rated Captains",
    desc: "Every captain is rated after each trip. Quality guaranteed.",
  },
];

const VEHICLE_TYPES = [
  { icon: "🚗", label: "Car",        desc: "Up to 4 passengers" },
  { icon: "🛺", label: "Auto",       desc: "Budget-friendly option" },
  { icon: "🏍️", label: "Motorcycle", desc: "Beat the traffic" },
];

// ── Dropdown component ────────────────────────────────────────────────────────
function Dropdown({ label, children, align = "left" }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          open ? "text-white bg-white/[0.06]" : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 z-50 ${align === "center" ? "-translate-x-1/2 left-1/2" : "left-0"} bg-[#1a1d27] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden`}
          style={{ minWidth: 560 }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [mobileFeatures, setMobileFeatures] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const location                      = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isApp = location.pathname.startsWith("/dashboard") ||
                location.pathname.startsWith("/rides")     ||
                location.pathname.startsWith("/captain");

  // ── Compact in-app nav ────────────────────────────────────────────────────
  if (isApp) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-[#0f1117]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">
              Ride<span className="text-indigo-400">X</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              GPS Active
            </span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <User size={13} className="text-white" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // ── Marketing / landing nav ───────────────────────────────────────────────
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-[#0a0d14]/95 backdrop-blur-xl border-b border-white/[0.07] shadow-xl shadow-black/30"
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              UBER <span className="text-indigo-400">X</span>
            </span>
          </Link>

          {/* ── Desktop center nav ── */}
          <div className="hidden lg:flex items-center gap-1">

            {/* Features mega-menu */}
            <Dropdown label="Features" align="center">
              <div className="p-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                  Everything built into the ride
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
                    <div key={title}
                      className="group flex flex-col gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200 cursor-default">
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon size={15} className={color} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Dropdown>

            {/* Ride types */}
            <Dropdown label="Ride Types">
              <div className="p-4 w-64">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Vehicle options
                </p>
                <div className="space-y-1">
                  {VEHICLE_TYPES.map(({ icon, label, desc }) => (
                    <div key={label}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-default">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="text-[11px] text-slate-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Dropdown>

            {/* Simple links */}
            {[
              { label: "Safety",  href: "#safety"  },
              { label: "Pricing", href: "#pricing" },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200">
                {label}
              </a>
            ))}
          </div>

          {/* ── Right CTA ── */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link to="/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* ── Mobile toggle ── */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-[600px]" : "max-h-0"}`}>
        <div className="bg-[#0f1117] border-t border-white/[0.06] px-4 pt-4 pb-6 space-y-2">

          {/* Features accordion */}
          <button
            onClick={() => setMobileFeatures((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2"><Star size={14} className="text-indigo-400" />Features</span>
            <ChevronDown size={13} className={`text-slate-500 transition-transform ${mobileFeatures ? "rotate-180" : ""}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ${mobileFeatures ? "max-h-96" : "max-h-0"}`}>
            <div className="pl-4 pb-2 space-y-1">
              {FEATURES.map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <Icon size={13} className={`${color} mt-0.5 shrink-0`} />
                  <div>
                    <p className="text-xs font-semibold text-white">{title}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {[
            { label: "Ride Types", icon: Car,       href: "#rides"   },
            { label: "Safety",     icon: Shield,     href: "#safety"  },
            { label: "Pricing",    icon: CreditCard, href: "#pricing" },
          ].map(({ label, icon: Icon, href }) => (
            <a key={label} href={href} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <Icon size={14} className="text-slate-500" />
              {label}
            </a>
          ))}

          {/* Divider */}
          <div className="h-px bg-white/[0.06] my-2" />

          <div className="flex flex-col gap-2 pt-1">
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 rounded-xl border border-white/[0.08] text-center text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">
              Sign in
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
              Get started →
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}