import { useState, useEffect, useRef } from "react";
import {
  Car, Navigation, Star, Clock, LogOut, Bell, IndianRupee, Route,
  Shield, CheckCircle, Phone, MessageSquare, LayoutDashboard, History,
  Wallet, Settings, Menu, X, Timer, ArrowLeft, Play, Square, Radio,
  BarChart3, TrendingUp, TrendingDown, Award, Zap, MapPin, ChevronRight,
  Calendar, Filter, Download, CreditCard, Fuel, Wrench, RefreshCw,
  Users, ThumbsUp, Target, Activity, Moon, Sun, ChevronDown, Edit3,
  Camera, Lock, HelpCircle, AlertCircle, Check, Info, ToggleLeft,
  Smartphone, Globe, Volume2, ToggleRight, Eye, EyeOff, Save, Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../context/UserContext";
import { useSocketStore } from "../context/SocketContext";
import { useCaptainStore } from "../context/CaptainContext";
import { useRideStore } from "../context/RideContext";
import { AxiosAPI } from "../api/Axios";
import LiveTracking from "../components/LiveTracking";

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",   icon: LayoutDashboard },
  { label: "My Trips",    icon: History },
  { label: "Earnings",    icon: Wallet },
  { label: "Performance", icon: BarChart3 },
  { label: "Settings",    icon: Settings },
];

// ─── MOCK DATA (replaces real API data when context is unavailable) ───────────
const MOCK_TRIPS = [
  { id: "t1", date: "Today, 11:42 AM",    pickup: "Connaught Place, New Delhi",       drop: "Saket District Centre",       fare: 186, distance: "8.4 km",  duration: "22 min", status: "completed", rating: 5,   payMode: "Cash"  },
  { id: "t2", date: "Today, 9:15 AM",     pickup: "Indira Gandhi International Airport", drop: "Vasant Kunj, Sector D",    fare: 412, distance: "18.2 km", duration: "38 min", status: "completed", rating: 5,   payMode: "UPI"   },
  { id: "t3", date: "Yesterday, 8:50 PM", pickup: "Lajpat Nagar Central Market",      drop: "Greater Kailash Part 1",       fare: 98,  distance: "4.1 km",  duration: "14 min", status: "completed", rating: 4,   payMode: "Cash"  },
  { id: "t4", date: "Yesterday, 6:30 PM", pickup: "Nehru Place IT Hub",               drop: "Okhla Industrial Area Phase 3",fare: 74,  distance: "3.2 km",  duration: "11 min", status: "completed", rating: 5,   payMode: "Cash"  },
  { id: "t5", date: "Yesterday, 2:05 PM", pickup: "Dwarka Sector 12 Metro",           drop: "Janakpuri West",               fare: 130, distance: "6.8 km",  duration: "19 min", status: "cancelled", rating: null, payMode: "UPI"  },
  { id: "t6", date: "Mon, 10:20 AM",      pickup: "Rajouri Garden Metro Station",     drop: "Karol Bagh Main Bazar",        fare: 155, distance: "7.5 km",  duration: "25 min", status: "completed", rating: 4,   payMode: "Cash"  },
  { id: "t7", date: "Mon, 7:45 AM",       pickup: "Noida Sector 62 Electronic City", drop: "Connaught Place, New Delhi",   fare: 320, distance: "22.1 km", duration: "45 min", status: "completed", rating: 5,   payMode: "UPI"   },
];

const MOCK_EARNINGS_WEEKLY = [
  { day: "Mon", amount: 820,  trips: 5 },
  { day: "Tue", amount: 1240, trips: 8 },
  { day: "Wed", amount: 640,  trips: 4 },
  { day: "Thu", amount: 1580, trips: 10 },
  { day: "Fri", amount: 1920, trips: 12 },
  { day: "Sat", amount: 2250, trips: 14 },
  { day: "Sun", amount: 1100, trips: 7 },
];

const MOCK_DEDUCTIONS = [
  { label: "Platform fee (20%)", amount: -1910, icon: Zap,     color: "text-red-400"  },
  { label: "Fuel reimbursement", amount: +200,  icon: Fuel,    color: "text-emerald-400" },
  { label: "Bonus: 10+ trips",   amount: +300,  icon: Award,   color: "text-amber-400"  },
];

const MOCK_REVIEWS = [
  { name: "Priya S.",    rating: 5, comment: "Very punctual and friendly!",                 date: "Today",     avatar: "PS" },
  { name: "Aman K.",     rating: 5, comment: "Smooth drive, knew all the shortcuts.",        date: "Yesterday", avatar: "AK" },
  { name: "Neha R.",     rating: 4, comment: "Good experience overall.",                     date: "Mon",       avatar: "NR" },
  { name: "Rajan M.",    rating: 5, comment: "AC was perfect, very clean car.",              date: "Mon",       avatar: "RM" },
  { name: "Simran T.",   rating: 4, comment: "Arrived on time, polite driver.",              date: "Sun",       avatar: "ST" },
];

