import { useState, useEffect, useRef } from "react";
import {
  Car,
  MapPin,
  Navigation,
  Star,
  Clock,
  TrendingUp,
  ChevronRight,
  LogOut,
  Bell,
  IndianRupee,
  Route,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  Zap,
  BarChart3,
  ArrowRight,
  LayoutDashboard,
  History,
  Wallet,
  Settings,
  Menu,
  X,
  Award,
  Timer,
  ArrowLeft,
  User,
  AlertTriangle,
  Fuel,
  ChevronDown,
  ChevronUp,
  Map,
  Radio,
  Circle,
  Crosshair,
  TrendingDown,
  Play,
  Square,
  CreditCard,
  Calendar,
  FileText,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  ToggleLeft,
  Gauge,
  Milestone,
  CheckSquare,
} from "lucide-react";
import LiveTracking from "../components/LiveTracking";

// ─── CAPTAIN SESSION PERSISTENCE ─────────────────────────────────────────────
// Ride phase ("incoming"/"accepted"/"trip_active") must survive a page refresh
// so the captain doesn't lose their in-progress trip. We persist only the phase
// (the full ride details are already persisted by RideContext).
const CAPTAIN_PHASE_KEY = "captain_ride_phase";
const saveCaptainPhase  = (phase) => { try { sessionStorage.setItem(CAPTAIN_PHASE_KEY, phase); } catch {} };
const loadCaptainPhase  = ()       => { try { return sessionStorage.getItem(CAPTAIN_PHASE_KEY) || "idle"; } catch { return "idle"; } };
const clearCaptainPhase = ()       => { try { sessionStorage.removeItem(CAPTAIN_PHASE_KEY); } catch {} };
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSocketStore } from "../context/SocketContext";
import { useCaptainStore } from "../context/CaptainContext";
import { useRideStore } from "../context/RideContext";
import { AxiosAPI } from "../api/Axios";
import { useAuthStore } from "../context/UserContext";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const RECENT_TRIPS = [
  {
    id: 1,
    passenger: "Aarav Sharma",
    from: "Connaught Place",
    to: "IGI Airport",
    time: "Today, 9:14 AM",
    fare: "₹842",
    distance: "28 km",
    duration: "42 min",
    status: "completed",
    rating: 5,
    avatar: "AS",
  },
  {
    id: 2,
    passenger: "Priya Mehta",
    from: "Sector 62, Noida",
    to: "Cyber City, Gurugram",
    time: "Yesterday, 6:45 PM",
    fare: "₹387",
    distance: "34 km",
    duration: "55 min",
    status: "completed",
    rating: 4,
    avatar: "PM",
  },
  {
    id: 3,
    passenger: "Rahul Gupta",
    from: "Lajpat Nagar",
    to: "Karol Bagh",
    time: "22 May, 11:00 AM",
    fare: "₹156",
    distance: "9 km",
    duration: "22 min",
    status: "cancelled",
    rating: null,
    avatar: "RG",
  },
];

const WEEKLY_EARNINGS = [
  { day: "Mon", amount: 1200, trips: 8 },
  { day: "Tue", amount: 1800, trips: 12 },
  { day: "Wed", amount: 950, trips: 6 },
  { day: "Thu", amount: 2200, trips: 14 },
  { day: "Fri", amount: 3100, trips: 19 },
  { day: "Sat", amount: 2700, trips: 16 },
  { day: "Sun", amount: 1842, trips: 11 },
];

