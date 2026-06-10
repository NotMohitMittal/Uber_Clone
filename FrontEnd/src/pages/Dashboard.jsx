import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Shield,
  Car,
  Clock,
  Star,
  ChevronRight,
  Search,
  Bell,
  Sun,
  Moon,
  Zap,
  ChevronDown,
  ArrowLeft,
  User,
  LogOut,
  UserCircle2,
  CreditCard,
  Menu,
  X,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Wifi,
  Battery,
  Signal,
  Map,
  Route,
  Milestone,
  Package,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  MessageSquare,
  Settings,
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Rocket,
  Activity,
  Globe,
  Train,
  Plane,
  Calendar,
  Edit3,
  HelpCircle,
  Bell as BellIcon,
  Award,
  Gift,
  Maximize2,
  Minimize2,
} from "lucide-react";

import { useAuthStore } from "../context/UserContext";
import { useSocketStore } from "../context/SocketContext";
import { useRideStore } from "../context/RideContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BookRide from "../components/BookRide";

// ─── FAKE DATA ────────────────────────────────────────────────────────────────
const RECENT_RIDES = [
  {
    id: 1,
    from: "Connaught Place",
    to: "IGI Airport",
    time: "Today, 9:14 AM",
    fare: "₹842",
    status: "completed",
    type: "intercity",
  },
  {
    id: 2,
    from: "Sector 62, Noida",
    to: "Cyber City, Gurugram",
    time: "Yesterday, 6:45 PM",
    fare: "₹387",
    status: "completed",
    type: "local",
  },
  {
    id: 3,
    from: "Lajpat Nagar",
    to: "Karol Bagh",
    time: "22 May, 11:00 AM",
    fare: "₹156",
    status: "completed",
    type: "local",
  },
];

const ALL_RIDES = [
  ...RECENT_RIDES,
  {
    id: 4,
    from: "Dwarka Sec 21",
    to: "Nehru Place",
    time: "18 May, 2:30 PM",
    fare: "₹210",
    status: "completed",
    type: "local",
  },
  {
    id: 5,
    from: "Noida Sec 18",
    to: "Connaught Place",
    time: "15 May, 8:00 AM",
    fare: "₹340",
    status: "completed",
    type: "local",
  },
  {
    id: 6,
    from: "Delhi",
    to: "Mathura",
    time: "10 May, 6:00 AM",
    fare: "₹1,100",
    status: "completed",
    type: "intercity",
  },
  {
    id: 7,
    from: "Vasant Kunj",
    to: "Saket",
    time: "5 May, 7:45 PM",
    fare: "₹120",
    status: "cancelled",
    type: "local",
  },
];

const STATS = [
  {
    label: "Total Rides",
    value: "248",
    delta: "+12%",
    icon: Car,
    color: "indigo",
  },
  {
    label: "Distance Covered",
    value: "3,841 km",
    delta: "+8%",
    icon: Route,
    color: "purple",
  },
  {
    label: "Safety Score",
    value: "99.2%",
    delta: "↑ Great",
    icon: Shield,
    color: "emerald",
  },
  {
    label: "Saved Time",
    value: "61 hrs",
    delta: "vs auto",
    icon: Clock,
    color: "amber",
  },
];

const INTERCITY = [
  {
    from: "Delhi",
    to: "Agra",
    time: "2h 30m",
    price: "₹1,299",
    seats: 3,
    icon: Car,
  },
  {
    from: "Delhi",
    to: "Jaipur",
    time: "5h 00m",
    price: "₹2,100",
    seats: 2,
    icon: Car,
  },
  {
    from: "Noida",
    to: "Lucknow",
    time: "7h 15m",
    price: "₹2,899",
    seats: 1,
    icon: Car,
  },
  {
    from: "Delhi",
    to: "Chandigarh",
    time: "4h 45m",
    price: "₹1,799",
    seats: 4,
    icon: Car,
  },
  {
    from: "Delhi",
    to: "Dehradun",
    time: "5h 30m",
    price: "₹1,999",
    seats: 2,
    icon: Car,
  },
  {
    from: "Noida",
    to: "Haridwar",
    time: "4h 00m",
    price: "₹1,649",
    seats: 3,
    icon: Car,
  },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Rides", icon: Car },
  { label: "Intercity", icon: Globe },
  { label: "Security", icon: Shield },
  { label: "Analytics", icon: BarChart3 },
  { label: "Book Ride", icon: Navigation },
];

