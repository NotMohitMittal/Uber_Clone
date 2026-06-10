import { useState, useEffect, useRef, useCallback } from "react";
import {
  Car, Navigation, Star, Clock, LogOut, Bell, IndianRupee, Route,
  Shield, CheckCircle, Phone, MessageSquare, LayoutDashboard, History,
  Wallet, Settings, Menu, X, Timer, ArrowLeft, Play, Square, Radio,
  BarChart3, TrendingUp, TrendingDown, Award, Zap, MapPin, ChevronRight,
  Calendar, Filter, Download, CreditCard, Fuel, Wrench, RefreshCw,
  Users, ThumbsUp, Target, Activity, Moon, Sun, ChevronDown, Edit3,
  Camera, Lock, AlertCircle, Check, Smartphone, Globe,
  Eye, EyeOff, Save, Maximize2, CheckCircle2, Minimize2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore }    from "../context/UserContext";
import { useSocketStore }  from "../context/SocketContext";
import { useCaptainStore } from "../context/CaptainContext";
import { useRideStore }    from "../context/RideContext";
import { AxiosAPI }        from "../api/Axios";
import LiveTracking        from "../components/LiveTracking";

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",   icon: LayoutDashboard },
  { label: "My Trips",    icon: History },
  { label: "Earnings",    icon: Wallet },
  { label: "Performance", icon: BarChart3 },
  { label: "Settings",    icon: Settings },
];

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_TRIPS = [
  { id:"t1", date:"Today, 11:42 AM",    pickup:"Connaught Place, New Delhi",          drop:"Saket District Centre",        fare:186, distance:"8.4 km",  duration:"22 min", status:"completed", rating:5,    payMode:"Cash" },
  { id:"t2", date:"Today, 9:15 AM",     pickup:"IGI Airport, Terminal 3",             drop:"Vasant Kunj Sector D",          fare:412, distance:"18.2 km", duration:"38 min", status:"completed", rating:5,    payMode:"UPI"  },
  { id:"t3", date:"Yesterday, 8:50 PM", pickup:"Lajpat Nagar Central Market",         drop:"Greater Kailash Part 1",        fare:98,  distance:"4.1 km",  duration:"14 min", status:"completed", rating:4,    payMode:"Cash" },
  { id:"t4", date:"Yesterday, 6:30 PM", pickup:"Nehru Place IT Hub",                  drop:"Okhla Industrial Area Phase 3", fare:74,  distance:"3.2 km",  duration:"11 min", status:"completed", rating:5,    payMode:"Cash" },
  { id:"t5", date:"Yesterday, 2:05 PM", pickup:"Dwarka Sector 12 Metro",              drop:"Janakpuri West",                fare:130, distance:"6.8 km",  duration:"19 min", status:"cancelled", rating:null, payMode:"UPI"  },
  { id:"t6", date:"Mon, 10:20 AM",      pickup:"Rajouri Garden Metro Station",        drop:"Karol Bagh Main Bazar",         fare:155, distance:"7.5 km",  duration:"25 min", status:"completed", rating:4,    payMode:"Cash" },
  { id:"t7", date:"Mon, 7:45 AM",       pickup:"Noida Sector 62, Electronic City",   drop:"Connaught Place, New Delhi",    fare:320, distance:"22.1 km", duration:"45 min", status:"completed", rating:5,    payMode:"UPI"  },
];

const MOCK_EARNINGS = [
  { day:"Mon", amount:820,  trips:5  },
  { day:"Tue", amount:1240, trips:8  },
  { day:"Wed", amount:640,  trips:4  },
  { day:"Thu", amount:1580, trips:10 },
  { day:"Fri", amount:1920, trips:12 },
  { day:"Sat", amount:2250, trips:14 },
  { day:"Sun", amount:1100, trips:7  },
];

const MOCK_REVIEWS = [
  { name:"Priya S.",  rating:5, comment:"Punctual, friendly, and car was spotless!",   date:"Today",     avatar:"PS" },
  { name:"Aman K.",   rating:5, comment:"Smooth ride — knew the best shortcuts.",      date:"Yesterday", avatar:"AK" },
  { name:"Neha R.",   rating:4, comment:"Good experience overall, very polite.",       date:"Mon",       avatar:"NR" },
  { name:"Rajan M.",  rating:5, comment:"AC was perfect and the car smelled fresh.",   date:"Mon",       avatar:"RM" },
  { name:"Simran T.", rating:4, comment:"On time and took the most efficient route.",  date:"Sun",       avatar:"ST" },
];

const colorMap = {
  emerald: { bg:"bg-emerald-500/10", text:"text-emerald-400", border:"border-emerald-500/20" },
  indigo:  { bg:"bg-indigo-500/10",  text:"text-indigo-400",  border:"border-indigo-500/20"  },
  amber:   { bg:"bg-amber-500/10",   text:"text-amber-400",   border:"border-amber-500/20"   },
  purple:  { bg:"bg-purple-500/10",  text:"text-purple-400",  border:"border-purple-500/20"  },
  red:     { bg:"bg-red-500/10",     text:"text-red-400",     border:"border-red-500/20"     },
};

const formatTime = (s) =>
  `${Math.floor(s / 60).toString().padStart(2,"0")}:${(s % 60).toString().padStart(2,"0")}`;

