import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Phone, MessageSquare, Shield, Star, X, Navigation, ArrowLeft,
  Clock, Route,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRideStore } from "../context/RideContext";
import { useSocketStore } from "../context/SocketContext";
import LiveTracking from "../components/LiveTracking";

// ── Haversine distance (km) between two {lat,lng} points ─────────────────────
const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
};

// ── Format distance nicely ────────────────────────────────────────────────────
const fmtDistance = (km) => {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

// ── Format ETA nicely (assume 30 km/h average in city) ───────────────────────
const fmtEta = (km) => {
  if (km == null) return null;
  const mins = Math.round((km / 30) * 60);
  if (mins < 1) return "< 1 min";
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins} min`;
};

export default function ActiveRide() {
  const navigate = useNavigate();
  const { userRideState, setUserRideState, rideDetails, captainLocation, setCaptainLocation } =
    useRideStore();
  const { socket } = useSocketStore();

  // User's current GPS position (for distance-to-captain calculation)
  const [userPosition, setUserPosition] = useState(null);

  // Computed ETA/distance based on captain ↔ user positions
  const [etaKm, setEtaKm] = useState(null);

  // ── Redirect if no active ride ────────────────────────────────────────────
  useEffect(() => {
    if (!userRideState) navigate("/");
  }, [userRideState, navigate]);

  // ── Acquire user's GPS ────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── Listen for captain location updates via socket ────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      if (data?.location?.coordinates) {
        const [lng, lat] = data.location.coordinates; // GeoJSON: [lng, lat]
        setCaptainLocation({ lat, lng });              // persist in global store
      }
    };

    socket.on("captain_location_update", handleLocationUpdate);
    return () => socket.off("captain_location_update", handleLocationUpdate);
  }, [socket, setCaptainLocation]);

  // ── Recompute ETA whenever captain or user moves ──────────────────────────
  useEffect(() => {
    const km = haversineKm(captainLocation, userPosition);
    setEtaKm(km);
  }, [captainLocation, userPosition]);

  if (!userRideState) return null;

  const handleCancel = () => {
    setUserRideState("");
    navigate("/");
  };

  // Use real captain info from rideDetails if available, else fallback
  const captain = rideDetails?.captain;
  const captainName = captain
    ? `${captain.fullName?.firstName ?? ""} ${captain.fullName?.lastName ?? ""}`.trim()
    : "Rahul Sharma";
  const vehicleLabel = captain?.vehicle?.vehicleType
    ? `${captain.vehicle.vehicleType.charAt(0).toUpperCase()}${captain.vehicle.vehicleType.slice(1)}`
    : "Toyota Etios";
  const plate       = captain?.vehicle?.plate ?? "MH 12 AB 1234";
  const captainInitials = captain
    ? `${captain.fullName?.firstName?.[0] ?? ""}${captain.fullName?.lastName?.[0] ?? ""}`.toUpperCase()
    : "👨🏽‍✈️";
  const rideOtp     = rideDetails?.otp ?? "—";

  // ETA display strings
  const etaText      = fmtEta(etaKm);
  const distanceText = fmtDistance(etaKm);

  return (
    <div className="bg-[#0f1117] min-h-screen w-full relative flex flex-col font-sans">
      {/* Back button */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate("/")}
          className="p-2.5 bg-[#1a1d27]/80 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors shadow-lg"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* ═══════════════════════ SEARCHING ═══════════════════════ */}
      {userRideState === "searching" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="relative flex items-center justify-center mb-12 mt-12">
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-24 h-24 bg-purple-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.8, 0] }}
              transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-24 h-24 bg-indigo-500 rounded-full"
            />
            <div className="relative w-20 h-20 bg-linear-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <Navigation size={32} className="text-white drop-shadow-md" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Finding your ride</h2>
          <p className="text-slate-400 text-sm mb-8 text-center px-4">
            Matching you with the nearest captain…
          </p>

          {/* Show ride summary while searching */}
          {rideDetails && (
            <div className="w-full max-w-md bg-[#1a1d27] border border-white/10 rounded-2xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Fare</span>
                <span className="text-white font-bold">₹{rideDetails.fare}</span>
              </div>
              <div className="text-xs text-slate-500 truncate">
                {rideDetails.pickup} → {rideDetails.destination}
              </div>
            </div>
          )}

          <button
            onClick={handleCancel}
            className="mt-auto w-full max-w-md mx-auto py-3.5 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* ═══════════════════════ CONFIRMED ═══════════════════════ */}
      {userRideState === "confirmed" && (
        <div className="flex flex-col h-screen">
          {/* Live Map */}
          <div className="flex-1 relative bg-[#1a1d27]">
            <LiveTracking
              mode="user_tracking"
              captainLocation={captainLocation}
              height="100%"
              showControls={true}
            />

            {/* ETA Overlay — now shows REAL computed values */}
            <div className="absolute top-20 left-4 right-4 bg-[#0f1117]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg max-w-md mx-auto z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg">
                    {etaText ? `Arriving in ${etaText}` : "Captain is on the way"}
                  </span>
                  <div className="flex items-center gap-3 mt-0.5">
                    {distanceText && (
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Route size={11} className="text-indigo-400" />
                        {distanceText} away
                      </span>
                    )}
                    {!captainLocation && (
                      <span className="text-slate-500 text-xs animate-pulse">
                        Waiting for captain location…
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-purple-500/20 text-purple-400 p-2 rounded-full">
                  <MapPin size={20} />
                </div>
              </div>

              {/* Live distance / ETA chips */}
              {etaKm != null && (
                <div className="flex gap-2 mt-2.5">
                  <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                    <Clock size={12} className="text-amber-400" />
                    <span className="text-xs text-white font-semibold">{etaText}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                    <Navigation size={12} className="text-indigo-400" />
                    <span className="text-xs text-white font-semibold">{distanceText}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Drawer */}
          <div className="bg-[#1a1d27] border-t border-white/10 rounded-t-3xl p-5 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-700 rounded-full border-2 border-indigo-500 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                      {typeof captainInitials === "string" && captainInitials.length <= 2
                        ? captainInitials
                        : "👨🏽‍✈️"}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">{captainName}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-400 mt-0.5">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span>4.8</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white text-black px-2.5 py-1 rounded-md font-bold text-sm mb-1 tracking-wider">
                    {plate}
                  </div>
                  <div className="text-xs text-slate-400">{vehicleLabel}</div>
                </div>
              </div>

              {/* OTP */}
              <div className="flex items-center justify-between bg-linear-to-r from-[#0f1117] to-[#161925] border border-white/5 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3">
                  <Shield size={24} className="text-green-400" />
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-0.5">Secure PIN</span>
                    <span className="text-white text-sm">Provide this to the captain</span>
                  </div>
                </div>
                <div className="bg-[#222635] px-4 py-2 rounded-lg text-white font-mono text-2xl font-bold tracking-widest select-all">
                  {rideOtp}
                </div>
              </div>

              {/* Fare */}
              <div className="flex items-center justify-between text-sm mb-4 px-1">
                <span className="text-slate-400">Trip fare</span>
                <span className="text-white font-bold">₹{rideDetails?.fare ?? "—"}</span>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-white text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200">
                  <Phone size={18} />Call
                </button>
                <button className="flex-1 bg-[#222635] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-white/5">
                  <MessageSquare size={18} />Message
                </button>
                <button
                  onClick={handleCancel}
                  className="w-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ ACTIVE TRIP ═══════════════════════ */}
      {userRideState === "active" && (
        <div className="flex flex-col h-screen">
          <div className="flex-1 relative bg-[#1a1d27]">
            <LiveTracking
              mode="user_tracking"
              captainLocation={captainLocation}
              height="100%"
              showControls={true}
            />
            <div className="absolute top-20 left-4 right-4 bg-emerald-900/80 backdrop-blur-md border border-emerald-500/30 rounded-xl p-3 shadow-lg max-w-md mx-auto z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold text-sm">Trip in progress</span>
                {distanceText && (
                  <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
                    <Route size={11} /> {distanceText}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d27] border-t border-white/10 p-5 z-20">
            <div className="max-w-md mx-auto text-center text-sm text-slate-400">
              Your ride is in progress — sit back and relax.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}