const colorMap = {
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-400"  },
  purple:  { bg: "bg-purple-500/10",  text: "text-purple-400"  },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400"   },
  red:     { bg: "bg-red-500/10",     text: "text-red-400"     },
};

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────
function CaptainAvatar({ size = "w-8 h-8", fontSize = "14px" }) {
  const { authUser } = useAuthStore();
  const first = authUser?.fullName?.firstName?.[0] ?? "C";
  const last  = authUser?.fullName?.lastName?.[0]  ?? "";
  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shrink-0`}
      style={{ fontSize }}
    >
      {first}{last}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, index, trend, trendLabel }) {
  const c = colorMap[color];
  return (
    <div
      className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 hover:border-emerald-500/30 hover:bg-[#1e2133] transition-all duration-300 fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={17} className={c.text} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {trendLabel && (
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}

function VehicleCard({ captain }) {
  const vehicle = captain?.vehicle;
  const icons = { car: "🚗", motorcycle: "🏍️", auto: "🛺" };
  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-white mb-4">Your Vehicle</h3>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-2xl">
          {icons[vehicle?.vehicleType] ?? "🚗"}
        </div>
        <div>
          <p className="text-sm font-bold text-white capitalize">{vehicle?.vehicleType ?? "Vehicle"}</p>
          <p className="text-xs text-slate-400">{vehicle?.plate ?? "XX-00-XX-0000"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0f1117] rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-slate-400">Verified</span>
        </div>
        <div className="bg-[#0f1117] rounded-xl p-2.5 flex items-center gap-2">
          <Shield size={10} className="text-indigo-400" />
          <span className="text-[10px] text-slate-400">Insured</span>
        </div>
      </div>
    </div>
  );
}

// ─── RIDE REQUEST COMPONENTS ──────────────────────────────────────────────────
function IncomingRideRequest({ ride, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(28);

  useEffect(() => {
    if (timeLeft <= 0) { onDecline(); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onDecline]);

  if (!ride) return null;
  const progress = ((28 - timeLeft) / 28) * 100;
  const urgency  = timeLeft <= 8;

  return (
    <div className={`bg-[#1a1d27] border rounded-2xl p-5 transition-all duration-300 ${urgency ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${urgency ? "bg-red-400" : "bg-amber-400"}`} />
          <span className={`text-sm font-bold ${urgency ? "text-red-400" : "text-amber-400"}`}>New Ride Request</span>
        </div>
        <span className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${urgency ? "text-red-300 bg-red-500/10" : "text-white bg-amber-500/10"}`}>{timeLeft}s</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${urgency ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-amber-500 to-orange-400"}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{ride.passenger.avatar}</div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{ride.passenger.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-slate-400">{ride.passenger.rating}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-white">{ride.fare}</p>
          <p className="text-xs text-slate-500">{ride.distance}</p>
        </div>
      </div>
      <div className="relative p-3 bg-[#0f1117] rounded-xl mb-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pickup</p>
            <p className="text-xs font-semibold text-white">{ride.pickupStr}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Drop</p>
            <p className="text-xs font-semibold text-white">{ride.destination}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onDecline} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 hover:text-white transition-all">Decline</button>
        <button onClick={onAccept} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <CheckCircle size={16} /> Accept
        </button>
      </div>
    </div>
  );
}

function AcceptedRidePanel({ ride, onBack, onStartTrip }) {
  const [enRoute, setEnRoute] = useState(false);
  if (!ride) return null;

  return (
    <div className="bg-[#1a1d27] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.08)]">
      <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/40 px-4 py-3 flex items-center justify-between border-b border-emerald-500/20">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-emerald-300/70 hover:text-emerald-300 transition-colors">
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">Ride Accepted</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-indigo-500/30">{ride.passenger.avatar}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{ride.passenger.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{ride.passenger.phone}</p>
          </div>
          <button onClick={() => toast("Calling passenger...")} className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
            <Phone size={14} className="text-emerald-400" />
          </button>
        </div>
        <div className="relative p-3 bg-[#0f1117] rounded-xl space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pickup</p>
              <p className="text-xs font-bold text-white">{ride.pickupStr}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Drop-off</p>
              <p className="text-xs font-bold text-white">{ride.destination}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: IndianRupee, color: "text-emerald-400", val: ride.fare },
            { icon: Route,       color: "text-indigo-400",  val: ride.distance },
            { icon: Clock,       color: "text-amber-400",   val: ride.duration },
          ].map(({ icon: Ic, color, val }, i) => (
            <div key={i} className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
              <Ic size={13} className={`${color} mx-auto mb-1`} />
              <p className="text-xs font-bold text-white">{val}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {!enRoute ? (
            <button onClick={() => { setEnRoute(true); toast.success("Navigation started!"); }}
              className="w-full py-3 bg-[#0f1117] border border-indigo-500/30 text-indigo-300 text-sm font-bold rounded-xl hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2">
              <Navigation size={15} /> Navigate to Pickup
            </button>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Navigation size={13} className="text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-300">En route to pickup…</span>
            </div>
          )}
          <button onClick={onStartTrip}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Play size={15} /> Start Trip
          </button>
        </div>
      </div>
    </div>
  );
}

function TripActivePage({ ride, onEndTrip }) {
  const [tripSeconds, setTripSeconds] = useState(0);
  const { socket } = useSocketStore();

  useEffect(() => {
    const t = setInterval(() => setTripSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!socket || !ride?.id) return;
    socket.emit("join_trip", { rideId: ride.id, role: "captain" });
  }, [ride, socket]);

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!ride) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090c12] flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-3 bg-gradient-to-b from-[#090c12] to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex-1 flex items-center gap-2 bg-[#1a1d27]/90 backdrop-blur border border-white/10 rounded-xl px-3 py-2 shadow-lg">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{ride.passenger.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{ride.destination}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-emerald-400">{formatTime(tripSeconds)}</p>
              <p className="text-[10px] text-slate-500">elapsed</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <LiveTracking mode="captain_tracking" socket={socket} rideId={ride.id} updateIntervalMs={5000} height="100%" showControls={true} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#1a1d27]/95 backdrop-blur border-t border-white/10 px-4 pt-3 pb-6">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: IndianRupee, color: "text-emerald-400", val: ride.fare },
            { icon: Route,       color: "text-indigo-400",  val: ride.distance },
            { icon: Clock,       color: "text-amber-400",   val: ride.duration },
          ].map(({ icon: Ic, color, val }, i) => (
            <div key={i} className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
              <Ic size={12} className={`${color} mx-auto mb-1`} />
              <p className="text-xs font-bold text-white leading-tight">{val}</p>
            </div>
          ))}
        </div>
        <button onClick={onEndTrip}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <Square size={14} /> End Trip
        </button>
      </div>
    </div>
  );
}

function IdleRidePanel() {
  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
        <Radio size={20} className="text-slate-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400">Waiting for requests</p>
        <p className="text-xs text-slate-600 mt-1">Stay online to receive ride requests</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" style={{ animationDelay: `${i * 300}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ─── MY TRIPS VIEW ────────────────────────────────────────────────────────────
function MyTripsView() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = MOCK_TRIPS.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = !search || t.pickup.toLowerCase().includes(search.toLowerCase()) || t.drop.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalEarned = MOCK_TRIPS.filter(t => t.status === "completed").reduce((s, t) => s + t.fare, 0);

  return (
    <div className="space-y-5 mt-2 fade-up">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Trips",   value: MOCK_TRIPS.length,                              icon: Car,       color: "indigo" },
          { label: "Completed",     value: MOCK_TRIPS.filter(t=>t.status==="completed").length, icon: CheckCircle, color: "emerald" },
          { label: "Total Earned",  value: `₹${totalEarned}`,                             icon: IndianRupee, color: "amber" },
        ].map((s, i) => {
          const c = colorMap[s.color];
          return (
            <div key={i} className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                <s.icon size={15} className={c.text} />
              </div>
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#1a1d27] border border-white/[0.07] rounded-xl px-3 py-2">
          <Filter size={14} className="text-slate-500 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            placeholder="Search by location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all","completed","cancelled"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter===f ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-[#1a1d27] text-slate-500 border border-white/5 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Trip list */}
      <div className="space-y-2">
        {filtered.map((trip) => (
          <div key={trip.id}
            className={`bg-[#1a1d27] border rounded-2xl overflow-hidden transition-all duration-300 ${expandedId===trip.id ? "border-emerald-500/30" : "border-white/[0.07] hover:border-white/15"}`}>
            <button className="w-full p-4 flex items-start gap-3 text-left" onClick={() => setExpandedId(expandedId===trip.id ? null : trip.id)}>
              <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${trip.status==="completed" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {trip.status==="completed" ? <CheckCircle size={16} className="text-emerald-400" /> : <X size={16} className="text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-white leading-tight truncate">{trip.drop}</p>
                  <span className="text-sm font-extrabold text-white shrink-0">₹{trip.fare}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{trip.pickup}</p>
                <p className="text-[10px] text-slate-600 mt-1">{trip.date}</p>
              </div>
              <ChevronDown size={14} className={`text-slate-600 shrink-0 mt-1 transition-transform duration-200 ${expandedId===trip.id ? "rotate-180" : ""}`} />
            </button>
            {expandedId===trip.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Distance", val: trip.distance, icon: Route,       color: "text-indigo-400" },
                    { label: "Duration", val: trip.duration, icon: Clock,       color: "text-amber-400"  },
                    { label: "Payment",  val: trip.payMode,  icon: CreditCard,  color: "text-purple-400" },
                  ].map(({label,val,icon:Ic,color},i)=>(
                    <div key={i} className="bg-[#0f1117] rounded-xl p-2 text-center border border-white/5">
                      <Ic size={12} className={`${color} mx-auto mb-1`} />
                      <p className="text-[10px] text-slate-500">{label}</p>
                      <p className="text-xs font-bold text-white">{val}</p>
                    </div>
                  ))}
                </div>
                {trip.rating && (
                  <div className="flex items-center gap-1.5 bg-[#0f1117] rounded-xl p-2.5 border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Passenger rating</span>
                    <div className="flex gap-0.5 ml-auto">
                      {[...Array(5)].map((_,i)=>(
                        <Star key={i} size={11} className={i<trip.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EARNINGS VIEW ────────────────────────────────────────────────────────────
function EarningsView() {
  const [period, setPeriod] = useState("week");
  const maxAmount = Math.max(...MOCK_EARNINGS_WEEKLY.map(d => d.amount));
  const totalGross = MOCK_EARNINGS_WEEKLY.reduce((s, d) => s + d.amount, 0);
  const platformFee = Math.round(totalGross * 0.20);
  const netEarning  = totalGross - platformFee + 200 + 300; // + reimbursement + bonus

  return (
    <div className="space-y-5 mt-2 fade-up">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Gross Earned",  value: `₹${totalGross.toLocaleString()}`, icon: IndianRupee, color: "emerald", trend: 12,  tl: "vs last week" },
          { label: "Net Payout",    value: `₹${netEarning.toLocaleString()}`,  icon: Wallet,      color: "indigo",  trend: 8,   tl: "after fees" },
          { label: "Total Trips",   value: MOCK_EARNINGS_WEEKLY.reduce((s,d)=>s+d.trips,0), icon: Car, color: "amber", trend: 5, tl: "this week" },
          { label: "Avg per Trip",  value: `₹${Math.round(totalGross/MOCK_EARNINGS_WEEKLY.reduce((s,d)=>s+d.trips,0))}`, icon: TrendingUp, color: "purple", trend: 3, tl: "per ride" },
        ].map((s,i) => <StatCard key={i} {...s} index={i} />)}
      </div>

      {/* Period toggle + Bar chart */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white">Earnings Overview</h3>
          <div className="flex gap-1">
            {["week","month"].map(p=>(
              <button key={p} onClick={()=>setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${period===p?"bg-emerald-500/10 text-emerald-400 border border-emerald-500/20":"text-slate-500 hover:text-white"}`}>
                {p==="week"?"This Week":"This Month"}
              </button>
            ))}
          </div>
        </div>
        {/* Simple bar chart */}
        <div className="flex items-end gap-2 h-32">
          {MOCK_EARNINGS_WEEKLY.map((d, i) => {
            const pct = (d.amount / maxAmount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[9px] text-slate-600 group-hover:text-emerald-400 transition-colors font-bold">₹{(d.amount/1000).toFixed(1)}k</span>
                <div className="w-full rounded-t-lg bg-[#0f1117] relative overflow-hidden" style={{height:`${Math.max(pct*0.9,8)}%`}}>
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[9px] text-slate-600 font-semibold">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">This Week's Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <IndianRupee size={14} className="text-emerald-400" />
              <span className="text-sm text-slate-300">Gross Earnings</span>
            </div>
            <span className="text-sm font-bold text-white">₹{totalGross.toLocaleString()}</span>
          </div>
          {MOCK_DEDUCTIONS.map((d,i)=>(
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <d.icon size={14} className={d.color} />
                <span className="text-sm text-slate-300">{d.label}</span>
              </div>
              <span className={`text-sm font-bold ${d.amount<0?"text-red-400":"text-emerald-400"}`}>
                {d.amount<0 ? `-₹${Math.abs(d.amount)}` : `+₹${d.amount}`}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-bold text-white">Net Payout</span>
            <span className="text-lg font-extrabold text-emerald-400">₹{netEarning.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Daily Summary</h3>
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
        <div className="space-y-2">
          {MOCK_EARNINGS_WEEKLY.map((d,i)=>(
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-8 text-[10px] font-bold text-slate-500 uppercase">{d.day}</div>
              <div className="flex-1 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{width:`${(d.amount/maxAmount)*100}%`}} />
              </div>
              <div className="text-right w-20">
                <p className="text-xs font-bold text-white">₹{d.amount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-600">{d.trips} trips</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PERFORMANCE VIEW ─────────────────────────────────────────────────────────
function PerformanceView() {
  const overallRating = 4.82;
  const ratingDist = [ { stars:5, count:38, pct:76 }, { stars:4, count:9, pct:18 }, { stars:3, count:2, pct:4 }, { stars:2, count:1, pct:2 }, { stars:1, count:0, pct:0 } ];
  const metrics = [
    { label: "Acceptance Rate", value: "94%",   target: "95%", icon: CheckCircle, color: "emerald", ok: false },
    { label: "Completion Rate", value: "97%",   target: "95%", icon: CheckCircle, color: "emerald", ok: true  },
    { label: "On-Time Pickup",  value: "89%",   target: "90%", icon: Clock,       color: "amber",   ok: false },
    { label: "Cancellation",    value: "3%",    target: "<5%", icon: X,           color: "indigo",  ok: true  },
  ];

  return (
    <div className="space-y-5 mt-2 fade-up">
      {/* Rating overview */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Overall Rating</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex flex-col items-center shrink-0">
            <p className="text-5xl font-extrabold text-white tracking-tight">{overallRating}</p>
            <div className="flex gap-1 mt-2">
              {[1,2,3,4,5].map(s=>(
                <Star key={s} size={16} className={s<=Math.round(overallRating)?"text-amber-400 fill-amber-400":"text-slate-700"} />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">50 ratings</p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {ratingDist.map(r=>(
              <div key={r.stars} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-3">{r.stars}</span>
                <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{width:`${r.pct}%`}} />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => {
          const c = colorMap[m.color];
          return (
            <div key={i} className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{m.label}</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${m.ok?"bg-emerald-500/20":"bg-amber-500/20"}`}>
                  {m.ok ? <Check size={9} className="text-emerald-400" /> : <AlertCircle size={9} className="text-amber-400" />}
                </div>
              </div>
              <p className={`text-2xl font-extrabold ${m.ok?"text-white":"text-amber-400"}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600 mt-1">Target: {m.target}</p>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "⭐", label: "5-Star Driver",      desc: "10 perfect trips",   unlocked: true  },
            { icon: "🏆", label: "Top Earner",         desc: "₹10k in a week",     unlocked: true  },
            { icon: "⚡", label: "Speed Demon",        desc: "On-time 20 trips",   unlocked: true  },
            { icon: "🌙", label: "Night Owl",          desc: "10 late-night trips",unlocked: false },
            { icon: "🗺️", label: "Explorer",           desc: "50 different zones", unlocked: false },
            { icon: "💎", label: "Diamond Driver",     desc: "500 total trips",    unlocked: false },
          ].map((b,i)=>(
            <div key={i} className={`rounded-2xl p-3 text-center border transition-all ${b.unlocked ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20" : "bg-[#0f1117] border-white/5 opacity-40"}`}>
              <p className="text-2xl mb-1">{b.icon}</p>
              <p className="text-[10px] font-bold text-white leading-tight">{b.label}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reviews */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Recent Reviews</h3>
        <div className="space-y-3">
          {MOCK_REVIEWS.map((r,i)=>(
            <div key={i} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{r.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-bold text-white">{r.name}</p>
                  <p className="text-[10px] text-slate-600">{r.date}</p>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(s=>(
                    <Star key={s} size={9} className={s<=r.rating?"text-amber-400 fill-amber-400":"text-slate-700"} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
function SettingsView({ captain }) {
  const { authUser } = useAuthStore();
  const [showPassword,  setShowPassword]  = useState(false);
  const [notifications, setNotifications] = useState({ rides: true, promos: false, updates: true });
  const [editProfile,   setEditProfile]   = useState(false);
  const [profileData,   setProfileData]   = useState({
    firstName: authUser?.fullName?.firstName ?? "Captain",
    lastName:  authUser?.fullName?.lastName  ?? "",
    email:     authUser?.email               ?? "captain@example.com",
    phone:     authUser?.phone               ?? "+91 98765 43210",
  });

  const ToggleRow = ({ label, desc, value, onChange }) => (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-300 shrink-0 ml-4 mt-0.5 ${value?"bg-emerald-500":"bg-slate-700"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${value?"translate-x-5":"translate-x-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 mt-2 fade-up max-w-2xl">
      {/* Profile */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Profile</h3>
          <button onClick={() => setEditProfile(!editProfile)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors">
            <Edit3 size={13} /> {editProfile ? "Cancel" : "Edit"}
          </button>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white">
              {(authUser?.fullName?.firstName?.[0]??"")+( authUser?.fullName?.lastName?.[0]??"")}
            </div>
            {editProfile && (
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <Camera size={11} className="text-white" />
              </button>
            )}
          </div>
          <div>
            <p className="text-base font-bold text-white">{profileData.firstName} {profileData.lastName}</p>
            <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1"><Shield size={10} />Verified Driver</p>
          </div>
        </div>
        {editProfile ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[["First Name", "firstName"], ["Last Name", "lastName"]].map(([label, key]) => (
                <div key={key}>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
                  <input
                    className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                    value={profileData[key]}
                    onChange={e => setProfileData(p => ({...p, [key]: e.target.value}))}
                  />
                </div>
              ))}
            </div>
            {[["Email", "email"], ["Phone", "phone"]].map(([label, key]) => (
              <div key={key}>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
                <input
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                  value={profileData[key]}
                  onChange={e => setProfileData(p => ({...p, [key]: e.target.value}))}
                />
              </div>
            ))}
            <button onClick={() => { setEditProfile(false); toast.success("Profile updated!"); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <Save size={14} /> Save Changes
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: "Email",  val: profileData.email },
              { label: "Phone",  val: profileData.phone },
            ].map(({label, val})=>(
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs font-semibold text-white">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Notifications</h3>
        <p className="text-xs text-slate-500 mb-4">Manage how you receive alerts and updates.</p>
        <ToggleRow label="New Ride Requests" desc="Get notified when a passenger books near you" value={notifications.rides}   onChange={v=>setNotifications(n=>({...n, rides:v}))} />
        <ToggleRow label="Promotions & Bonuses" desc="Weekly incentives and special offers"       value={notifications.promos}  onChange={v=>setNotifications(n=>({...n, promos:v}))} />
        <ToggleRow label="App Updates"          desc="Critical updates and feature announcements" value={notifications.updates} onChange={v=>setNotifications(n=>({...n, updates:v}))} />
      </div>

      {/* Security */}
      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Security</h3>
        <div className="space-y-2">
          {[
            { label: "Change Password",      desc: "Update your account password",       icon: Lock,        action: () => toast("Password change coming soon") },
            { label: "Two-Factor Auth",      desc: "Add an extra layer of security",     icon: Smartphone,  action: () => toast("2FA setup coming soon") },
            { label: "Active Sessions",      desc: "Manage devices logged into account", icon: Globe,       action: () => toast("Session management coming soon") },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0f1117] border border-white/5 hover:border-white/15 transition-all text-left group">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <item.icon size={14} className="text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#1a1d27] border border-red-500/10 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-red-400 mb-4">Danger Zone</h3>
        <div className="space-y-2">
          <button onClick={() => toast.error("Account deactivation requires support contact.")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-left group">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={14} className="text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-red-300">Deactivate Account</p>
              <p className="text-[10px] text-slate-500">Permanently disable your driver account</p>
            </div>
            <ChevronRight size={13} className="text-red-500/50" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function CaptainDashboard() {
  const { authUser, logoutUser }      = useAuthStore();
  const navigate                      = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav,   setActiveNav]   = useState("Dashboard");

  const { rideDetails, setRideDetails, captainRideState: ridePhase, setCaptainRideState: setRidePhase, resetRide } = useRideStore();
  const { toggleAvailability }  = useCaptainStore();
  const { socket, connectSocket } = useSocketStore();

  const captain   = authUser;
  const firstName = captain?.fullName?.firstName ?? "Captain";
  const lastName  = captain?.fullName?.lastName  ?? "";
  const isOnline  = authUser?.status === "active";

  // ── Socket connect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (authUser) connectSocket(authUser);
  }, [authUser, connectSocket]);

  // ── Live location updater ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || !socket) return;
    const send = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          socket.emit("update-location-captain", {
            userId: captain?._id || captain?.id,
            location: { type: "Point", coordinates: [longitude, latitude] },
          });
        },
        (err) => console.warn("GPS:", err.message),
        { enableHighAccuracy: true },
      );
    };
    send();
    const id = setInterval(send, 10000);
    return () => clearInterval(id);
  }, [isOnline, socket, captain]);

  // ── Incoming ride listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => { setRideDetails(data); setRidePhase("incoming"); };
    socket.on("new-ride", handler);
    return () => socket.off("new-ride", handler);
  }, [socket, setRideDetails, setRidePhase]);

  // ── API handlers ─────────────────────────────────────────────────────────
  const handleAcceptRide = async () => {
    if (!rideDetails?._id) return toast.error("No active ride to accept");
    try {
      await AxiosAPI.post("/ride/accept", { rideId: rideDetails._id }, { withCredentials: true });
      socket?.emit("ride-accepted", { rideId: rideDetails._id, captainId: captain?._id || captain?.id });
      setRidePhase("accepted");
      toast.success("Ride accepted!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept ride");
    }
  };

  const handleStartTrip = async () => {
    if (!rideDetails?._id) { setRidePhase("trip_active"); return; }
    try {
      await AxiosAPI.post("/ride/start", { rideId: rideDetails._id }, { withCredentials: true });
      socket?.emit("trip-started", { rideId: rideDetails._id });
      setRidePhase("trip_active");
      toast.success("Trip started!");
    } catch {
      setRidePhase("trip_active");
    }
  };

  const handleEndTrip = async () => {
    if (rideDetails?._id) {
      try {
        await AxiosAPI.post("/ride/complete", { rideId: rideDetails._id }, { withCredentials: true });
        socket?.emit("trip-ended", { rideId: rideDetails._id });
      } catch (e) { console.error(e); }
    }
    resetRide();
    toast.success("Trip completed! Great job. 🎉");
  };

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res?.success) { toast.success("Logged out"); navigate("/login"); }
    else toast.error(res?.message || "Logout failed");
  };

  const toggleOnline = async () => {
    const result = await toggleAvailability();
    if (result.success) toast.success(result.status === "active" ? "You're now online!" : "You're now offline");
    else toast.error(result.message);
  };

  const formatRideForUI = (dbRide) => {
    if (!dbRide) return null;
    const userName = dbRide.user?.fullName
      ? `${dbRide.user.fullName.firstName} ${dbRide.user.fullName.lastName}`
      : "Passenger";
    return {
      id: dbRide._id || "ride_pending",
      passenger: { name: userName, avatar: userName.charAt(0).toUpperCase(), rating: 4.9, phone: dbRide.user?.phone || "—" },
      pickupStr:   dbRide.pickup,
      pickup:      { label: dbRide.pickup },
      destination: dbRide.destination,
      drop:        { label: dbRide.destination },
      fare:        `₹${dbRide.fare}`,
      distance:    dbRide.distance ? `${(dbRide.distance / 1000).toFixed(1)} km` : "—",
      duration:    dbRide.duration ? `${Math.ceil(dbRide.duration / 60)} min`    : "—",
    };
  };

  const uiRide = formatRideForUI(rideDetails);

  if (ridePhase === "trip_active") {
    return <TripActivePage ride={uiRide} onEndTrip={handleEndTrip} />;
  }

  // ── Time-based greeting ──────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning ☀️" : hour < 18 ? "Good afternoon 🌤️" : "Good evening 🌙";

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease both; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 9999px; }
      `}</style>

      {/* ═══ SIDEBAR ════════════════════════════════════════════════════════ */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#13161f] border-r border-white/[0.06] flex flex-col py-6 px-4 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white tracking-tight leading-none">UBER Captain</p>
            <p className="text-[10px] text-slate-500">Driver Console</p>
          </div>
        </div>

        {/* Online toggle */}
        <button onClick={toggleOnline} className={`flex items-center gap-3 mx-2 mb-6 px-3 py-2.5 rounded-xl border transition-all duration-300 ${isOnline ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
          <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isOnline ? "bg-emerald-500" : "bg-slate-700"}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${isOnline ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className={`text-xs font-bold ${isOnline ? "text-emerald-400" : "text-slate-500"}`}>{isOnline ? "Online" : "Offline"}</span>
        </button>

        {/* Nav items */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeNav===item.label ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}>
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Profile + logout */}
        <div className="border-t border-white/[0.06] pt-4 mt-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <CaptainAvatar size="w-8 h-8" fontSize="12px" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{firstName} {lastName}</p>
              <p className="text-[10px] text-slate-500 truncate">{captain?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ═══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/[0.06] px-5 h-14 flex items-center gap-4">
          <button className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center" onClick={() => setSidebarOpen(s => !s)}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm font-bold text-white hidden sm:block">{activeNav}</span>
          </div>
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700/50 text-slate-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            {isOnline ? "ONLINE" : "OFFLINE"}
          </div>
          <button className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
            <Bell size={15} className="text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>
          <CaptainAvatar size="w-8 h-8" fontSize="12px" />
        </header>

        {/* Page content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6">

          {/* ── DASHBOARD ─────────────────────────────────────────────── */}
          {activeNav === "Dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left column */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                {/* Hero card */}
                <div className="fade-up relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#1a1d27] p-6" style={{ animationDelay: "0ms" }}>
                  <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{greeting}</p>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Ready to roll, {firstName}?</h1>
                  <p className="text-sm text-slate-400 mb-5">Stay online to receive ride requests and boost your earnings.</p>
                  <div className="flex gap-3">
                    <div className="bg-[#0f1117] border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <Activity size={14} className="text-emerald-400" />
                      <div>
                        <p className="text-[10px] text-slate-500">Today</p>
                        <p className="text-sm font-bold text-white">₹0 earned</p>
                      </div>
                    </div>
                    <div className="bg-[#0f1117] border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <Target size={14} className="text-amber-400" />
                      <div>
                        <p className="text-[10px] text-slate-500">Daily goal</p>
                        <p className="text-sm font-bold text-white">₹1,500</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Earnings" value="₹9,550" icon={IndianRupee} color="emerald" index={0} trend={12}  trendLabel="+12% vs last week" />
                  <StatCard label="Trips"    value="60"      icon={Car}         color="indigo"  index={1} trend={5}   trendLabel="+5 vs last week"   />
                  <StatCard label="Online"   value="42 hrs"  icon={Timer}       color="amber"   index={2} trend={-2}  trendLabel="-2 hrs vs last week" />
                  <StatCard label="Rating"   value="4.82"    icon={Star}        color="purple"  index={3} trend={0.1} trendLabel="+0.1 this month"   />
                </div>

                {/* Quick trip history */}
                <div className="fade-up bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5" style={{ animationDelay: "100ms" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Recent Trips</h3>
                    <button onClick={() => setActiveNav("My Trips")} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {MOCK_TRIPS.slice(0, 3).map((trip) => (
                      <div key={trip.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${trip.status==="completed" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                          {trip.status==="completed" ? <CheckCircle size={13} className="text-emerald-400" /> : <X size={13} className="text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{trip.drop}</p>
                          <p className="text-[10px] text-slate-500">{trip.date}</p>
                        </div>
                        <span className="text-sm font-bold text-white">₹{trip.fare}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-5">
                {/* Ride request panel */}
                <div className="fade-up" style={{ animationDelay: "60ms" }}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ride Request</h3>
                  {ridePhase === "idle" && <IdleRidePanel />}
                  {ridePhase === "incoming" && uiRide && (
                    <IncomingRideRequest ride={uiRide} onAccept={handleAcceptRide} onDecline={resetRide} />
                  )}
                  {ridePhase === "accepted" && uiRide && (
                    <AcceptedRidePanel ride={uiRide} onBack={() => setRidePhase("incoming")} onStartTrip={handleStartTrip} />
                  )}
                </div>

                {/* Vehicle card */}
                <div className="fade-up" style={{ animationDelay: "140ms" }}>
                  <VehicleCard captain={captain} />
                </div>

                {/* Earnings today */}
                <div className="fade-up bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5" style={{ animationDelay: "180ms" }}>
                  <h3 className="text-sm font-bold text-white mb-4">Earnings Today</h3>
                  <div className="flex items-end justify-between gap-2 h-14 mb-3">
                    {MOCK_EARNINGS_WEEKLY.map((d,i) => {
                      const max = Math.max(...MOCK_EARNINGS_WEEKLY.map(x=>x.amount));
                      const pct = (d.amount/max)*100;
                      const isToday = i === new Date().getDay() - 1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-md" style={{height:`${pct*0.85}%`, minHeight:4}}>
                            <div className={`w-full h-full rounded-t-md ${isToday ? "bg-emerald-500" : "bg-slate-700"}`} />
                          </div>
                          <span className={`text-[9px] font-semibold ${isToday ? "text-emerald-400" : "text-slate-600"}`}>{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">This week total</span>
                    <span className="text-sm font-bold text-white">₹{MOCK_EARNINGS_WEEKLY.reduce((s,d)=>s+d.amount,0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MY TRIPS ──────────────────────────────────────────────── */}
          {activeNav === "My Trips" && <MyTripsView />}

          {/* ── EARNINGS ──────────────────────────────────────────────── */}
          {activeNav === "Earnings" && <EarningsView />}

          {/* ── PERFORMANCE ───────────────────────────────────────────── */}
          {activeNav === "Performance" && <PerformanceView />}

          {/* ── SETTINGS ──────────────────────────────────────────────── */}
          {activeNav === "Settings" && <SettingsView captain={captain} />}

        </main>
      </div>
    </div>
  );
}