// ─── SHARED ATOMS ──────────────────────────────────────────────────────────────
function CaptainAvatar({ size = "w-8 h-8", fontSize = "13px" }) {
  const { authUser } = useAuthStore();
  const a = (authUser?.fullName?.firstName?.[0] ?? "C") + (authUser?.fullName?.lastName?.[0] ?? "");
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-white shrink-0 ring-2 ring-emerald-500/20`} style={{ fontSize }}>
      {a}
    </div>
  );
}

function Badge({ children, color = "emerald", pulse = false }) {
  const c = colorMap[color];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text} border ${c.border}`}>
      {pulse && <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace("text","bg")} animate-pulse`} />}
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, index, trend, trendLabel }) {
  const c = colorMap[color];
  return (
    <div className="relative bg-[#181b26] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3 hover:border-white/15 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group fade-up" style={{ animationDelay:`${index * 70}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em]">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon size={16} className={c.text} />
        </div>
      </div>
      <p className="text-[1.6rem] font-black text-white tracking-tight leading-none">{value}</p>
      {trendLabel && (
        <div className={`flex items-center gap-1 text-[10px] font-bold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{trendLabel}
        </div>
      )}
    </div>
  );
}

function VehicleCard({ captain }) {
  const v = captain?.vehicle;
  const cfg = { car:{icon:"🚗",label:"Car"}, motorcycle:{icon:"🏍️",label:"Moto"}, auto:{icon:"🛺",label:"Auto"} }[v?.vehicleType] || {icon:"🚗",label:"Vehicle"};
  return (
    <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Vehicle</h3>
        <Badge color="emerald" pulse>ACTIVE</Badge>
      </div>
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">{cfg.icon}</div>
        <div className="flex-1">
          <p className="text-base font-black text-white">{cfg.label}</p>
          <code className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-1 inline-block border border-emerald-500/10">{v?.plate ?? "—"}</code>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon:Users,        label:"Seats",    val: v?.capacity ?? "—" },
          { icon:CheckCircle2, label:"Verified",  val: "✓"               },
          { icon:Shield,       label:"Insured",   val: "✓"               },
        ].map(({icon:Ic,label,val},i) => (
          <div key={i} className="bg-[#0f1117] border border-white/5 rounded-xl p-2.5 text-center">
            <Ic size={13} className="text-slate-500 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 leading-none">{label}</p>
            <p className="text-xs font-bold text-white mt-0.5">{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RIDE PANELS ───────────────────────────────────────────────────────────────
function IdleRidePanel() {
  return (
    <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-7 flex flex-col items-center gap-3 text-center">
      <div className="relative w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center">
        <Radio size={22} className="text-slate-600" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-[#181b26] animate-pulse" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-300">Waiting for requests</p>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">Go online to start receiving ride requests from nearby passengers</p>
      </div>
      <div className="flex gap-1.5 mt-1">
        {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" style={{ animationDelay:`${i*300}ms` }} />)}
      </div>
    </div>
  );
}

function IncomingRideRequest({ ride, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(28);
  useEffect(() => {
    if (timeLeft <= 0) { onDecline(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onDecline]);

  if (!ride) return null;
  const progress = ((28 - timeLeft) / 28) * 100;
  const urgent   = timeLeft <= 8;

  return (
    <div className={`bg-[#181b26] border rounded-2xl overflow-hidden transition-all duration-300 ${urgent ? "border-red-500/40 shadow-[0_0_24px_rgba(239,68,68,0.12)]" : "border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.08)]"}`}>
      {/* Progress bar at very top */}
      <div className="h-1 bg-white/5">
        <div className={`h-full transition-all duration-1000 ${urgent ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-amber-500 to-orange-400"}`} style={{ width:`${progress}%` }} />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${urgent ? "bg-red-400" : "bg-amber-400"}`} />
            <span className={`text-sm font-bold ${urgent ? "text-red-400" : "text-amber-300"}`}>New Request</span>
          </div>
          <span className={`text-sm font-mono font-black px-3 py-1 rounded-lg ${urgent ? "text-red-300 bg-red-500/10 border border-red-500/20" : "text-amber-300 bg-amber-500/10 border border-amber-500/20"}`}>{timeLeft}s</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 ring-2 ring-indigo-500/20">{ride.passenger.avatar}</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{ride.passenger.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-400">{ride.passenger.rating}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-white">{ride.fare}</p>
            <p className="text-xs text-slate-500">{ride.distance}</p>
          </div>
        </div>

        <div className="bg-[#0f1117] border border-white/5 rounded-xl p-3 mb-4 space-y-2.5">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <div><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pickup</p><p className="text-xs font-semibold text-white mt-0.5">{ride.pickupStr}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
            <div><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Drop</p><p className="text-xs font-semibold text-white mt-0.5">{ride.destination}</p></div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button onClick={onDecline} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 hover:border-white/20 hover:text-white transition-all">Decline</button>
          <button onClick={onAccept}  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40">
            <CheckCircle size={16} /> Accept
          </button>
        </div>
      </div>
    </div>
  );
}

function AcceptedRidePanel({ ride, onBack, onStartTrip }) {
  if (!ride) return null;
  return (
    <div className="bg-[#181b26] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_32px_rgba(16,185,129,0.07)]">
      <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/30 px-4 py-3 flex items-center justify-between border-b border-emerald-500/20">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"><ArrowLeft size={13} /> Back</button>
        <Badge color="emerald" pulse>Ride Accepted</Badge>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">{ride.passenger.avatar}</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{ride.passenger.name}</p>
            <p className="text-xs text-slate-500">{ride.passenger.phone}</p>
          </div>
          <button onClick={() => toast("Calling...")} className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
            <Phone size={14} className="text-emerald-400" />
          </button>
        </div>
        <div className="bg-[#0f1117] border border-white/5 rounded-xl p-3 space-y-2.5">
          <div className="flex items-start gap-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]" /><div><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pickup</p><p className="text-xs font-semibold text-white">{ride.pickupStr}</p></div></div>
          <div className="flex items-start gap-3"><span className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]" /><div><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Drop</p><p className="text-xs font-semibold text-white">{ride.destination}</p></div></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{icon:IndianRupee,c:"text-emerald-400",v:ride.fare},{icon:Route,c:"text-indigo-400",v:ride.distance},{icon:Clock,c:"text-amber-400",v:ride.duration}].map(({icon:Ic,c,v},i) => (
            <div key={i} className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5"><Ic size={12} className={`${c} mx-auto mb-1`}/><p className="text-xs font-bold text-white">{v}</p></div>
          ))}
        </div>
        <button onClick={onStartTrip} className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40">
          <Play size={15} /> Start Trip
        </button>
      </div>
    </div>
  );
}

function TripActivePanel({ ride, onEndTrip, tripSeconds }) {
  if (!ride) return null;
  return (
    <div className="bg-[#181b26] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_32px_rgba(16,185,129,0.07)]">
      <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/30 px-4 py-3 flex items-center justify-between border-b border-emerald-500/20">
        <Badge color="emerald" pulse>Trip Active</Badge>
        <span className="text-sm font-mono font-black text-emerald-400">{formatTime(tripSeconds)}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">{ride.passenger.avatar}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{ride.passenger.name}</p><p className="text-xs text-slate-500 truncate">→ {ride.destination}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{icon:IndianRupee,c:"text-emerald-400",v:ride.fare},{icon:Route,c:"text-indigo-400",v:ride.distance},{icon:Clock,c:"text-amber-400",v:ride.duration}].map(({icon:Ic,c,v},i)=>(
            <div key={i} className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5"><Ic size={12} className={`${c} mx-auto mb-1`}/><p className="text-xs font-bold text-white">{v}</p></div>
          ))}
        </div>
        <button onClick={onEndTrip} className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold rounded-xl hover:from-red-500 hover:to-rose-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/30">
          <Square size={14} /> End Trip
        </button>
      </div>
    </div>
  );
}

// ─── LIVE MAP PANEL — Expand fixes ────────────────────────────────────────────
// BUG FIX: The map was disappearing on expand because the wrapper div had
// onClick={() => setIsFullscreen(true)} which triggered on every click inside
// the map — including Google Maps' own internal DOM events — causing the component
// to re-render and briefly unmount the map iframe. Fixed by:
//   1. Moving the expand button OUT of the clickable wrapper.
//   2. Using a dedicated expand-only button (Maximize2) that calls e.stopPropagation.
//   3. NOT wrapping the LiveTracking mount in any onClick handler.
function CaptainLiveMapPanel({ socket, ride, ridePhase, tripSeconds, onStartTrip, onEndTrip }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [enRoute,      setEnRoute]      = useState(false);

  const isLive   = ridePhase === "accepted" || ridePhase === "trip_active";
  const isActive = ridePhase === "trip_active";

  // Pass the pickup address STRING directly to LiveTracking — it geocodes
  // internally after its own useJsApiLoader resolves, which is the only safe
  // time to call window.google.maps.Geocoder(). External geocoding was
  // unreliable because window.google might not exist yet at that point.
  const pickupAddress = isActive ? null : (ride?.pickupStr ?? null);

  // ── FULLSCREEN overlay ──────────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#090c12] flex flex-col">
        {/* Back */}
        <div className="absolute top-5 left-5 z-50">
          <button onClick={() => setIsFullscreen(false)} className="p-2.5 bg-[#181b26]/90 backdrop-blur rounded-full border border-white/10 text-white hover:bg-white/10 shadow-xl transition-colors">
            <ArrowLeft size={22} />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <LiveTracking
            mode="captain_tracking"
            pickupAddress={pickupAddress}
            socket={socket}
            rideId={ride?.id}
            height="100%"
            showControls
            allowFullscreen={false}
          />

          {/* Floating info banner */}
          {isLive && (
            <div className="absolute top-20 left-4 right-4 max-w-md mx-auto z-10">
              <div className="bg-[#0f1117]/90 backdrop-blur border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-sm font-bold text-white">{isActive ? "Trip in progress" : "En route to pickup"}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{isActive ? ride.destination : ride.pickupStr}</p>
                </div>
                <div className="bg-emerald-500/20 p-2 rounded-full"><Navigation size={18} className="text-emerald-400" /></div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom drawer */}
        {isLive && (
          <div className="bg-[#181b26]/95 backdrop-blur border-t border-white/10 rounded-t-3xl px-5 pt-4 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] z-20">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black shrink-0">{ride.passenger.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{ride.passenger.name}</p>
                    <div className="flex items-center gap-1 mt-0.5"><Star size={11} className="text-amber-400 fill-amber-400" /><span className="text-xs text-slate-400">{ride.passenger.rating}</span></div>
                  </div>
                </div>
                {isActive
                  ? <div className="font-mono font-black text-lg text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{formatTime(tripSeconds)}</div>
                  : <button onClick={() => toast("Calling...")} className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Phone size={16} className="text-emerald-400" /></button>
                }
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[{icon:IndianRupee,c:"text-emerald-400",v:ride.fare},{icon:Route,c:"text-indigo-400",v:ride.distance},{icon:Clock,c:"text-amber-400",v:ride.duration}].map(({icon:Ic,c,v},i)=>(
                  <div key={i} className="bg-[#0f1117] rounded-xl p-3 text-center border border-white/5"><Ic size={13} className={`${c} mx-auto mb-1`}/><p className="text-xs font-bold text-white">{v}</p></div>
                ))}
              </div>

              {isActive ? (
                <button onClick={() => { setIsFullscreen(false); onEndTrip(); }} className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-900/30">
                  <Square size={15} /> End Trip
                </button>
              ) : (
                <div className="flex gap-2.5">
                  {!enRoute
                    ? <button onClick={() => { setEnRoute(true); toast.success("Navigation started!"); }} className="flex-1 py-3.5 rounded-xl bg-[#0f1117] border border-indigo-500/30 text-indigo-300 text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-500/10 transition-all"><Navigation size={14} /> Navigate</button>
                    : <div className="flex-1 py-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold flex items-center justify-center gap-2"><Navigation size={14} className="animate-pulse" /> En route…</div>
                  }
                  <button onClick={() => { setIsFullscreen(false); onStartTrip(); }} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-900/30">
                    <Play size={14} /> Start Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WIDGET (embedded in dashboard) ─────────────────────────────────────────
  return (
    <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header row — expand button uses stopPropagation so map clicks don't trigger it */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Live Tracker</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isActive ? "Trip in progress" : isLive ? "Heading to pickup" : "Broadcasting your location · every 10s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={isLive ? "emerald" : "indigo"} pulse>{isLive ? "LIVE" : "GPS"}</Badge>
          {/* FIX: This button is standalone — no wrapper onClick, stopPropagation is safety net */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
            title="Expand map"
          >
            <Maximize2 size={14} className="text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Map — NOT wrapped in any onClick div */}
      <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ height: 300 }}>
        <LiveTracking
          mode="captain_tracking"
          pickupAddress={pickupAddress}
          socket={socket}
          rideId={ride?.id}
          updateIntervalMs={8000}
          height="100%"
          showControls
          allowFullscreen={false}
        />
      </div>

      {/* Bottom info strip */}
      {isLive ? (
        <div className="mx-5 mb-5 bg-[#0f1117] border border-white/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">{ride.passenger.avatar}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{ride.passenger.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{isActive ? `→ ${ride.destination}` : `Pickup: ${ride.pickupStr}`}</p>
          </div>
          {/* Expand affordance */}
          <button onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }} className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
            <Maximize2 size={13} className="text-emerald-400" />
          </button>
        </div>
      ) : (
        <div className="mx-5 mb-5 bg-[#0f1117] border border-white/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0"><Navigation size={14} className="text-indigo-400" /></div>
          <div><p className="text-xs font-bold text-white">Location Active</p><p className="text-[10px] text-slate-500">Your GPS is being shared with the platform</p></div>
        </div>
      )}
    </div>
  );
}

// ─── MY TRIPS VIEW ─────────────────────────────────────────────────────────────
function MyTripsView({ onNav }) {
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = MOCK_TRIPS.filter(t => {
    const fm = filter === "all" || t.status === filter;
    const sm = !search || t.pickup.toLowerCase().includes(search.toLowerCase()) || t.drop.toLowerCase().includes(search.toLowerCase());
    return fm && sm;
  });
  const earned = MOCK_TRIPS.filter(t => t.status === "completed").reduce((s,t) => s + t.fare, 0);

  return (
    <div className="space-y-5 fade-up mt-2">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Trips",  value: MOCK_TRIPS.length,                                      icon:Car,          color:"indigo"  },
          { label:"Completed",    value: MOCK_TRIPS.filter(t=>t.status==="completed").length,    icon:CheckCircle,  color:"emerald" },
          { label:"Total Earned", value:`₹${earned.toLocaleString()}`,                           icon:IndianRupee,  color:"amber"   },
        ].map((s,i) => {
          const c = colorMap[s.color];
          return (
            <div key={i} className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-3`}><s.icon size={15} className={c.text} /></div>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[#181b26] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <Filter size={13} className="text-slate-600 shrink-0" />
          <input className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none" placeholder="Search trips…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")}><X size={13} className="text-slate-500 hover:text-white" /></button>}
        </div>
        <div className="flex gap-2">
          {["all","completed","cancelled"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${filter===f ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-[#181b26] text-slate-500 border border-white/[0.06] hover:text-white"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Trip list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-8 text-center">
            <p className="text-sm font-bold text-slate-400">No trips found</p>
            <p className="text-xs text-slate-600 mt-1">Try adjusting your search or filter</p>
          </div>
        )}
        {filtered.map(trip => (
          <div key={trip.id} className={`bg-[#181b26] border rounded-2xl overflow-hidden transition-all duration-300 ${expandedId===trip.id ? "border-emerald-500/30" : "border-white/[0.06] hover:border-white/15"}`}>
            <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setExpandedId(expandedId===trip.id ? null : trip.id)}>
              <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${trip.status==="completed" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {trip.status==="completed" ? <CheckCircle size={15} className="text-emerald-400" /> : <X size={15} className="text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{trip.drop}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{trip.pickup}</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-sm font-black text-white">₹{trip.fare}</p>
                <p className="text-[10px] text-slate-600">{trip.date}</p>
              </div>
              <ChevronDown size={14} className={`text-slate-600 shrink-0 transition-transform duration-200 ${expandedId===trip.id ? "rotate-180" : ""}`} />
            </button>
            {expandedId===trip.id && (
              <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[{label:"Distance",val:trip.distance,icon:Route,c:"text-indigo-400"},{label:"Duration",val:trip.duration,icon:Clock,c:"text-amber-400"},{label:"Payment",val:trip.payMode,icon:CreditCard,c:"text-purple-400"}].map(({label,val,icon:Ic,c},i)=>(
                    <div key={i} className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5"><Ic size={12} className={`${c} mx-auto mb-1`}/><p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p><p className="text-xs font-bold text-white mt-0.5">{val}</p></div>
                  ))}
                </div>
                {trip.rating && (
                  <div className="flex items-center justify-between bg-[#0f1117] border border-white/5 rounded-xl px-3 py-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Passenger Rating</span>
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} size={11} className={s<=trip.rating ? "text-amber-400 fill-amber-400":"text-slate-700"} />)}</div>
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

// ─── EARNINGS VIEW ──────────────────────────────────────────────────────────────
function EarningsView() {
  const max          = Math.max(...MOCK_EARNINGS.map(d => d.amount));
  const totalGross   = MOCK_EARNINGS.reduce((s,d) => s + d.amount, 0);
  const platformFee  = Math.round(totalGross * 0.20);
  const netPayout    = totalGross - platformFee + 500; // + bonus + fuel
  const todayIdx     = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div className="space-y-5 fade-up mt-2">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Gross Earned"  value={`₹${totalGross.toLocaleString()}`}  icon={IndianRupee} color="emerald" index={0} trend={12}  trendLabel="+12% vs last week" />
        <StatCard label="Net Payout"    value={`₹${netPayout.toLocaleString()}`}   icon={Wallet}      color="indigo"  index={1} trend={8}   trendLabel="after deductions"  />
        <StatCard label="Total Trips"   value={MOCK_EARNINGS.reduce((s,d)=>s+d.trips,0)} icon={Car}  color="amber"   index={2} trend={5}   trendLabel="this week"         />
        <StatCard label="Avg / Trip"    value={`₹${Math.round(totalGross/MOCK_EARNINGS.reduce((s,d)=>s+d.trips,0))}`} icon={TrendingUp} color="purple" index={3} trend={3} trendLabel="per ride" />
      </div>

      {/* Bar chart */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-5">Weekly Overview</h3>
        <div className="flex items-end gap-3 h-36 mb-4">
          {MOCK_EARNINGS.map((d, i) => {
            const pct     = (d.amount / max) * 100;
            const isToday = i === todayIdx;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className={`text-[9px] font-bold transition-colors ${isToday ? "text-emerald-400" : "text-slate-700 group-hover:text-slate-400"}`}>₹{(d.amount/1000).toFixed(1)}k</span>
                <div className="w-full relative rounded-lg overflow-hidden bg-[#0f1117]" style={{ height:`${Math.max(pct*0.92, 8)}%` }}>
                  <div className={`absolute inset-0 ${isToday ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-slate-800 group-hover:bg-slate-700"} transition-colors duration-200`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-emerald-400" : "text-slate-600"}`}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white">This Week's Breakdown</h3>
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"><Download size={13} /> Export</button>
        </div>
        <div className="space-y-1">
          {[
            { label:"Gross Earnings",    amount: totalGross,         plus:true,  icon:IndianRupee },
            { label:"Platform Fee (20%)",amount:-platformFee,        plus:false, icon:Zap         },
            { label:"Fuel Reimbursement",amount:+200,               plus:true,  icon:Fuel        },
            { label:"10-Trip Bonus",     amount:+300,               plus:true,  icon:Award       },
          ].map((r,i,arr) => (
            <div key={i} className={`flex items-center justify-between py-3 ${i<arr.length-1?"border-b border-white/5":""}`}>
              <div className="flex items-center gap-2">
                <r.icon size={14} className={r.plus ? "text-emerald-400" : "text-red-400"} />
                <span className="text-sm text-slate-300">{r.label}</span>
              </div>
              <span className={`text-sm font-black ${r.plus ? "text-white" : "text-red-400"}`}>{r.plus?"+":"-"}₹{Math.abs(r.amount).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 mt-1 border-t-2 border-emerald-500/20">
            <span className="text-sm font-bold text-white">Net Payout</span>
            <span className="text-xl font-black text-emerald-400">₹{netPayout.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Daily table */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-5">Daily Summary</h3>
        <div className="space-y-2">
          {MOCK_EARNINGS.map((d,i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase w-8 shrink-0">{d.day}</span>
              <div className="flex-1 h-2 bg-[#0f1117] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700" style={{ width:`${(d.amount/max)*100}%` }} />
              </div>
              <div className="text-right w-24 shrink-0">
                <span className="text-xs font-bold text-white">₹{d.amount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-600 ml-2">{d.trips} trips</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PERFORMANCE VIEW ───────────────────────────────────────────────────────────
function PerformanceView() {
  const rating    = 4.82;
  const ratingDst = [{s:5,n:38,p:76},{s:4,n:9,p:18},{s:3,n:2,p:4},{s:2,n:1,p:2},{s:1,n:0,p:0}];
  const metrics   = [
    { label:"Acceptance Rate", value:"94%",  target:"≥95%", ok:false, icon:CheckCircle, color:"amber"   },
    { label:"Completion Rate", value:"97%",  target:"≥95%", ok:true,  icon:CheckCircle, color:"emerald" },
    { label:"On-Time Pickup",  value:"89%",  target:"≥90%", ok:false, icon:Clock,       color:"amber"   },
    { label:"Cancellation",    value:"3%",   target:"<5%",  ok:true,  icon:X,           color:"emerald" },
  ];
  const badges = [
    { e:"⭐", label:"5-Star Driver",    desc:"10 perfect trips",    unlocked:true  },
    { e:"🏆", label:"Top Earner",       desc:"₹10k in a week",      unlocked:true  },
    { e:"⚡", label:"Speed Demon",      desc:"20 on-time trips",    unlocked:true  },
    { e:"🌙", label:"Night Owl",        desc:"10 late-night rides", unlocked:false },
    { e:"🗺️", label:"City Explorer",   desc:"50 unique zones",     unlocked:false },
    { e:"💎", label:"Diamond Driver",   desc:"500 total trips",     unlocked:false },
  ];
  return (
    <div className="space-y-5 fade-up mt-2">
      {/* Rating overview */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-5">Overall Rating</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="flex flex-col items-center shrink-0">
            <p className="text-6xl font-black text-white tracking-tight">{rating}</p>
            <div className="flex gap-1 mt-2">{[1,2,3,4,5].map(s=><Star key={s} size={16} className={s<=Math.round(rating)?"text-amber-400 fill-amber-400":"text-slate-700"} />)}</div>
            <p className="text-xs text-slate-500 mt-1.5">from 50 ratings</p>
          </div>
          <div className="flex-1 w-full space-y-2.5">
            {ratingDst.map(r => (
              <div key={r.s} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8 shrink-0 justify-end">
                  <span className="text-xs text-slate-500">{r.s}</span>
                  <Star size={9} className="text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-2 bg-[#0f1117] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width:`${r.p}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-5 text-right">{r.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m,i) => {
          const c = colorMap[m.color];
          return (
            <div key={i} className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${m.ok?"bg-emerald-500/15":"bg-amber-500/15"}`}>
                  {m.ok ? <Check size={10} className="text-emerald-400" /> : <AlertCircle size={10} className="text-amber-400" />}
                </div>
              </div>
              <p className={`text-3xl font-black leading-none mb-1 ${m.ok?"text-white":c.text}`}>{m.value}</p>
              <p className="text-[10px] text-slate-600">Target: {m.target}</p>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-5">Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((b,i) => (
            <div key={i} className={`rounded-2xl p-4 text-center border transition-all ${b.unlocked?"bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-amber-500/20":"bg-[#0f1117] border-white/5 opacity-35"}`}>
              <p className="text-2xl mb-2">{b.e}</p>
              <p className="text-[11px] font-bold text-white leading-snug">{b.label}</p>
              <p className="text-[9px] text-slate-500 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-5">Recent Reviews</h3>
        <div className="space-y-4">
          {MOCK_REVIEWS.map((r,i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">{r.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-white">{r.name}</p>
                  <p className="text-[10px] text-slate-600">{r.date}</p>
                </div>
                <div className="flex gap-0.5 mb-1.5">{[1,2,3,4,5].map(s=><Star key={s} size={10} className={s<=r.rating?"text-amber-400 fill-amber-400":"text-slate-700"} />)}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ──────────────────────────────────────────────────────────────
function SettingsView() {
  const { authUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: authUser?.fullName?.firstName ?? "Captain",
    lastName:  authUser?.fullName?.lastName  ?? "",
    email:     authUser?.email               ?? "captain@example.com",
    phone:     authUser?.phone               ?? "+91 98765 43210",
  });
  const [notifs, setNotifs] = useState({ rides:true, promos:false, updates:true, sound:true });
  const [showPw, setShowPw] = useState(false);

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} className={`relative w-10 h-[22px] rounded-full transition-colors duration-300 shrink-0 ${value?"bg-emerald-500":"bg-slate-700"}`}>
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${value?"translate-x-5":"translate-x-[3px]"}`} />
    </button>
  );

  const Row = ({ label, desc, value, onChange }) => (
    <div className="flex items-start justify-between py-3.5 border-b border-white/5 last:border-0">
      <div className="flex-1 pr-4"><p className="text-sm font-semibold text-white">{label}</p>{desc&&<p className="text-xs text-slate-500 mt-0.5">{desc}</p>}</div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-5 fade-up mt-2 max-w-2xl">
      {/* Profile */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white">Profile</h3>
          <button onClick={() => setEditing(e => !e)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors">
            <Edit3 size={13} />{editing?"Cancel":"Edit"}
          </button>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xl font-black text-white">
              {(authUser?.fullName?.firstName?.[0]??"")+( authUser?.fullName?.lastName?.[0]??"")}
            </div>
            {editing && (
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <Camera size={11} className="text-white" />
              </button>
            )}
          </div>
          <div>
            <p className="text-base font-black text-white">{profile.firstName} {profile.lastName}</p>
            <div className="flex items-center gap-1.5 mt-1"><Shield size={11} className="text-emerald-400" /><span className="text-xs text-emerald-400 font-bold">Verified Driver</span></div>
          </div>
        </div>
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[["First Name","firstName"],["Last Name","lastName"]].map(([label,key])=>(
                <div key={key}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" value={profile[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))} />
                </div>
              ))}
            </div>
            {[["Email","email"],["Phone","phone"]].map(([label,key])=>(
              <div key={key}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
                <input className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors" value={profile[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))} />
              </div>
            ))}
            <button onClick={()=>{setEditing(false); toast.success("Profile updated!");}} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-900/20">
              <Save size={14} /> Save Changes
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {[["Email",profile.email],["Phone",profile.phone]].map(([l,v])=>(
              <div key={l} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-semibold text-white">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-1">Notifications</h3>
        <p className="text-xs text-slate-500 mb-4">Control what you hear and when.</p>
        <Row label="New Ride Requests"    desc="Alert when a passenger books near you"    value={notifs.rides}   onChange={v=>setNotifs(n=>({...n,rides:v}))} />
        <Row label="Sound Alerts"         desc="Play a chime for new ride notifications"  value={notifs.sound}   onChange={v=>setNotifs(n=>({...n,sound:v}))} />
        <Row label="Promotions & Bonuses" desc="Weekly incentives and special offers"      value={notifs.promos}  onChange={v=>setNotifs(n=>({...n,promos:v}))} />
        <Row label="App Updates"          desc="Critical updates and announcements"        value={notifs.updates} onChange={v=>setNotifs(n=>({...n,updates:v}))} />
      </div>

      {/* Security */}
      <div className="bg-[#181b26] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Security</h3>
        <div className="space-y-2">
          {[
            { label:"Change Password",   desc:"Update your account password",        icon:Lock,        action:()=>toast("Coming soon") },
            { label:"Two-Factor Auth",   desc:"Extra layer of account security",     icon:Smartphone,  action:()=>toast("Coming soon") },
            { label:"Active Sessions",   desc:"Manage all logged-in devices",        icon:Globe,       action:()=>toast("Coming soon") },
          ].map((item,i)=>(
            <button key={i} onClick={item.action} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#0f1117] border border-white/5 hover:border-white/15 text-left group transition-all">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors shrink-0"><item.icon size={14} className="text-slate-400" /></div>
              <div className="flex-1"><p className="text-xs font-bold text-white">{item.label}</p><p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p></div>
              <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#181b26] border border-red-500/10 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-red-400 mb-4">Danger Zone</h3>
        <button onClick={()=>toast.error("Please contact support to deactivate your account.")} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 text-left group transition-all">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"><AlertCircle size={14} className="text-red-400" /></div>
          <div className="flex-1"><p className="text-xs font-bold text-red-300">Deactivate Account</p><p className="text-[10px] text-slate-500 mt-0.5">Permanently disable your driver account</p></div>
          <ChevronRight size={13} className="text-red-500/40" />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function CaptainDashboard() {
  const { authUser, logoutUser }      = useAuthStore();
  const navigate                      = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav,   setActiveNav]   = useState("Dashboard");
  const [tripSeconds, setTripSeconds] = useState(0);

  const { rideDetails, setRideDetails, captainRideState: ridePhase, setCaptainRideState: setRidePhase, resetRide } = useRideStore();
  const { toggleAvailability }    = useCaptainStore();
  const { socket, connectSocket } = useSocketStore();

  const captain   = authUser;
  const firstName = captain?.fullName?.firstName ?? "Captain";
  const lastName  = captain?.fullName?.lastName  ?? "";
  const isOnline  = authUser?.status === "active";

  // ── Connect socket ────────────────────────────────────────────────────────
  useEffect(() => { if (authUser) connectSocket(authUser); }, [authUser, connectSocket]);

  // ── Trip timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (ridePhase === "trip_active") {
      const t = setInterval(() => setTripSeconds(s => s + 1), 1000);
      return () => clearInterval(t);
    }
    setTripSeconds(0);
  }, [ridePhase]);

  // ── Live idle GPS broadcast ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || !socket) return;
    const send = () => {
      navigator.geolocation?.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          socket.emit("update-location-captain", {
            userId:   captain?._id || captain?.id,
            location: { type:"Point", coordinates:[longitude, latitude] },
          });
        },
        err => console.warn("GPS:", err.message),
        { enableHighAccuracy: true },
      );
    };
    send();
    const id = setInterval(send, 10000);
    return () => clearInterval(id);
  }, [isOnline, socket, captain]);

  // ── Join trip room ────────────────────────────────────────────────────────
  useEffect(() => {
    if (ridePhase === "trip_active" && socket && rideDetails?._id) {
      socket.emit("join_trip", { rideId: rideDetails._id, role:"captain" });
    }
  }, [ridePhase, socket, rideDetails?._id]);

  // ── Incoming ride listener ────────────────────────────────────────────────
  const ridePhaseRef = useRef(ridePhase);
  useEffect(() => { ridePhaseRef.current = ridePhase; }, [ridePhase]);
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (ridePhaseRef.current === "idle") { setRideDetails(data); setRidePhase("incoming"); }
    };
    socket.off("new-ride");
    socket.on("new-ride", handler);
    return () => socket.off("new-ride", handler);
  }, [socket, setRideDetails, setRidePhase]);

  // ── API handlers ──────────────────────────────────────────────────────────
  const handleAcceptRide = async () => {
    if (!rideDetails?._id) return toast.error("No active ride");
    try {
      await AxiosAPI.post("/ride/accept", { rideId: rideDetails._id }, { withCredentials:true });
      socket?.emit("ride-accepted", { rideId: rideDetails._id, captainId: captain?._id || captain?.id });
      setRidePhase("accepted");
      toast.success("Ride accepted!");
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to accept"); }
  };

  const handleStartTrip = async () => {
    if (!rideDetails?._id) { setRidePhase("trip_active"); return; }
    try {
      await AxiosAPI.post("/ride/start", { rideId: rideDetails._id }, { withCredentials:true });
      socket?.emit("trip-started", { rideId: rideDetails._id });
      setRidePhase("trip_active");
      toast.success("Trip started!");
    } catch { setRidePhase("trip_active"); }
  };

  const handleEndTrip = async () => {
    if (rideDetails?._id) {
      try {
        await AxiosAPI.post("/ride/complete", { rideId: rideDetails._id }, { withCredentials:true });
        socket?.emit("trip-ended", { rideId: rideDetails._id });
      } catch (e) { console.error(e); }
    }
    resetRide();
    toast.success("Trip completed! 🎉");
  };

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res?.success) { toast.success("Logged out"); navigate("/login"); }
    else toast.error(res?.message || "Logout failed");
  };

  const toggleOnline = async () => {
    const r = await toggleAvailability();
    if (r.success) toast.success(r.status === "active" ? "You're online!" : "You're offline");
    else toast.error(r.message);
  };

  const formatRideForUI = (dbRide) => {
    if (!dbRide) return null;
    const n = dbRide.user?.fullName ? `${dbRide.user.fullName.firstName} ${dbRide.user.fullName.lastName}` : "Passenger";
    return {
      id:          dbRide._id || "pending",
      passenger:   { name:n, avatar:n.charAt(0).toUpperCase(), rating:"4.9", phone: dbRide.user?.phone || "—" },
      pickupStr:   dbRide.pickup,
      destination: dbRide.destination,
      fare:        `₹${dbRide.fare}`,
      distance:    dbRide.distance ? `${(dbRide.distance/1000).toFixed(1)} km` : "—",
      duration:    dbRide.duration ? `${Math.ceil(dbRide.duration/60)} min`    : "—",
    };
  };

  const uiRide = formatRideForUI(rideDetails);
  const hour   = new Date().getHours();
  const greeting = hour < 12 ? "Good morning ☀️" : hour < 18 ? "Good afternoon 🌤️" : "Good evening 🌙";

  // ── Sidebar nav handler ───────────────────────────────────────────────────
  const goTo = useCallback((label) => { setActiveNav(label); setSidebarOpen(false); }, []);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        *, *::before, *::after { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#222635; border-radius:9999px; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ═══════════════════════ SIDEBAR ════════════════════════════════════ */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[232px] bg-[#12151e] border-r border-white/[0.05] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Car size={15} className="text-white" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-black text-white tracking-tight">UBER</p>
            <p className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase">Captain</p>
          </div>
        </div>

        {/* Online toggle */}
        <div className="px-4 pt-5 pb-3">
          <button onClick={toggleOnline} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${isOnline ? "border-emerald-500/25 bg-emerald-500/8" : "border-white/8 bg-white/3 hover:bg-white/5"}`}>
            <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 shrink-0 ${isOnline ? "bg-emerald-500" : "bg-slate-700"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${isOnline ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-xs font-black ${isOnline ? "text-emerald-400" : "text-slate-500"}`}>{isOnline ? "Online" : "Offline"}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{isOnline ? "Accepting new rides" : "Not accepting rides"}</p>
            </div>
          </button>
        </div>

        {/* Section label */}
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] px-5 mb-2">Navigation</p>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = activeNav === item.label;
            return (
              <button key={item.label} onClick={() => goTo(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group ${active ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? "bg-emerald-500/15" : "bg-transparent group-hover:bg-white/5"}`}>
                  <item.icon size={15} className={active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"} />
                </div>
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="px-5 my-3"><div className="border-t border-white/[0.05]" /></div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] px-5 mb-2">Quick links</p>

        {/* Quick links */}
        <div className="px-3 pb-3 space-y-0.5">
          {[
            { label:"Ride History",  icon:History,   nav:"My Trips"    },
            { label:"Wallet",        icon:Wallet,    nav:"Earnings"    },
            { label:"Support",       icon:HelpCircle, nav:"Settings"   },
          ].map(q => (
            <button key={q.label} onClick={() => goTo(q.nav)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-white/5 text-xs font-semibold transition-all border border-transparent">
              <q.icon size={13} />
              {q.label}
            </button>
          ))}
        </div>

        {/* Profile + logout */}
        <div className="border-t border-white/[0.05] p-4 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-default">
            <CaptainAvatar size="w-9 h-9" fontSize="12px" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{firstName} {lastName}</p>
              <p className="text-[10px] text-slate-500 truncate">{captain?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ═════════════════════ MAIN CONTENT ═════════════════════════════════ */}
      <div className="flex-1 lg:ml-[232px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0f1117]/85 backdrop-blur-md border-b border-white/[0.05] h-14 px-5 flex items-center gap-4">
          <button className="lg:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" onClick={() => setSidebarOpen(s => !s)}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="flex-1">
            <span className="text-sm font-black text-white hidden sm:block">{activeNav}</span>
          </div>
          {/* Online pill */}
          <div className={`hidden sm:flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider transition-all ${isOnline ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-500 border border-white/10"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>
          <button className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Bell size={15} className="text-slate-400" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 ring-1 ring-[#0f1117]" />
          </button>
          <CaptainAvatar size="w-9 h-9" fontSize="12px" />
        </header>

        {/* Page */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6">

          {/* ── DASHBOARD ── */}
          {activeNav === "Dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left — wide */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                {/* Hero */}
                <div className="relative bg-[#181b26] border border-white/[0.06] rounded-2xl p-6 overflow-hidden fade-up" style={{ animationDelay:"0ms" }}>
                  <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-600/8 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-24 bg-teal-600/5 rounded-full blur-2xl pointer-events-none" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">{greeting}</p>
                  <h1 className="text-2xl font-black text-white tracking-tight mb-1">Ready to roll, {firstName}?</h1>
                  <p className="text-sm text-slate-400 mb-5 leading-relaxed">Stay online to receive ride requests and boost your earnings today.</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { icon:Activity,  color:"text-emerald-400", label:"Today",      val:"₹0 earned" },
                      { icon:Target,    color:"text-amber-400",   label:"Daily goal", val:"₹1,500"    },
                      { icon:Car,       color:"text-indigo-400",  label:"Trips today",val:"0 rides"   },
                    ].map(({icon:Ic,color,label,val},i) => (
                      <div key={i} className="bg-[#0f1117] border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <Ic size={14} className={color} />
                        <div><p className="text-[10px] text-slate-500">{label}</p><p className="text-sm font-bold text-white">{val}</p></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Earnings" value="₹9,550" icon={IndianRupee} color="emerald" index={0} trend={12}  trendLabel="+12% this week" />
                  <StatCard label="Trips"    value="60"      icon={Car}         color="indigo"  index={1} trend={5}   trendLabel="+5 vs last week" />
                  <StatCard label="Online"   value="42 hrs"  icon={Timer}       color="amber"   index={2} trend={-2}  trendLabel="-2 hrs vs last week" />
                  <StatCard label="Rating"   value="4.82"    icon={Star}        color="purple"  index={3} trend={0.1} trendLabel="+0.1 this month" />
                </div>

                {/* Live map widget */}
                <div className="fade-up" style={{ animationDelay:"160ms" }}>
                  <CaptainLiveMapPanel socket={socket} ride={uiRide} ridePhase={ridePhase} tripSeconds={tripSeconds} onStartTrip={handleStartTrip} onEndTrip={handleEndTrip} />
                </div>

                {/* Recent trips */}
                <div className="fade-up bg-[#181b26] border border-white/[0.06] rounded-2xl p-5" style={{ animationDelay:"200ms" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Recent Trips</h3>
                    <button onClick={() => goTo("My Trips")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">View all <ChevronRight size={12} /></button>
                  </div>
                  <div className="space-y-1">
                    {MOCK_TRIPS.slice(0,4).map(t => (
                      <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${t.status==="completed"?"bg-emerald-500/10":"bg-red-500/10"}`}>
                          {t.status==="completed" ? <CheckCircle size={13} className="text-emerald-400" /> : <X size={13} className="text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{t.drop}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{t.date}</p>
                        </div>
                        <span className="text-sm font-black text-white">₹{t.fare}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-5">
                {/* Ride request panel */}
                <div className="fade-up" style={{ animationDelay:"60ms" }}>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] mb-2">Ride Request</p>
                  {ridePhase === "idle"        && <IdleRidePanel />}
                  {ridePhase === "incoming"    && uiRide && <IncomingRideRequest ride={uiRide} onAccept={handleAcceptRide} onDecline={resetRide} />}
                  {ridePhase === "accepted"    && uiRide && <AcceptedRidePanel ride={uiRide} onBack={() => setRidePhase("incoming")} onStartTrip={handleStartTrip} />}
                  {ridePhase === "trip_active" && uiRide && <TripActivePanel ride={uiRide} onEndTrip={handleEndTrip} tripSeconds={tripSeconds} />}
                </div>

                {/* Vehicle */}
                <div className="fade-up" style={{ animationDelay:"120ms" }}><VehicleCard captain={captain} /></div>

                {/* Mini earnings chart */}
                <div className="fade-up bg-[#181b26] border border-white/[0.06] rounded-2xl p-5" style={{ animationDelay:"180ms" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Week Earnings</h3>
                    <button onClick={() => goTo("Earnings")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">Details <ChevronRight size={12} /></button>
                  </div>
                  <div className="flex items-end justify-between gap-1.5 h-16 mb-3">
                    {MOCK_EARNINGS.map((d,i) => {
                      const max = Math.max(...MOCK_EARNINGS.map(x => x.amount));
                      const pct = (d.amount/max)*100;
                      const isToday = i === (new Date().getDay()===0?6:new Date().getDay()-1);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-md overflow-hidden" style={{ height:`${Math.max(pct*0.88,5)}%`, minHeight:4 }}>
                            <div className={`w-full h-full ${isToday?"bg-emerald-500":"bg-slate-800"}`} />
                          </div>
                          <span className={`text-[8px] font-bold uppercase ${isToday?"text-emerald-400":"text-slate-700"}`}>{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total this week</span>
                    <span className="text-sm font-black text-white">₹{MOCK_EARNINGS.reduce((s,d)=>s+d.amount,0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === "My Trips"    && <MyTripsView    onNav={goTo} />}
          {activeNav === "Earnings"    && <EarningsView   />}
          {activeNav === "Performance" && <PerformanceView />}
          {activeNav === "Settings"    && <SettingsView   />}
        </main>
      </div>
    </div>
  );
}

// Helper used in SettingsView — needs to be in scope
function HelpCircle(props) { return <svg xmlns="http://www.w3.org/2000/svg" width={props.size??24} height={props.size??24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>; }