const STATS = [
  {
    label: "Today's Earnings",
    value: "₹1,842",
    delta: "+23%",
    icon: IndianRupee,
    color: "emerald",
  },
  {
    label: "Trips Today",
    value: "11",
    delta: "+3 vs avg",
    icon: Car,
    color: "indigo",
  },
  {
    label: "Online Hours",
    value: "7.4 hrs",
    delta: "Active",
    icon: Timer,
    color: "amber",
  },
  {
    label: "Avg. Rating",
    value: "4.91",
    delta: "↑ Excellent",
    icon: Star,
    color: "purple",
  },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Trips", icon: History },
  { label: "Earnings", icon: Wallet },
  { label: "Performance", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
};

const MOCK_RIDE = {
  id: "ride_8x91k",
  passenger: {
    name: "Aarav Sharma",
    avatar: "AS",
    rating: 4.8,
    totalRides: 142,
    phone: "+91 98765 43210",
    memberSince: "2022",
    preferredLanguage: "Hindi / English",
  },
  pickup: { label: "Connaught Place, Block A", coords: "28.6315°N, 77.2167°E" },
  pickupStr: "Connaught Place, Block A",
  drop: { label: "IGI Airport, Terminal 3", coords: "28.5562°N, 77.1000°E" },
  destination: "IGI Airport, Terminal 3",
  fare: "₹842",
  distance: "28 km",
  duration: "42 min",
  vehicleType: "car",
  surgeMultiplier: 1.2,
  paymentMode: "UPI",
};

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────
function CaptainAvatar({ size = "w-8 h-8", fontSize = "14px" }) {
  const { authUser } = useAuthStore();
  const first = authUser?.fullName?.firstName?.[0] ?? "";
  const last = authUser?.fullName?.lastName?.[0] ?? "";
  return (
    <div
      className={`${size} rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shrink-0`}
      style={{ fontSize }}
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
      className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 hover:border-emerald-500/30 hover:bg-[#1e2133] transition-all duration-300 fade-up"
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
        <p className={`text-xs mt-1 font-semibold ${c.text}`}>{stat.delta}</p>
      </div>
    </div>
  );
}

function WeeklyEarningsChart() {
  const max = Math.max(...WEEKLY_EARNINGS.map((d) => d.amount));
  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Weekly Earnings</h3>
          <p className="text-xs text-slate-500 mt-0.5">Mon – Sun breakdown</p>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
          ₹13,792 total
        </span>
      </div>
      <div className="flex items-end gap-2 h-28">
        {WEEKLY_EARNINGS.map((d, i) => {
          const pct = (d.amount / max) * 100;
          const isToday = i === 6;
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-1.5 group"
            >
              <div className="w-full flex items-end" style={{ height: 88 }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 relative ${isToday ? "bg-linear-to-t from-emerald-600 to-emerald-400" : "bg-white/10 group-hover:bg-white/20"}`}
                  style={{ height: `${pct}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0f1117] border border-white/10 text-[9px] text-white font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{d.amount}
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold ${isToday ? "text-emerald-400" : "text-slate-500"}`}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VehicleCard({ captain }) {
  const vehicle = captain?.vehicle;
  const vehicleIcons = { car: "🚗", motorcycle: "🏍️", auto: "🛺" };
  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-white mb-4">Your Vehicle</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-2xl">
          {vehicleIcons[vehicle?.vehicleType] ?? "🚗"}
        </div>
        <div>
          <p className="text-sm font-bold text-white capitalize">
            {vehicle?.vehicleType ?? "Vehicle"}
          </p>
          <p className="text-xs text-slate-400">
            {vehicle?.plate ?? "XX-00-XX-0000"}
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}

function PerformanceBadges() {
  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-white mb-4">
        Badges & Achievements
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Award size={15} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">Top Rated</p>
            <p className="text-[10px] text-slate-500">4.9+ for 30 days</p>
          </div>
          <CheckCircle size={14} className="text-emerald-400 shrink-0" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Zap size={15} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">Quick Acceptor</p>
            <p className="text-[10px] text-slate-500">Avg. 8s response</p>
          </div>
          <CheckCircle size={14} className="text-emerald-400 shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ─── RIDE REQUEST FLOW ────────────────────────────────────────────────────────
function IncomingRideRequest({ ride, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(28);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onDecline]);

  const progress = ((28 - timeLeft) / 28) * 100;
  const urgency = timeLeft <= 8;

  return (
    <div
      className={`bg-[#1a1d27] border rounded-2xl p-5 transition-all duration-300 ${urgency ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${urgency ? "bg-red-400" : "bg-amber-400"}`}
          />
          <span
            className={`text-sm font-bold ${urgency ? "text-red-400" : "text-amber-400"}`}
          >
            New Ride Request
          </span>
        </div>
        <span
          className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${urgency ? "text-red-300 bg-red-500/10" : "text-white bg-amber-500/10"}`}
        >
          {timeLeft}s
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgency ? "bg-linear-to-r from-red-500 to-red-400" : "bg-linear-to-r from-amber-500 to-orange-400"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {ride.passenger.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{ride.passenger.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-slate-400">
              {ride.passenger.rating}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-white">{ride.fare}</p>
          <p className="text-xs text-slate-500">{ride.distance}</p>
        </div>
      </div>
      <div className="relative p-3 bg-[#0f1117] rounded-xl mb-4 space-y-2">
        <div className="absolute left-5.5 top-6.5 bottom-6.5 w-px bg-linear-to-b from-emerald-500/50 to-red-500/50" />
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Pickup
            </p>
            <p className="text-xs font-semibold text-white">{ride.pickupStr}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Drop
            </p>
            <p className="text-xs font-semibold text-white">
              {ride.destination}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onDecline}
          className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 hover:text-white hover:border-red-500/30 transition-all duration-200"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} /> Accept
        </button>
      </div>
    </div>
  );
}

function AcceptedRidePanel({ ride, onBack, onStartTrip }) {
  const [enRoute, setEnRoute] = useState(false);
  const handleEnRoute = () => {
    setEnRoute(true);
    toast.success("Navigation started — heading to pickup!");
  };

  return (
    <div className="bg-[#1a1d27] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.08)]">
      <div className="bg-linear-to-r from-emerald-900/60 to-teal-900/40 px-4 py-3 flex items-center justify-between border-b border-emerald-500/20">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-emerald-300/70 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">
            Ride Accepted
          </span>
        </div>
        <span className="text-xs text-slate-500">{ride.id}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-indigo-500/30">
            {ride.passenger.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">
              {ride.passenger.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {ride.passenger.phone}
            </p>
          </div>
          <button
            onClick={() => toast("Calling passenger...")}
            className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
          >
            <Phone size={14} className="text-emerald-400" />
          </button>
        </div>
        <div className="relative p-3 bg-[#0f1117] rounded-xl space-y-3 mb-4">
          <div className="absolute left-5.5 top-7 bottom-7 w-px bg-linear-to-b from-emerald-500/40 to-red-500/40" />
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Pickup
              </p>
              <p className="text-xs font-bold text-white">
                {ride.pickup.label}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Drop-off
              </p>
              <p className="text-xs font-bold text-white">{ride.drop.label}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
            <IndianRupee size={13} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">{ride.fare}</p>
            <p className="text-[10px] text-slate-600">Fare</p>
          </div>
          <div className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
            <Route size={13} className="text-indigo-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">{ride.distance}</p>
            <p className="text-[10px] text-slate-600">Distance</p>
          </div>
          <div className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
            <Clock size={13} className="text-amber-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">{ride.duration}</p>
            <p className="text-[10px] text-slate-600">ETA</p>
          </div>
        </div>
        <div className="space-y-2">
          {!enRoute ? (
            <button
              onClick={handleEnRoute}
              className="w-full py-3 bg-[#0f1117] border border-indigo-500/30 text-indigo-300 text-sm font-bold rounded-xl hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Navigation size={15} /> Navigate to Pickup
            </button>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Navigation size={13} className="text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-300">
                En route to pickup…
              </span>
            </div>
          )}
          <button
            onClick={onStartTrip}
            className="w-full py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play size={15} /> Start Trip
          </button>
        </div>
      </div>
    </div>
  );
}

function TripActivePage({ ride, onEndTrip }) {
  const [tripSeconds, setTripSeconds] = useState(0);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [captainPos, setCaptainPos] = useState({ lat: 28.6315, lng: 77.2167 });
  const watchIdRef = useRef(null);

  const { socket } = useSocketStore();

  useEffect(() => {
    const t = setInterval(() => setTripSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Real Geolocation + Socket.io ──────────────────────────────
  useEffect(() => {
    if (!socket) return;
    setSocketStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => setSocketStatus("connected");
    const onDisconnect = () => setSocketStatus("connecting");
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.emit("join_trip", { rideId: ride.id, role: "captain" });

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setCaptainPos({ lat, lng });

          // GeoJSON — backend saves this to captain.location for $geoWithin queries
          socket.emit("captain_location_update", {
            rideId: ride.id,
            location: {
              type: "Point",
              coordinates: [lng, lat], // [longitude, latitude] — GeoJSON order
            },
            timestamp: Date.now(),
          });
        },
        (error) => console.warn("GPS error:", error.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 },
      );
    }
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [ride.id, socket]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${captainPos.lng - 0.05},${captainPos.lat - 0.05},${captainPos.lng + 0.05},${captainPos.lat + 0.05}&layer=mapnik&marker=${captainPos.lat},${captainPos.lng}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#090c12] flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-3 bg-linear-to-b from-[#090c12] to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onEndTrip}
            className="w-10 h-10 rounded-xl bg-[#1a1d27]/90 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
          >
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-[#1a1d27]/90 backdrop-blur border border-white/10 rounded-xl px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {ride.passenger.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {ride.drop.label}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-emerald-400">
                {formatTime(tripSeconds)}
              </p>
              <p className="text-[10px] text-slate-500">elapsed</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <LiveTracking
          mode="captain_tracking"
          socket={socket}
          rideId={ride.id || ride._id}
          updateIntervalMs={5000}
          height="100%"
          showControls={true}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#1a1d27]/95 backdrop-blur border-t border-white/10 px-4 pt-3 pb-6">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
            <IndianRupee size={12} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white leading-tight">
              {ride.fare}
            </p>
          </div>
          <div className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
            <Route size={12} className="text-indigo-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white leading-tight">
              {ride.distance}
            </p>
          </div>
          <div className="bg-[#0f1117] rounded-xl p-2.5 text-center border border-white/5">
            <Clock size={12} className="text-amber-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white leading-tight">
              {ride.duration}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            toast.success("Trip ended!");
            onEndTrip();
          }}
          className="w-full py-3.5 bg-linear-to-r from-red-600 to-rose-600 text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
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
        <p className="text-xs text-slate-600 mt-1">
          Stay online to receive ride requests
        </p>
      </div>
      <div className="flex gap-1.5">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse"
            style={{ animationDelay: `${i * 300}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── NAV PAGE VIEWS ───────────────────────────────────────────────────────────
function MyTripsView() {
  return <div className="text-white p-5">My Trips Placeholder</div>;
}
function EarningsView() {
  return <div className="text-white p-5">Earnings Placeholder</div>;
}
function PerformanceView() {
  return <div className="text-white p-5">Performance Placeholder</div>;
}
function SettingsView() {
  return <div className="text-white p-5">Settings Placeholder</div>;
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function CaptainDashboard() {
  const { authUser, logoutUser } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");

  const { rideDetails, setRideDetails } = useRideStore();
  const { toggleAvailability } = useCaptainStore();

  // Rehydrate phase from sessionStorage on refresh
  const [ridePhase, setRidePhaseState] = useState(() => {
    const persisted = loadCaptainPhase();
    // Only restore active phases if we also have persisted ride details
    const hasPersistentRide = !!rideDetails;
    if (hasPersistentRide && (persisted === "accepted" || persisted === "trip_active")) {
      return persisted;
    }
    return "idle";
  });

  // Wrap setter to also persist
  const setRidePhase = (phase) => {
    setRidePhaseState(phase);
    if (phase === "idle") clearCaptainPhase();
    else saveCaptainPhase(phase);
  };

  const captain = authUser;
  const firstName = captain?.fullName?.firstName ?? "";
  const lastName = captain?.fullName?.lastName ?? "";

  const { socket, connectSocket } = useSocketStore();
  const isOnline = authUser?.status === "active";

  // Connect/reconnect socket on mount — critical for refresh recovery
  useEffect(() => {
    if (authUser) {
      connectSocket(authUser);
    }
  }, [authUser, connectSocket]);

  // 1. Live Location Updater — FIXED: Now sending { lat, lng } payload
  useEffect(() => {
    let locationInterval;
    if (isOnline && socket) {
      const sendLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;

              // GeoJSON Point — [longitude, latitude] order required by MongoDB 2dsphere index.
              // The socket handler on the server must save this shape directly:
              //   captain.location = { type:"Point", coordinates:[lng, lat] }
              socket.emit("update-location-captain", {
                userId: captain?._id || captain?.id,
                location: {
                  type: "Point",
                  coordinates: [longitude, latitude], // [lng, lat] — GeoJSON order
                },
              });
            },
            (error) => console.warn("GPS error:", error.message),
            { enableHighAccuracy: true },
          );
        }
      };
      sendLocation();
      locationInterval = setInterval(sendLocation, 10000);
    }
    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [isOnline, socket, captain]);

  // 2. Incoming Ride Socket Listener
  useEffect(() => {
    if (!socket) return;
    const handleNewRide = (data) => {
      console.log("New Ride Request:", data);
      setRideDetails(data);
      setRidePhase("incoming");
    };
    socket.on("new-ride", handleNewRide);
    return () => socket.off("new-ride", handleNewRide);
  }, [socket, setRideDetails]);

  // 3. Accept Ride — calls backend to mark ride as accepted & assigns captain
  const handleAcceptRide = async () => {
    if (!rideDetails?._id) {
      toast.error("No active ride request to accept");
      return;
    }
    try {
      await AxiosAPI.post(
        `/ride/accept`,
        { rideId: rideDetails._id },
        { withCredentials: true },
      );
      // Notify user's socket that captain accepted
      if (socket) {
        socket.emit("ride-accepted", {
          rideId: rideDetails._id,
          captainId: captain?._id || captain?.id,
        });
      }
      setRidePhase("accepted");
      toast.success("Ride accepted!");
    } catch (err) {
      console.error("Accept ride error:", err);
      toast.error(err?.response?.data?.message || "Failed to accept ride");
    }
  };

  // 4. Start Trip — backend marks ride as "ongoing"
  const handleStartTrip = async () => {
    if (!rideDetails?._id) {
      setRidePhase("trip_active");
      return;
    }
    try {
      await AxiosAPI.post(
        `/ride/start`,
        { rideId: rideDetails._id },
        { withCredentials: true },
      );
      if (socket) {
        socket.emit("trip-started", { rideId: rideDetails._id });
      }
      setRidePhase("trip_active");
      toast.success("Trip started!");
    } catch (err) {
      console.error("Start trip error:", err);
      // Still navigate to active trip even if API fails
      setRidePhase("trip_active");
    }
  };

  // 5. End Trip — backend marks ride as "completed"
  const handleEndTrip = async () => {
    if (rideDetails?._id) {
      try {
        await AxiosAPI.post(
          `/ride/complete`,
          { rideId: rideDetails._id },
          { withCredentials: true },
        );
        if (socket) {
          socket.emit("trip-ended", { rideId: rideDetails._id });
        }
      } catch (err) {
        console.error("End trip error:", err);
      }
    }
    setRideDetails(null);
    clearCaptainPhase();
    setRidePhaseState("idle");
    toast.success("Trip completed! Great job.");
  };

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res?.success) {
      toast.success("Logged out");
      navigate("/login");
    } else toast.error(res?.message || "Logout failed");
  };

  const toggleOnline = async () => {
    const result = await toggleAvailability();
    if (result.success)
      toast.success(
        result.status === "active"
          ? "You're now online!"
          : "You're now offline",
      );
    else toast.error(result.message);
  };

  const handleNavClick = (label) => {
    setActiveNav(label);
    setSidebarOpen(false);
  };

  // 3. Adapter: Format MongoDB data to UI expectations
  const formatRideForUI = (dbRide) => {
    if (!dbRide) return MOCK_RIDE;
    const userName = dbRide.user?.fullName
      ? `${dbRide.user.fullName.firstName} ${dbRide.user.fullName.lastName}`
      : "Passenger";
    return {
      id: dbRide._id || "ride_pending",
      passenger: {
        name: userName,
        avatar: (
          (dbRide.user?.fullName?.firstName?.[0] ?? "?") +
          (dbRide.user?.fullName?.lastName?.[0] ?? "")
        ).toUpperCase(),
        rating: 4.8,
        totalRides: 12,
        phone: dbRide.user?.phone || "—",
        memberSince: "2024",
        preferredLanguage: "English",
      },
      pickup: { label: dbRide.pickup, coords: "GPS Location" },
      pickupStr: dbRide.pickup,
      drop: { label: dbRide.destination, coords: "GPS Location" },
      destination: dbRide.destination,
      fare: `₹${dbRide.fare}`,
      distance: dbRide.distance
        ? `${(dbRide.distance / 1000).toFixed(1)} km`
        : "—",
      duration: dbRide.duration
        ? `${Math.ceil(dbRide.duration / 60)} min`
        : "—",
      vehicleType: "car",
      surgeMultiplier: 1,
      paymentMode: "Cash",
      otp: dbRide.otp,
    };
  };

  const uiRide = formatRideForUI(rideDetails);

  if (ridePhase === "trip_active") {
    return <TripActivePage ride={uiRide} onEndTrip={handleEndTrip} />;
  }

  const renderMainContent = () => {
    switch (activeNav) {
      case "My Trips":
        return <MyTripsView />;
      case "Earnings":
        return <EarningsView />;
      case "Performance":
        return <PerformanceView />;
      case "Settings":
        return <SettingsView />;
      default:
        return (
          <DashboardHome
            captain={captain}
            firstName={firstName}
            ridePhase={ridePhase}
            setRidePhase={setRidePhase}
            setRideDetails={setRideDetails}
            uiRide={uiRide}
            onAccept={handleAcceptRide}
            onStartTrip={handleStartTrip}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease both; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#13161f] border-r border-white/6 flex flex-col py-6 px-4 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white tracking-tight leading-none">
              UBER Captain
            </p>
            <p className="text-[10px] text-slate-500">Driver Console</p>
          </div>
        </div>
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-3 mx-2 mb-6 px-3 py-2.5 rounded-xl border transition-all duration-300 ${isOnline ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}
        >
          <div
            className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isOnline ? "bg-emerald-500" : "bg-slate-700"}`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${isOnline ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
          <span
            className={`text-xs font-bold ${isOnline ? "text-emerald-400" : "text-slate-500"}`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </button>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeNav === item.label ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/6 pt-4 mt-4 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <CaptainAvatar size="w-8 h-8" fontSize="12px" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {firstName} {lastName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {captain?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── CONTENT ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/6 px-5 h-14 flex items-center gap-4">
          <button
            className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"
            onClick={() => setSidebarOpen((s) => !s)}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm font-bold text-white hidden sm:block">
              {activeNav}
            </span>
          </div>
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700/50 text-slate-400"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
            />
            {isOnline ? "ONLINE" : "OFFLINE"}
          </div>
          <button className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
            <Bell size={15} className="text-slate-400" />
          </button>
          <CaptainAvatar size="w-8 h-8" fontSize="12px" />
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

// ─── DASHBOARD HOME (default view) ───────────────────────────────────────────
function DashboardHome({
  captain,
  firstName,
  ridePhase,
  setRidePhase,
  setRideDetails,
  uiRide,
  onAccept,
  onStartTrip,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div
          className="fade-up relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#1a1d27] p-6"
          style={{ animationDelay: "0ms" }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Good morning ☀️
          </p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
            Ready to roll, {firstName}?
          </h1>
          <p className="text-sm text-slate-400 mb-5">
            You're on a streak — 11 trips today. Keep it up to unlock the Surge
            Chaser badge!
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Acceptance", value: "94%", icon: "✅" },
              { label: "Completion", value: "98%", icon: "🏁" },
              { label: "Cancellation", value: "2%", icon: "❌" },
            ].map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-2.5 bg-[#0f1117] border border-white/6 rounded-xl px-3 py-2"
              >
                <span className="text-base">{p.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white">{p.value}</p>
                  <p className="text-[10px] text-slate-500">{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up"
          style={{ animationDelay: "80ms" }}
        >
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>
        <div className="fade-up" style={{ animationDelay: "160ms" }}>
          <WeeklyEarningsChart />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col gap-5">
        <div className="fade-up" style={{ animationDelay: "60ms" }}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            Ride Request
          </h3>
          {ridePhase === "idle" && <IdleRidePanel />}
          {ridePhase === "incoming" && (
            <IncomingRideRequest
              ride={uiRide}
              onAccept={onAccept}
              onDecline={() => {
                setRidePhase("idle");
                setRideDetails(null);
              }}
            />
          )}
          {ridePhase === "accepted" && (
            <AcceptedRidePanel
              ride={uiRide}
              onBack={() => setRidePhase("incoming")}
              onStartTrip={onStartTrip}
            />
          )}
        </div>
        <div className="fade-up" style={{ animationDelay: "140ms" }}>
          <VehicleCard captain={captain} />
        </div>
        <div className="fade-up" style={{ animationDelay: "200ms" }}>
          <PerformanceBadges />
        </div>
        <div
          className="fade-up rounded-2xl overflow-hidden relative p-5 border border-emerald-500/20"
          style={{
            background: "linear-gradient(135deg,#064e3b 0%,#022c22 100%)",
            animationDelay: "260ms",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <TrendingUp size={15} className="text-emerald-300" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            Surge Zone Nearby 🔥
          </h4>
          <p className="text-xs text-emerald-200/70 mb-4">
            High demand in Connaught Place. Drive there to earn 1.8× surge
            pricing.
          </p>
          <button
            onClick={() => toast("Opening navigation to surge zone…")}
            className="w-full py-2 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200"
          >
            Navigate to Surge Zone
          </button>
        </div>
      </div>
    </div>
  );
}