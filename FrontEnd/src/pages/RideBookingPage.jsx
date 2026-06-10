import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  User,
  ChevronDown,
  Bell,
  ArrowLeft,
  Zap,
  Car,
  Star,
  Shield,
  Phone,
  MessageSquare,
  CheckCircle,
  Route,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useRideStore } from "../context/RideContext";
import { useMapStore } from "../context/Map.context";
import { useAuthStore } from "../context/UserContext";
import { useSocketStore } from "../context/SocketContext";
import LiveTracking from "../components/LiveTracking";

// ── Vehicle data ──────────────────────────────────────────────────────────────
function useVehicles(farePrice) {
  return [
    {
      id: "car",
      name: "UberGo",
      capacity: 4,
      time: "2 min",
      desc: "Affordable, compact rides",
      price: farePrice?.car ? `₹${farePrice.car}` : "—",
      icon: "🚗",
      badge: "Most Popular",
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: "motorcycle",
      name: "Moto",
      capacity: 1,
      time: "3 min",
      desc: "Beat traffic, ride solo",
      price: farePrice?.motorcycle ? `₹${farePrice.motorcycle}` : "—",
      icon: "🏍️",
      badge: "Fastest",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "auto",
      name: "UberAuto",
      capacity: 3,
      time: "3 min",
      desc: "Everyday auto rides",
      price: farePrice?.auto ? `₹${farePrice.auto}` : "—",
      icon: "🛺",
      badge: "Budget",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];
}

// ── Haversine ETA helper ──────────────────────────────────────────────────────
const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sL = Math.sin(dLat / 2);
  const sN = Math.sin(dLng / 2);
  const c =
    sL * sL +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sN *
      sN;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
};
const fmtEta = (km) => {
  if (km == null) return null;
  const mins = Math.round((km / 30) * 60);
  if (mins < 1) return "< 1 min";
  return `${mins} min`;
};
const fmtDist = (km) => {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

// ── Motion variants ───────────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -16, transition: { duration: 0.2, ease: "easeIn" } },
};
const slideIn = {
  initial: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (d) => ({
    x: d > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

// ── Live Tracker Panel (shown after captain accepts) ──────────────────────────
function RideTrackerPanel({ rideDetails, captainLocation, userRideState }) {
  const [userPosition, setUserPosition] = useState(null);
  const [etaKm, setEtaKm] = useState(null);

  const { socket } = useSocketStore();
  const { setCaptainLocation } = useRideStore();

  // Is the trip currently active? (Captain clicked "Start Trip")
  const isActive = userRideState === "active";

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) =>
        setUserPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => console.warn("GPS:", e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data?.location?.coordinates) {
        const [lng, lat] = data.location.coordinates;
        setCaptainLocation({ lat, lng });
      }
    };
    socket.on("captain_location_update", handler);
    return () => socket.off("captain_location_update", handler);
  }, [socket, setCaptainLocation]);

  useEffect(() => {
    setEtaKm(haversineKm(captainLocation, userPosition));
  }, [captainLocation, userPosition]);

  const captain = rideDetails?.captain;
  const captainName = captain
    ? `${captain.fullName?.firstName ?? ""} ${captain.fullName?.lastName ?? ""}`.trim()
    : "Your Captain";
  const plate = captain?.vehicle?.plate ?? "—";
  const vehicleType = captain?.vehicle?.vehicleType ?? "";
  const initials = captain
    ? `${captain.fullName?.firstName?.[0] ?? ""}${captain.fullName?.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  const rideOtp = rideDetails?.otp ?? "—";

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-5"
    >
      {/* Dynamic Status banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Navigation size={18} className="text-emerald-400 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B0F19]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">
            {isActive ? "Trip in progress!" : "Captain is on the way!"}
          </p>
          <p className="text-xs text-emerald-300 mt-0.5">
            Fare: ₹{rideDetails?.fare} ·{" "}
            {isActive ? rideDetails?.destination : rideDetails?.pickup}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      </div>

      {etaKm != null && !isActive && (
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-[#131826] border border-white/8 rounded-xl px-3 py-2">
            <Clock size={13} className="text-amber-400" />
            <span className="text-sm font-bold text-white">
              {fmtEta(etaKm)}
            </span>
            <span className="text-xs text-slate-500">ETA</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#131826] border border-white/8 rounded-xl px-3 py-2">
            <Route size={13} className="text-indigo-400" />
            <span className="text-sm font-bold text-white">
              {fmtDist(etaKm)}
            </span>
            <span className="text-xs text-slate-500">away</span>
          </div>
        </div>
      )}

      {/* FIXED: Dynamic height expands heavily when active, and allows fullscreen toggle! */}
      <div
        className={`rounded-2xl overflow-hidden border border-white/[0.07] relative transition-all duration-300 ${isActive ? "h-[420px]" : "h-[260px]"}`}
      >
        <LiveTracking
          mode="user_tracking"
          captainLocation={captainLocation}
          height="100%"
          showControls={true}
          allowFullscreen={true}
        />
      </div>

      <div className="bg-[#131826] border border-white/8 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{captainName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Star size={10} className="fill-amber-400" />
              4.9
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 truncate">
              {plate}
              {vehicleType ? ` · ${vehicleType}` : ""}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/20 transition-colors">
            <Phone size={14} className="text-indigo-400" />
          </button>
          <button className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center hover:bg-purple-500/20 transition-colors">
            <MessageSquare size={14} className="text-purple-400" />
          </button>
        </div>
      </div>

      {/* FIXED: Only show OTP if the ride hasn't started yet! */}
      {!isActive && (
        <div className="flex items-center justify-between bg-[#131826] border border-white/8 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-green-400" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                Secure PIN
              </p>
              <p className="text-sm text-white">Share with captain to start</p>
            </div>
          </div>
          <div className="bg-[#0B0F19] px-4 py-2 rounded-xl text-white font-mono text-2xl font-bold tracking-widest select-all">
            {rideOtp}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-white/5 rounded-xl">
        <Shield size={13} className="text-emerald-400 shrink-0" />
        <p className="text-xs text-slate-400">
          Trip insured up to ₹50L. Share your location for safety.
        </p>
      </div>
    </motion.div>
  );
}

// ── Searching panel ───────────────────────────────────────────────────────────
function SearchingPanel({ rideDetails }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center gap-6 py-8 text-center"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-indigo-500/30 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-400/60 flex items-center justify-center animate-spin"
            style={{ animationDuration: "3s" }}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Car size={16} className="text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="absolute -inset-2 rounded-full border border-indigo-500/10 animate-ping" />
      </div>
      <div>
        <p className="text-lg font-bold text-white mb-1">
          Finding captains{"...".slice(0, dots + 1)}
        </p>
        <p className="text-sm text-slate-400">
          {rideDetails?.pickup} → {rideDetails?.destination}
        </p>
      </div>
      <div className="w-full bg-[#131826] border border-white/8 rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Fare</span>
          <span className="text-white font-bold">₹{rideDetails?.fare}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>OTP</span>
          <span className="text-indigo-400 font-bold font-mono tracking-widest">
            {rideDetails?.otp ?? "—"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RideBookingPage() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [rideType, setRideType] = useState("local");

  const {
    ridePrice,
    farePrice,
    bookRide,
    userRideState,
    setUserRideState,
    rideDetails,
    captainLocation,
    resetRide,
  } = useRideStore();

  const {
    suggestions,
    fetchSuggestions,
    clearSuggestions,
    getDistance_Duration,
  } = useMapStore();
  const vehicles = useVehicles(farePrice);
  const firstName = authUser?.fullName?.firstName ?? authUser?.firstName ?? "";

  // Reset stale state on mount
  useEffect(() => {
    if (!userRideState || userRideState === "completed") {
      resetRide();
      setStep(1);
      setPickup("");
      setDestination("");
      setVehicleType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = async (e, field) => {
    const val = e.target.value;
    if (field === "pickup") setPickup(val);
    else setDestination(val);
    setActiveField(field);
    setFocusedIndex(-1);
    await fetchSuggestions(val);
  };

  const handleSuggestionClick = (suggestion) => {
    if (activeField === "pickup") setPickup(suggestion);
    else setDestination(suggestion);
    setActiveField(null);
    setFocusedIndex(-1);
    clearSuggestions();
  };

  const handleKeyDown = (e) => {
    if (!activeField || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[focusedIndex]);
    } else if (e.key === "Escape") {
      setActiveField(null);
      setFocusedIndex(-1);
    }
  };

  const handleFindRides = async (e) => {
    e.preventDefault();
    if (!pickup.trim() || !destination.trim()) return;

    // BUG FIX: use returned values directly — don't read from store (stale closure)
    const distanceData = await getDistance_Duration(pickup, destination);
    if (!distanceData) {
      alert("Could not calculate route. Please try again.");
      return;
    }

    // Pass raw metres & seconds to ridePrice — backend converts to km/min
    const result = await ridePrice({
      distance: distanceData.distanceM,
      duration: distanceData.durationS,
    });
    if (result?.success) setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!vehicleType) return;
    const result = await bookRide({ pickup, destination, vehicleType });
    if (result.success) {
      setUserRideState("searching");
    }
  };

  const isSearching = userRideState === "searching";
  const isConfirmed =
    userRideState === "confirmed" || userRideState === "active";
  const isCompleted = userRideState === "completed";
  const showForm = !isSearching && !isConfirmed && !isCompleted;

  return (
    <div
      className="min-h-screen bg-[#0B0F19] text-white"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #6366f120; border-radius: 999px; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/[0.06] px-5 h-14 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 transition-all duration-200 shrink-0"
        >
          <ArrowLeft size={16} className="text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            UBER
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            Beta
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/6 transition-colors">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
            {authUser?.fullName?.firstName?.[0] ?? "?"}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {isCompleted && (
            <motion.div
              key="completed"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center gap-4 py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white mb-1">
                  Trip Completed!
                </h2>
                <p className="text-sm text-slate-400">
                  Hope you enjoyed the ride.
                </p>
              </div>
              <button
                onClick={() => {
                  resetRide();
                  setStep(1);
                  setPickup("");
                  setDestination("");
                  setVehicleType("");
                }}
                className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Book Another Ride
              </button>
            </motion.div>
          )}

          {isSearching && (
            <motion.div
              key="searching"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <SearchingPanel rideDetails={rideDetails} />
            </motion.div>
          )}

          {isConfirmed && (
            <motion.div
              key="confirmed"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <RideTrackerPanel
                rideDetails={rideDetails}
                captainLocation={captainLocation}
                userRideState={userRideState}
              />
            </motion.div>
          )}

          {showForm && (
            <motion.div
              key="form"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-0.5">
                  Good day ✨
                </p>
                <h1 className="text-2xl font-extrabold text-white">
                  {firstName ? `Hey ${firstName}` : "Book a ride"}, where to?
                </h1>
              </div>

              {/* Ride type toggle */}
              <div className="flex p-1 bg-[#131826] border border-white/[0.06] rounded-2xl mb-5">
                {["local", "intercity"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setRideType(t)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all duration-200 ${
                      rideType === t
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait" custom={step === 2 ? 1 : -1}>
                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div
                    key="s1"
                    custom={-1}
                    variants={slideIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <div className="bg-[#131826] border border-white/[0.06] rounded-2xl p-4 mb-4 relative">
                      <div className="absolute left-[2.05rem] top-12 bottom-12 w-px bg-gradient-to-b from-indigo-500/40 to-purple-500/40" />

                      {/* Pickup */}
                      <div className="relative mb-3">
                        <div
                          className={`flex items-center bg-[#0B0F19] rounded-xl px-3 py-3 gap-3 border transition-colors ${activeField === "pickup" ? "border-indigo-500/50" : "border-white/5"}`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          <input
                            type="text"
                            value={pickup}
                            onChange={(e) => handleInputChange(e, "pickup")}
                            onFocus={() => setActiveField("pickup")}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                            placeholder="Pickup location"
                            autoComplete="off"
                          />
                          <Navigation
                            size={14}
                            className="text-slate-600 shrink-0"
                          />
                        </div>
                        <AnimatePresence>
                          {activeField === "pickup" &&
                            suggestions.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a1d27] border border-white/8 rounded-xl overflow-y-auto max-h-52 z-50 shadow-2xl"
                              >
                                {suggestions.map((s, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => handleSuggestionClick(s)}
                                    className={`flex items-center gap-3 px-3 py-2.5 border-b border-white/4 last:border-0 cursor-pointer transition-colors ${idx === focusedIndex ? "bg-indigo-500/10" : "hover:bg-white/4"}`}
                                  >
                                    <MapPin
                                      size={13}
                                      className="text-indigo-400 shrink-0"
                                    />
                                    <span className="text-xs text-slate-200 truncate">
                                      {s}
                                    </span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </div>

                      {/* Destination */}
                      <div className="relative">
                        <div
                          className={`flex items-center bg-[#0B0F19] rounded-xl px-3 py-3 gap-3 border transition-colors ${activeField === "destination" ? "border-purple-500/50" : "border-white/5"}`}
                        >
                          <div className="w-2.5 h-2.5 rounded-sm bg-purple-500 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                          <input
                            type="text"
                            value={destination}
                            onChange={(e) =>
                              handleInputChange(e, "destination")
                            }
                            onFocus={() => setActiveField("destination")}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                            placeholder="Drop location"
                            autoComplete="off"
                          />
                          <MapPin
                            size={14}
                            className="text-slate-600 shrink-0"
                          />
                        </div>
                        <AnimatePresence>
                          {activeField === "destination" &&
                            suggestions.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a1d27] border border-white/8 rounded-xl overflow-y-auto max-h-52 z-50 shadow-2xl"
                              >
                                {suggestions.map((s, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => handleSuggestionClick(s)}
                                    className={`flex items-center gap-3 px-3 py-2.5 border-b border-white/4 last:border-0 cursor-pointer transition-colors ${idx === focusedIndex ? "bg-purple-500/10" : "hover:bg-white/4"}`}
                                  >
                                    <MapPin
                                      size={13}
                                      className="text-purple-400 shrink-0"
                                    />
                                    <span className="text-xs text-slate-200 truncate">
                                      {s}
                                    </span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-5">
                      {[
                        { icon: Clock, label: "Pick up now" },
                        { icon: User, label: "For me" },
                      ].map(({ icon: Icon, label }) => (
                        <button
                          key={label}
                          type="button"
                          className="flex-1 flex items-center justify-between bg-[#131826] border border-white/[0.06] rounded-xl px-3 py-2.5 hover:border-white/10 hover:bg-white/3 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                            <Icon size={13} className="text-slate-500" />
                            {label}
                          </div>
                          <ChevronDown size={12} className="text-slate-600" />
                        </button>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFindRides}
                      disabled={!pickup.trim() || !destination.trim()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_28px_rgba(99,102,241,0.35)] transition-shadow"
                    >
                      Search Rides →
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div
                    key="s2"
                    custom={1}
                    variants={slideIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        onClick={() => setStep(1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <ArrowLeft size={15} className="text-slate-300" />
                      </button>
                      <h3 className="text-lg font-bold text-white">
                        Choose your ride
                      </h3>
                    </div>

                    <div className="flex flex-col gap-3 mb-5">
                      {vehicles.map((v, i) => (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: i * 0.07,
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          onClick={() => setVehicleType(v.id)}
                          className={`flex items-center gap-4 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                            vehicleType === v.id
                              ? "bg-indigo-500/8 border-indigo-500/60 shadow-[0_0_0_2px_rgba(99,102,241,0.15)]"
                              : "bg-[#131826] border-white/[0.06] hover:border-white/15 hover:bg-white/2"
                          }`}
                        >
                          <div className="text-3xl shrink-0">{v.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">
                                {v.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${v.badgeColor}`}
                              >
                                {v.badge}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-400 font-medium mt-0.5">
                              {v.time} away
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {v.desc}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-base font-extrabold text-white">
                              {v.price}
                            </p>
                            <div className="flex items-center gap-0.5 justify-end mt-0.5">
                              <User size={9} className="text-slate-500" />
                              <span className="text-[10px] text-slate-500">
                                {v.capacity}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFinalSubmit}
                      disabled={!vehicleType}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(99,102,241,0.25)] hover:shadow-[0_0_32px_rgba(99,102,241,0.4)] transition-shadow flex items-center justify-center gap-2"
                    >
                      <Zap size={15} className="text-indigo-200" />
                      Confirm{" "}
                      {vehicleType
                        ? vehicles.find((v) => v.id === vehicleType)?.name
                        : "Booking"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
