import React, { useState } from "react";
import {
  Eye, EyeOff, User, Mail, Lock, CarFront,
  Palette, Hash, Users, ShieldCheck, Zap,
  ArrowRight, Navigation, Star, Clock,
} from "lucide-react";
import { useAuthStore } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon size={14} className="text-indigo-400/70" />
        </div>
        {children}
      </div>
    </div>
  );
}

const INPUT =
  "w-full pl-10 pr-4 py-3 rounded-xl bg-[#0d1018] border border-white/[0.07] text-sm text-white placeholder-slate-700 outline-none transition-all duration-200 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 hover:border-white/[0.12]";

const SELECT = INPUT + " appearance-none cursor-pointer";

// ── Left panel trust signals ──────────────────────────────────────────────────
const TRUST = [
  { icon: Navigation, color: "text-indigo-400", bg: "bg-indigo-500/10", text: "Real-time GPS tracking on every trip" },
  { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", text: "OTP-verified pickups for your safety" },
  { icon: Star, color: "text-amber-400",  bg: "bg-amber-500/10",  text: "Rated captains — quality guaranteed" },
  { icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10", text: "Matched to a captain in under 30 s" },
];

export default function RegistrationPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole]                 = useState("user");
  const [loading, setLoading]           = useState(false);
  const { register }                    = useAuthStore();
  const navigate                        = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "",
    vehicleType: "car", color: "", plate: "", capacity: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      firstName: formData.firstName, lastName: formData.lastName,
      email: formData.email, password: formData.password,
    };
    if (role === "captain") {
      Object.assign(payload, {
        vehicleType: formData.vehicleType, color: formData.color,
        plate: formData.plate, capacity: Number(formData.capacity),
      });
    }
    const result = await register(payload, role);
    setLoading(false);
    if (result.success) {
      toast.success("Registered successfully");
      navigate("/OTP-verification");
    } else {
      toast.error(result.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#090c12] flex">

      {/* ══ LEFT PANEL — branding + trust signals ══════════════════════════════ */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 relative overflow-hidden bg-[#0d1018] border-r border-white/[0.06] p-10">

        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-indigo-600/15 blur-[100px]" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-purple-600/10 blur-[100px]" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">
            UBER <span className="text-indigo-400">X</span>
          </span>
        </div>

        {/* Main copy */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Your ride,<br />your way.
            </h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
              Join thousands of riders and captains on the platform built for speed, safety, and transparency.
            </p>
          </div>

          {/* Trust items */}
          <div className="space-y-3">
            {TRUST.map(({ icon: Icon, color, bg, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={14} className={color} />
                </div>
                <p className="text-sm text-slate-400 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {["#6366f1","#8b5cf6","#10b981","#f59e0b"].map((c) => (
                <div key={c} className="w-7 h-7 rounded-full border-2 border-[#0d1018] flex items-center justify-center"
                  style={{ background: `${c}33`, borderColor: "#0d1018" }}>
                  <User size={11} style={{ color: c }} />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600">
              <span className="text-slate-300 font-semibold">2,400+</span> rides completed this week
            </p>
          </div>
        </div>

        {/* Bottom fine print */}
        <p className="relative text-xs text-slate-700">
          Secure · Private · Always encrypted
        </p>
      </div>

      {/* ══ RIGHT PANEL — form ════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 py-12 relative overflow-hidden">

        {/* Mobile ambient blobs */}
        <div className="pointer-events-none lg:hidden absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-white">UBER<span className="text-indigo-400">X</span></span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Create your account</h1>
            <p className="text-slate-600 text-sm mt-1">Takes less than 2 minutes.</p>
          </div>

          {/* ── Role toggle ── */}
          <div className="flex p-1 bg-[#0d1018] rounded-2xl mb-7 border border-white/[0.06]">
            {[
              { id: "user",    icon: User,     label: "I want to ride" },
              { id: "captain", icon: CarFront, label: "I want to drive" },
            ].map(({ id, icon: Ic, label }) => (
              <button key={id} type="button" onClick={() => setRole(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  role === id
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-600 hover:text-slate-400"
                }`}>
                <Ic size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Field label="First Name" icon={User}>
                <input name="firstName" type="text" required minLength={3}
                  value={formData.firstName} onChange={handleChange}
                  className={INPUT} placeholder="John" />
              </Field>
              <Field label="Last Name" icon={User}>
                <input name="lastName" type="text" required minLength={3}
                  value={formData.lastName} onChange={handleChange}
                  className={INPUT} placeholder="Doe" />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email" icon={Mail}>
              <input name="email" type="email" required
                value={formData.email} onChange={handleChange}
                className={INPUT} placeholder="you@example.com" />
            </Field>

            {/* Password */}
            <Field label="Password" icon={Lock}>
              <input name="password" type={showPassword ? "text" : "password"}
                required minLength={6}
                value={formData.password} onChange={handleChange}
                className={`${INPUT} pr-12`} placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-indigo-400 transition-colors">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </Field>

            {/* ── Captain fields ── */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${role === "captain" ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="pt-5 space-y-4 border-t border-white/[0.06]">

                {/* Section label */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <ShieldCheck size={12} className="text-indigo-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vehicle Details</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Field label="Vehicle Type" icon={CarFront}>
                    <select name="vehicleType" value={formData.vehicleType}
                      onChange={handleChange} required={role === "captain"}
                      className={SELECT}>
                      <option value="car">Car</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="auto">Auto Rickshaw</option>
                    </select>
                  </Field>
                  <Field label="Seats" icon={Users}>
                    <input name="capacity" type="number" min="1"
                      required={role === "captain"}
                      value={formData.capacity} onChange={handleChange}
                      className={INPUT} placeholder="4" />
                  </Field>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Field label="Vehicle Color" icon={Palette}>
                    <input name="color" type="text" required={role === "captain"}
                      minLength={3} value={formData.color} onChange={handleChange}
                      className={INPUT} placeholder="White" />
                  </Field>
                  <Field label="Plate Number" icon={Hash}>
                    <input name="plate" type="text" required={role === "captain"}
                      minLength={3} value={formData.plate} onChange={handleChange}
                      className={`${INPUT} uppercase`} placeholder="DL 01 AB 1234" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Register as {role === "captain" ? "Captain" : "Rider"}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-700">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-800">
            By registering you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}