// ─── COLOUR HELPERS ───────────────────────────────────────────────────────────
const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    dot: "bg-indigo-500",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    dot: "bg-purple-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function Avatar({ size = "w-8 h-8", text = "14px" }) {
  const { authUser } = useAuthStore();
  const first =
    authUser?.fullName?.firstName?.[0] ?? authUser?.firstName?.[0] ?? "?";
  const last =
    authUser?.fullName?.lastName?.[0] ?? authUser?.lastName?.[0] ?? "";
  return (
    <div
      className={`${size} rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0`}
      style={{ fontSize: text }}
    >
      {first}
      {last}
    </div>
  );
}

function StatCard({ stat, index }) {
  const c = colorMap[stat.color];
  return (
    <div
      className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/30 hover:bg-[#1e2133] transition-all duration-300 cursor-default"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {stat.label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}
        >
          <stat.icon size={17} className={c.text} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {stat.value}
        </p>
        <p className={`text-xs mt-1 font-semibold ${c.text}`}>
          {stat.delta} this month
        </p>
      </div>
    </div>
  );
}

// Import the real LiveTracking component
import LiveTracking from "../components/LiveTracking";

function LiveTracker() {
  const { captainLocation, rideDetails, userRideState } = useRideStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isLive = userRideState === "confirmed" || userRideState === "active";

  const captain     = rideDetails?.captain;
  const captainName = captain
    ? `${captain.fullName?.firstName ?? ""} ${captain.fullName?.lastName ?? ""}`.trim()
    : "Awaiting captain…";
  const plate       = captain?.vehicle?.plate ?? "—";
  const vehicleType = captain?.vehicle?.vehicleType ?? "";
  const initials    = captain
    ? `${captain.fullName?.firstName?.[0] ?? ""}${captain.fullName?.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className={`bg-[#1a1d27] border border-white/[0.07] rounded-2xl overflow-hidden transition-all duration-300 ${isFullscreen ? "fixed inset-0 z-[60] rounded-none border-0" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Live Tracker</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLive ? "Captain is on the way" : "Your live location · updates every 10s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${isLive ? "text-emerald-400 bg-emerald-500/10" : "text-indigo-400 bg-indigo-500/10"}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? "bg-emerald-400" : "bg-indigo-400"}`} />
            {isLive ? "LIVE" : "GPS"}
          </span>
          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen
              ? <Minimize2 size={13} className="text-slate-400" />
              : <Maximize2 size={13} className="text-slate-400" />
            }
          </button>
        </div>
      </div>

      {/* Map */}
      <div className={isFullscreen ? "" : "mx-5 mb-4"} style={isFullscreen ? { height: "calc(100% - 60px)" } : { height: 220 }}>
        <LiveTracking
          mode="user_tracking"
          captainLocation={isLive ? captainLocation : null}
          updateIntervalMs={10000}
          height="100%"
          showControls={true}
          allowFullscreen={false}
        />
      </div>

      {/* Captain info strip — only shown when ride is confirmed/active and not fullscreen */}
      {isLive && !isFullscreen && (
        <div className="mx-5 mb-5 bg-[#0f1117] rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{captainName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-400 truncate">
                {plate}{vehicleType ? ` · ${vehicleType}` : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center hover:bg-indigo-500/20 transition-colors">
              <Phone size={14} className="text-indigo-400" />
            </button>
            <button className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center hover:bg-purple-500/20 transition-colors">
              <MessageSquare size={14} className="text-purple-400" />
            </button>
          </div>
        </div>
      )}

      {/* Idle state strip */}
      {!isLive && !isFullscreen && (
        <div className="mx-5 mb-5 bg-[#0f1117] rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Navigation size={15} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">Location Active</p>
            <p className="text-[10px] text-slate-500">Book a ride to track your captain here</p>
          </div>
        </div>
      )}

      {/* Fullscreen close button overlay */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-[#1a1d27]/90 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Minimize2 size={15} className="text-white" />
        </button>
      )}
    </div>
  );
}

function SecurityVault() {
  const [revealed, setRevealed] = useState(false);
  const [score] = useState(99.2);
  const checks = [
    { label: "2FA Enabled", ok: true },
    { label: "Device Verified", ok: true },
    { label: "Trip Sharing Active", ok: true },
    { label: "Emergency Contact Set", ok: true },
    { label: "Biometric Lock", ok: false },
  ];
  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Security Vault</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your account protection status
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Shield size={17} className="text-emerald-400" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#ffffff0d"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(2 * Math.PI * 26 * score) / 100} ${2 * Math.PI * 26}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-400">
            {score}%
          </span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">
            Excellent Protection
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            Enable biometric lock to reach 100%
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0"
          >
            <span className="text-xs text-slate-300">{c.label}</span>
            {c.ok ? (
              <CheckCircle size={14} className="text-emerald-400" />
            ) : (
              <AlertCircle size={14} className="text-amber-400" />
            )}
          </div>
        ))}
      </div>
      <div className="bg-[#0f1117] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saved Payment
          </span>
          <button
            onClick={() => setRevealed((r) => !r)}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <p className="text-sm font-mono text-white tracking-widest">
          {revealed ? "4242  4242  4242  4242" : "••••  ••••  ••••  4242"}
        </p>
        <p className="text-xs text-slate-500 mt-1">Visa · Expires 08/27</p>
      </div>
    </div>
  );
}

