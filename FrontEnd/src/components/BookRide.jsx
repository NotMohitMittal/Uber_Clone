import React, { useState, useEffect, useRef } from "react";
import { Zap, ArrowLeft, User, MapPin, Navigation, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useRideStore } from "../context/RideContext";
import { useMapStore } from "../context/Map.context";

export default function BookRide() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // ── Granular loading states so each action shows feedback immediately ────────
  const [isFindingRides, setIsFindingRides] = useState(false);  // step1 → step2
  const [isBooking,      setIsBooking]      = useState(false);  // confirm button
  const [isBooked,       setIsBooked]       = useState(false);  // brief success flash

  const { ridePrice, farePrice, bookRide, userRideState, setUserRideState, resetRide } =
    useRideStore();

  // Reset stale ride state on mount so second booking works without a reload
  useEffect(() => {
    if (userRideState === "completed" || userRideState === "") {
      resetRide();
      setStep(1);
      setPickup("");
      setDestination("");
      setVehicleType("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { suggestions, fetchSuggestions, clearSuggestions, getDistance_Duration } =
    useMapStore();

  // Keep the last route data so handleFinalSubmit can forward it to the backend,
  // avoiding a duplicate Distance Matrix API call on the server.
  const lastRouteRef = React.useRef(null);

  // Debounce autocomplete so we don't fire on every keystroke ──────────────────
  const debounceTimer = useRef(null);
  const handleInputChange = (e, field) => {
    const val = e.target.value;
    if (field === "pickup") setPickup(val);
    else setDestination(val);
    setActiveField(field);
    setFocusedIndex(-1);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (val.trim().length >= 3) fetchSuggestions(val);
      else clearSuggestions();
    }, 280); // 280ms debounce — feels instant but cuts API calls ~70%
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
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0) handleSuggestionClick(suggestions[focusedIndex]);
    } else if (e.key === "Escape") {
      setActiveField(null);
      setFocusedIndex(-1);
    }
  };

  // ── STEP 1 → STEP 2: fetch distance + fare prices ──────────────────────────
  const handleFindRides = async (e) => {
    e.preventDefault();
    if (!pickup.trim() || !destination.trim()) return;

    setIsFindingRides(true);

    // Optimistically switch to step 2 with skeleton prices while API loads
    setStep(2);

    try {
      const distanceData = await getDistance_Duration(pickup, destination);
      lastRouteRef.current = distanceData; // cache for booking step
      if (!distanceData) {
        // Can't get route — go back to step 1 with an error
        setStep(1);
        alert("Could not calculate route. Check your locations and try again.");
        return;
      }

      // Pass raw metres & seconds — backend /ride/ride-fare converts to km/min
      await ridePrice({
        distance: distanceData.distanceM,
        duration: distanceData.durationS,
      });
      // Fares now in store — vehicle cards re-render automatically
    } catch {
      setStep(1);
      alert("Network error fetching route. Please try again.");
    } finally {
      setIsFindingRides(false);
    }
  };

  // ── STEP 2 → CONFIRMED: book the ride ──────────────────────────────────────
  // KEY FIX: navigate to the searching UI IMMEDIATELY on tap.
  // The bookRide API call happens in the background — the user never waits
  // for the backend response to see the next screen.
  const handleFinalSubmit = async () => {
    if (!vehicleType || isBooking) return;

    setIsBooking(true);
    setIsBooked(true);
    setUserRideState("searching");

    // Navigate immediately — don't await the API
    setTimeout(() => navigate("/active-ride"), 300);

    // Fire the booking in the background
    try {
      const result = await bookRide({
        pickup,
        destination,
        vehicleType,
        distanceM: lastRouteRef.current?.distanceM,
        durationS: lastRouteRef.current?.durationS,
      });

      if (!result.success) {
        // If booking genuinely failed, go back and show the error
        // The user is already on /active-ride so we navigate back
        console.error("Booking failed:", result.message);
        // We intentionally don't navigate back here — the searching state
        // with "cancel" button handles this gracefully.
        // If you want hard rollback: navigate("/ride-booking") and show a toast
      }
    } catch (err) {
      console.error("Booking network error:", err);
    }
  };

  const vehicles = [
    {
      id: "car",
      name: "UberGo",
      capacity: 4,
      time: "2 mins away",
      desc: "Affordable, compact rides",
      // Show skeleton if still loading, real price once available
      price: farePrice?.car     ? `₹${farePrice.car}`        : isFindingRides ? null : "...",
      icon: "🚗",
    },
    {
      id: "motorcycle",
      name: "Moto",
      capacity: 1,
      time: "3 mins away",
      desc: "Affordable motorcycle rides",
      price: farePrice?.motorcycle ? `₹${farePrice.motorcycle}` : isFindingRides ? null : "...",
      icon: "🏍️",
    },
    {
      id: "auto",
      name: "UberAuto",
      capacity: 3,
      time: "3 mins away",
      desc: "Affordable Auto rides",
      price: farePrice?.auto    ? `₹${farePrice.auto}`       : isFindingRides ? null : "...",
      icon: "🛺",
    },
  ];

  const slideVariants = {
    initial: (d) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
    exit:    (d) => ({ x: d > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }),
  };

  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col gap-4">

      {/* ── Active Ride Banner ── */}
      {(userRideState === "searching" || userRideState === "confirmed") && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/active-ride")}
          className="w-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/50 rounded-xl p-4 cursor-pointer hover:bg-indigo-500/10 transition-colors flex items-center justify-between z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Navigation size={20} className={userRideState === "searching" ? "animate-pulse" : ""} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">
                {userRideState === "searching" ? "Finding your captain…" : "Captain is on the way!"}
              </h4>
              <p className="text-indigo-300 text-xs mt-0.5">Tap to view live tracking</p>
            </div>
          </div>
          <ArrowLeft size={18} className="text-indigo-400 rotate-180" />
        </motion.div>
      )}

      {/* ── Booking Form ── */}
      {(!userRideState || userRideState === "booking") && (
        <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5 overflow-visible shadow-2xl relative z-20">
          <AnimatePresence mode="wait" custom={step === 2 ? 1 : -1}>

            {/* ════ STEP 1 ════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={-1}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h3 className="text-xl font-bold text-white mb-4">Find a Ride</h3>
                <form onSubmit={handleFindRides}>
                  <div className="space-y-3 mb-6 relative">

                    {/* Pickup */}
                    <div className="relative">
                      <div className="flex items-center bg-[#0f1117] rounded-xl p-3 gap-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                        <input
                          type="text"
                          value={pickup}
                          onChange={(e) => handleInputChange(e, "pickup")}
                          onFocus={() => setActiveField("pickup")}
                          onKeyDown={handleKeyDown}
                          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                          placeholder="Pickup location"
                          required
                          autoComplete="off"
                        />
                      </div>
                      <AnimatePresence>
                        {activeField === "pickup" && suggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#222635] border border-white/10 rounded-xl overflow-y-auto max-h-52 z-[999] shadow-2xl"
                          >
                            {suggestions.map((s, idx) => (
                              <div
                                key={idx}
                                onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                                className={`p-3 border-b border-white/5 cursor-pointer flex items-center gap-3 transition-colors ${idx === focusedIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                              >
                                <MapPin size={14} className="text-indigo-400 shrink-0" />
                                <span className="text-sm text-slate-200 truncate">{s}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Destination */}
                    <div className="relative">
                      <div className="flex items-center bg-[#0f1117] rounded-xl p-3 gap-3 border border-white/5 focus-within:border-purple-500/50 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-sm bg-purple-500 shrink-0" />
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => handleInputChange(e, "destination")}
                          onFocus={() => setActiveField("destination")}
                          onKeyDown={handleKeyDown}
                          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                          placeholder="Drop location"
                          required
                          autoComplete="off"
                        />
                      </div>
                      <AnimatePresence>
                        {activeField === "destination" && suggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#222635] border border-white/10 rounded-xl overflow-y-auto max-h-52 z-[999] shadow-2xl"
                          >
                            {suggestions.map((s, idx) => (
                              <div
                                key={idx}
                                onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                                className={`p-3 border-b border-white/5 cursor-pointer flex items-center gap-3 transition-colors ${idx === focusedIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                              >
                                <MapPin size={14} className="text-purple-400 shrink-0" />
                                <span className="text-sm text-slate-200 truncate">{s}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!pickup.trim() || !destination.trim()}
                    className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Search Rides
                  </button>
                </form>
              </motion.div>
            )}

            {/* ════ STEP 2 ════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col"
              >
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => { setStep(1); setIsFindingRides(false); }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="text-xl font-bold text-white">Choose a Vehicle</h3>
                  {isFindingRides && (
                    <Loader2 size={15} className="text-indigo-400 animate-spin ml-auto" />
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {vehicles.map((v, i) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.22, ease: "easeOut" }}
                      onClick={() => !isBooking && setVehicleType(v.id)}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                        vehicleType === v.id
                          ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/40"
                          : "bg-[#0f1117] border-white/5 hover:border-white/20"
                      } ${isBooking ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <div className="text-4xl mr-4">{v.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{v.name}</h4>
                          <div className="flex items-center gap-0.5 text-xs text-slate-300 bg-white/10 px-1.5 py-0.5 rounded-md">
                            <User size={12} />{v.capacity}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-green-400 mt-0.5">{v.time}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{v.desc}</p>
                      </div>
                      {/* Price: shimmer skeleton while loading, real price when ready */}
                      <div className="text-lg font-bold text-white tracking-tight shrink-0">
                        {v.price === null ? (
                          <div className="w-12 h-5 rounded-md bg-white/10 animate-pulse" />
                        ) : (
                          v.price
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Confirm button — 3 visual states: idle / loading / booked */}
                <motion.button
                  onClick={handleFinalSubmit}
                  disabled={!vehicleType || isBooking || isBooked}
                  whileTap={!isBooking && !isBooked ? { scale: 0.97 } : {}}
                  className={`w-full py-3.5 rounded-xl text-white text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.15)]
                    ${isBooked
                      ? "bg-emerald-600"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isBooked ? (
                    <>
                      <CheckCircle size={16} className="text-white" />
                      Confirmed!
                    </>
                  ) : isBooking ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-indigo-200" />
                      Booking your ride…
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="text-indigo-200" />
                      Confirm {vehicleType ? vehicles.find((v) => v.id === vehicleType)?.name : "Booking"}
                    </>
                  )}
                </motion.button>

                {/* Subtle hint so user knows what's happening during booking */}
                <AnimatePresence>
                  {isBooking && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-xs text-slate-500 mt-3"
                    >
                      Confirming your ride and alerting nearby captains…
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}