function IntercityCard({ ride, index }) {
  return (
    <div
      className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
        <ride.icon size={18} className="text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
          <span>{ride.from}</span>
          <ArrowRight size={12} className="text-slate-500 shrink-0" />
          <span>{ride.to}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {ride.time} · {ride.seats} seat{ride.seats !== 1 ? "s" : ""} left
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-white">{ride.price}</p>
        <p className="text-[10px] text-indigo-400 font-semibold">Book →</p>
      </div>
    </div>
  );
}

// ─── PAGE VIEWS ───────────────────────────────────────────────────────────────
function DashboardView({ firstName }) {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        {/* Hero / greeting */}
        <div
          className="fade-up relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#1a1d27] p-6"
          style={{ animationDelay: "0ms" }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Good morning ☀️
          </p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
            Where to, {firstName}?
          </h1>
          <p className="text-sm text-slate-400 mb-5">
            Your next ride is just a tap away. Intercity rides available.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Home", icon: "🏠", sub: "Sector 62, Noida" },
              { label: "Work", icon: "💼", sub: "Cyber City, Gurgaon" },
              { label: "Airport", icon: "✈️", sub: "IGI Terminal 3" },
            ].map((p) => (
              <button
                key={p.label}
                className="flex items-center gap-2.5 bg-[#0f1117] border border-white/6 rounded-xl px-3 py-2 hover:border-indigo-500/40 transition-all duration-200"
              >
                <span className="text-base">{p.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">{p.label}</p>
                  <p className="text-[10px] text-slate-500">{p.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up"
          style={{ animationDelay: "80ms" }}
        >
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>

        {/* Live Tracker */}
        <div className="fade-up" style={{ animationDelay: "160ms" }}>
          <LiveTracker />
        </div>

        {/* Intercity */}
        <div className="fade-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Intercity Rides</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scheduled departures from your city
              </p>
            </div>
            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {INTERCITY.slice(0, 3).map((r, i) => (
              <IntercityCard key={i} ride={r} index={i} />
            ))}
          </div>
        </div>

        {/* Recent Rides */}
        <div
          className="fade-up bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Rides</h3>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
              All history <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {RECENT_RIDES.map((ride) => (
              <div
                key={ride.id}
                className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0 cursor-pointer hover:bg-white/2 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ride.type === "intercity" ? "bg-purple-500/10" : "bg-indigo-500/10"}`}
                >
                  {ride.type === "intercity" ? (
                    <Globe size={15} className="text-purple-400" />
                  ) : (
                    <Car size={15} className="text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                    <span className="truncate">{ride.from}</span>
                    <ArrowRight size={10} className="text-slate-500 shrink-0" />
                    <span className="truncate">{ride.to}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {ride.time}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{ride.fare}</p>
                  <span
                    className={`text-[10px] font-semibold capitalize ${ride.status === "cancelled" ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col gap-5">
        <div className="fade-up" style={{ animationDelay: "60ms" }}>
          <BookRide />
        </div>
        <div className="fade-up" style={{ animationDelay: "140ms" }}>
          <SecurityVault />
        </div>
        <div
          className="fade-up bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="text-sm font-bold text-white mb-4">Safety Features</h3>
          <div className="space-y-3">
            {[
              {
                icon: Shield,
                label: "Trip Shield",
                sub: "Every ride insured up to ₹50L",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                on: true,
              },
              {
                icon: Globe,
                label: "Live Share",
                sub: "Share trip with 3 contacts",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
                on: true,
              },
              {
                icon: Phone,
                label: "SOS Button",
                sub: "One-tap emergency call",
                color: "text-red-400",
                bg: "bg-red-500/10",
                on: true,
              },
              {
                icon: Lock,
                label: "Ride PIN",
                sub: "Verify driver before boarding",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                on: false,
              },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}
                >
                  <f.icon size={15} className={f.color} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{f.label}</p>
                  <p className="text-[10px] text-slate-500">{f.sub}</p>
                </div>
                <div
                  className={`w-8 h-4 rounded-full transition-colors duration-200 flex items-center px-0.5 ${f.on ? "bg-indigo-600" : "bg-slate-700"}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${f.on ? "translate-x-4" : "translate-x-0"}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className="fade-up rounded-2xl overflow-hidden relative p-5 border border-indigo-500/20"
          style={{
            background: "linear-gradient(135deg,#312e81 0%,#1e1b4b 100%)",
            animationDelay: "260ms",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <Zap size={15} className="text-indigo-300" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            Uber-premium pass
          </h4>
          <p className="text-xs text-indigo-200/70 mb-4">
            Unlimited rides + intercity priority booking. Save up to 40%.
          </p>
          <button className="w-full py-2 rounded-xl bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 active:scale-[0.98] transition-all duration-200">
            Get Pass · ₹399/mo
          </button>
        </div>
      </div>
    </main>
  );
}

function MyRidesView() {
  const [filter, setFilter] = useState("all");
  const filtered =
    filter === "all"
      ? ALL_RIDES
      : ALL_RIDES.filter((r) => r.type === filter || r.status === filter);
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-white">My Rides</h2>
        <p className="text-sm text-slate-500 mt-1">
          Your complete ride history
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Rides",
            value: ALL_RIDES.length,
            icon: Car,
            color: "indigo",
          },
          {
            label: "Completed",
            value: ALL_RIDES.filter((r) => r.status === "completed").length,
            icon: CheckCircle,
            color: "emerald",
          },
          {
            label: "Intercity",
            value: ALL_RIDES.filter((r) => r.type === "intercity").length,
            icon: Globe,
            color: "purple",
          },
          {
            label: "Cancelled",
            value: ALL_RIDES.filter((r) => r.status === "cancelled").length,
            icon: AlertCircle,
            color: "amber",
          },
        ].map((s, i) => {
          const c = colorMap[s.color];
          return (
            <div
              key={s.label}
              className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  {s.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}
                >
                  <s.icon size={14} className={c.text} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white">All Trips</h3>
          <div className="flex gap-1.5">
            {["all", "local", "intercity", "cancelled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold capitalize transition-colors ${filter === f ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-slate-300 bg-white/4"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map((ride) => (
            <div
              key={ride.id}
              className="flex items-center gap-3 py-3 border-b border-white/4 last:border-0 cursor-pointer hover:bg-white/2 rounded-lg px-2 -mx-2 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ride.type === "intercity" ? "bg-purple-500/10" : "bg-indigo-500/10"}`}
              >
                {ride.type === "intercity" ? (
                  <Globe size={16} className="text-purple-400" />
                ) : (
                  <Car size={16} className="text-indigo-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <span className="truncate">{ride.from}</span>
                  <ArrowRight size={10} className="text-slate-500 shrink-0" />
                  <span className="truncate">{ride.to}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{ride.time}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white">{ride.fare}</p>
                <span
                  className={`text-[10px] font-semibold capitalize ${ride.status === "cancelled" ? "text-red-400" : "text-emerald-400"}`}
                >
                  {ride.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function IntercityView() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-white">Intercity Rides</h2>
        <p className="text-sm text-slate-500 mt-1">
          Scheduled long-distance rides from your city
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Routes Available",
            value: "24",
            icon: Route,
            color: "indigo",
          },
          {
            label: "Cities Covered",
            value: "18",
            icon: MapPin,
            color: "purple",
          },
          {
            label: "Avg Savings",
            value: "38%",
            icon: TrendingUp,
            color: "emerald",
          },
        ].map((s) => {
          const c = colorMap[s.color];
          return (
            <div
              key={s.label}
              className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}
              >
                <s.icon size={16} className={c.text} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mb-3">
        <h3 className="text-sm font-bold text-white mb-1">Available Routes</h3>
        <p className="text-xs text-slate-500">
          All upcoming departures — book in advance for best prices
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {INTERCITY.map((r, i) => (
          <IntercityCard key={i} ride={r} index={i} />
        ))}
      </div>
    </main>
  );
}

function SecurityView() {
  const [toggles, setToggles] = useState({
    shield: true,
    liveShare: true,
    sos: true,
    pin: false,
    biometric: false,
    twofa: true,
  });
  const toggle = (key) => setToggles((t) => ({ ...t, [key]: !t[key] }));
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-extrabold text-white">Security Center</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account protection & ride safety
          </p>
        </div>
        <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Safety Features</h3>
          <div className="space-y-4">
            {[
              {
                key: "shield",
                icon: Shield,
                label: "Trip Shield",
                sub: "Every ride insured up to ₹50 Lakhs",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                key: "liveShare",
                icon: Globe,
                label: "Live Share",
                sub: "Share your real-time location with 3 trusted contacts",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
              },
              {
                key: "sos",
                icon: Phone,
                label: "SOS Button",
                sub: "One-tap emergency call to police & contacts",
                color: "text-red-400",
                bg: "bg-red-500/10",
              },
              {
                key: "pin",
                icon: Lock,
                label: "Ride PIN",
                sub: "Driver must enter a PIN before you board",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                key: "biometric",
                icon: Eye,
                label: "Biometric Lock",
                sub: "Lock the app with fingerprint or face ID",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                key: "twofa",
                icon: Shield,
                label: "Two-Factor Auth",
                sub: "Get an OTP every time you log in",
                color: "text-sky-400",
                bg: "bg-sky-500/10",
              },
            ].map((f) => (
              <div
                key={f.key}
                className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}
                >
                  <f.icon size={16} className={f.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
                </div>
                <button
                  onClick={() => toggle(f.key)}
                  className={`w-10 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${toggles[f.key] ? "bg-indigo-600" : "bg-slate-700"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${toggles[f.key] ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">
            Emergency Contacts
          </h3>
          <div className="space-y-3">
            {[
              { name: "Priya Sharma", rel: "Sister", phone: "+91 98765 43210" },
              { name: "Amit Kumar", rel: "Friend", phone: "+91 87654 32109" },
            ].map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-3 p-3 bg-[#0f1117] rounded-xl"
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {c.rel} · {c.phone}
                  </p>
                </div>
                <button className="text-[10px] text-red-400 hover:text-red-300 font-semibold">
                  Remove
                </button>
              </div>
            ))}
            <button className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:border-indigo-500/30 transition-colors">
              + Add Contact
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <SecurityVault />
      </div>
    </main>
  );
}

function AnalyticsView() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const rides = [18, 24, 19, 30, 27, 35];
  const spend = [2100, 3200, 2600, 4100, 3700, 4800];
  const maxRides = Math.max(...rides);
  const maxSpend = Math.max(...spend);
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-extrabold text-white">Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Your ride patterns and spending insights
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <StatCard key={s.label} stat={s} index={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rides chart */}
        <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-1">Monthly Rides</h3>
          <p className="text-xs text-slate-500 mb-4">Jan – Jun 2025</p>
          <div className="flex items-end gap-2 h-32">
            {rides.map((v, i) => (
              <div
                key={months[i]}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t-lg bg-indigo-500/20 hover:bg-indigo-500/40 transition-colors relative"
                  style={{ height: `${(v / maxRides) * 100}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-indigo-400 font-bold whitespace-nowrap">
                    {v}
                  </div>
                </div>
                <span className="text-[9px] text-slate-500">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Spend chart */}
        <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-1">Monthly Spend</h3>
          <p className="text-xs text-slate-500 mb-4">Jan – Jun 2025</p>
          <div className="flex items-end gap-2 h-32">
            {spend.map((v, i) => (
              <div
                key={months[i]}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t-lg bg-purple-500/20 hover:bg-purple-500/40 transition-colors relative"
                  style={{ height: `${(v / maxSpend) * 100}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-purple-400 font-bold whitespace-nowrap">
                    ₹{(v / 1000).toFixed(1)}k
                  </div>
                </div>
                <span className="text-[9px] text-slate-500">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Ride Breakdown</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { label: "Local Rides", pct: 72, color: "bg-indigo-500" },
            { label: "Intercity", pct: 28, color: "bg-purple-500" },
          ].map((b) => (
            <div key={b.label} className="flex-1 min-w-35">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">{b.label}</span>
                <span className="text-white font-bold">{b.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${b.color}`}
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Avg Ride Fare", value: "₹281" },
            { label: "Peak Hour", value: "9–10 AM" },
            { label: "Fav Route", value: "Home → Work" },
          ].map((i) => (
            <div key={i.label} className="bg-[#0f1117] rounded-xl p-3">
              <p className="text-xs text-slate-500">{i.label}</p>
              <p className="text-sm font-bold text-white mt-1">{i.value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── BOOK RIDE VIEW (full-page version, same logic as BookRide widget) ───────
function BookRideView({ onBack }) {
  return (
    <main className="flex-1 max-w-xl w-full mx-auto px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} className="text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-white">Book a Ride</h2>
          <p className="text-xs text-slate-500 mt-0.5">Enter your pickup & drop to get started</p>
        </div>
      </div>
      <BookRide />
    </main>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav]     = useState("Dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();

  const { logoutUser, authUser }             = useAuthStore();
  const { connectSocket }                    = useSocketStore();
  const { userRideState, rideDetails }       = useRideStore();

  const firstName = authUser?.fullName?.firstName ?? authUser?.firstName ?? "";
  const lastName  = authUser?.fullName?.lastName  ?? authUser?.lastName  ?? "";
  const email     = authUser?.email ?? "";

  // ── Connect socket + rehydrate in-progress ride on every mount/refresh ────
  useEffect(() => {
    if (authUser) {
      connectSocket(authUser);
    }
  }, [authUser, connectSocket]);

  // ── If there's a persisted active ride, surface the active-ride nav ────────
  useEffect(() => {
    if (
      userRideState === "confirmed" ||
      userRideState === "active"
    ) {
      // Don't forcibly navigate — just make sure the banner is visible
      // The BookRide component shows the banner for searching/confirmed states
    }
  }, [userRideState, navigate]);

  // ── Close profile dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const renderPage = () => {
    switch (activeNav) {
      case "My Rides":
        return <MyRidesView />;
      case "Intercity":
        return <IntercityView />;
      case "Security":
        return <SecurityView />;
      case "Analytics":
        return <AnalyticsView />;
      case "Book Ride":
        return <BookRideView onBack={() => setActiveNav("Dashboard")} />;
      default:
        return <DashboardView firstName={firstName} />;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#080a10] text-white font-sans flex flex-col"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #6366f120; border-radius: 999px; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* ── TOP NAV ── */}
      <header
        className="sticky top-0 z-50 flex items-center px-5 h-14 border-b border-white/[0.07]"
        style={{
          background: "rgba(8,10,16,0.85)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-2.5 mr-8">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            UBER
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const on = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  ${on ? "bg-indigo-500/15 text-indigo-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/4"}`}
              >
                <item.icon size={13} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/4 px-3 py-1.5 rounded-lg border border-white/6">
            <MapPin size={11} className="text-indigo-400" />
            <span>Noida, UP</span>
            <ChevronDown size={11} className="text-slate-600" />
          </div>

          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/6 transition-colors">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          </button>

          <div className="w-px h-5 bg-white/[0.07]" />

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className={`flex items-center gap-2 px-2 py-1 rounded-xl transition-all duration-200 border
                ${profileOpen ? "bg-indigo-500/10 border-indigo-500/30" : "border-transparent hover:bg-white/5"}`}
            >
              <Avatar size="w-6 h-6" text="10px" />
              <span className="text-xs font-semibold text-white hidden sm:block">
                {firstName}
              </span>
              <ChevronDown
                size={11}
                className={`text-slate-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] w-56 bg-[#1a1d27] border border-white/8 rounded-2xl overflow-hidden z-50 shadow-2xl"
                style={{
                  animation: "fadeUp 0.18s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                {/* ── Profile Header — fixed email overflow ── */}
                <div className="px-4 py-3 border-b border-white/6 flex items-center gap-3 min-w-0">
                  <Avatar size="w-9 h-9" text="13px" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">
                      {firstName} {lastName}
                    </p>
                    <p
                      className="text-xs text-slate-500 truncate w-full"
                      title={email}
                    >
                      {email}
                    </p>
                  </div>
                </div>

                {/* Menu items */}
                {[
                  {
                    icon: UserCircle2,
                    label: "My Profile",
                    sub: "View & edit profile",
                    action: () => navigate("/profile"),
                  },
                  {
                    icon: CreditCard,
                    label: "Billing",
                    sub: "Manage payment methods",
                    action: () => navigate("/billing"),
                  },
                  {
                    icon: Car,
                    label: "Book Ride",
                    sub: "Request a new ride",
                    action: () => navigate("/ride-booking"),
                  },
                  {
                    icon: BellIcon,
                    label: "Notifications",
                    sub: "Alerts & updates",
                    action: () => {},
                  },
                  {
                    icon: Award,
                    label: "Rewards",
                    sub: "Points & offers",
                    action: () => {},
                  },
                  {
                    icon: Settings,
                    label: "Settings",
                    sub: "App preferences",
                    action: () => navigate("/settings"),
                  },
                  {
                    icon: HelpCircle,
                    label: "Help & Support",
                    sub: "FAQs and contact us",
                    action: () => {},
                  },
                ].map(({ icon: Icon, label, sub, action }) => (
                  <button
                    key={label}
                    onClick={() => {
                      action();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/4 transition-all duration-150 text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 transition-colors">
                      <Icon
                        size={13}
                        className="text-slate-400 group-hover:text-indigo-400 transition-colors"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                        {label}
                      </p>
                      <p className="text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors">
                        {sub}
                      </p>
                    </div>
                  </button>
                ))}

                <div className="border-t border-white/6 mt-1" />

                <button
                  onClick={async () => {
                    const result = await logoutUser();
                    if (result.success) {
                      toast.success("Logged out");
                      navigate("/login");
                    } else {
                      toast.error("Unable to logout");
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150 text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <LogOut size={13} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Sign out</p>
                    <p className="text-[10px] text-red-400/60">
                      Log out of your account
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/6 transition-colors"
            onClick={() => setSidebarOpen((s) => !s)}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE SIDEBAR ── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-14 bottom-0 w-64 bg-[#1a1d27] border-r border-white/[0.07] p-4 flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map((item) => {
              const on = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveNav(item.label);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left
                    ${on ? "bg-indigo-500/15 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ── */}
      {renderPage()}
    </div>
  );
}