import React, { useState, useEffect } from "react";
import { Zap, ArrowLeft, User, MapPin, Navigation } from "lucide-react";
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

  const { ridePrice, farePrice, bookRide, userRideState, setUserRideState, resetRide } =
    useRideStore();

  // Reset stale ride state on mount
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

  const vehicles = [
    {
      id: "car",
      name: "UberGo",
      capacity: 4,
      time: "2 mins away",
      desc: "Affordable, compact rides",
      price: farePrice?.car ? `₹${farePrice.car}` : "...",
      icon: "🚗",
    },
    {
      id: "motorcycle",
      name: "Moto",
      capacity: 1,
      time: "3 mins away",
      desc: "Affordable motorcycle rides",
      price: farePrice?.motorcycle ? `₹${farePrice.motorcycle}` : "...",
      icon: "🏍️",
    },
    {
      id: "auto",
      name: "UberAuto",
      capacity: 3,
      time: "3 mins away",
      desc: "Affordable Auto rides",
      price: farePrice?.auto ? `₹${farePrice.auto}` : "...",
      icon: "🛺",
    },
  ];

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
      setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0) handleSuggestionClick(suggestions[focusedIndex]);
    } else if (e.key === "Escape") {
      setActiveField(null);
      setFocusedIndex(-1);
    }
  };

  const handleFindRides = async (e) => {
    e.preventDefault();
    if (!pickup.trim() || !destination.trim()) {
      alert("Please enter both pickup and destination locations.");
      return;
    }

    // BUG FIX: getDistance_Duration now RETURNS the values directly instead
    // of relying on the store state (which would still be stale at this point
    // due to React's async state batching).
    const distanceData = await getDistance_Duration(pickup, destination);

    if (!distanceData) {
      alert("Could not calculate route. Please try again.");
      return;
    }

    // Pass raw metres & seconds — the backend /ride/ride-fare converts to km/min
    const result = await ridePrice({
      distance: distanceData.distanceM,
      duration: distanceData.durationS,
    });

    if (result && result.success) {
      setStep(2);
    } else {
      alert(result?.message || "Failed to load rides. Please try again.");
    }
  };

  const handleFinalSubmit = async () => {
    if (!vehicleType) return alert("Please select a vehicle type.");
    const ridePayload = { pickup, destination, vehicleType };
    try {
      const result = await bookRide(ridePayload);
      if (result.success) {
        setUserRideState("searching");
        navigate("/active-ride");
      } else {
        alert(result.message || "Failed to book ride.");
      }
    } catch {
      alert("A network error occurred.");
    }
  };

  const slideVariants = {
    initial: (d) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: (d) => ({ x: d > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }),
  };

  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col gap-4">
      {/* Active Ride Banner */}
      {(userRideState === "searching" || userRideState === "confirmed") && (
        <div
          onClick={() => navigate("/active-ride")}
          className="w-full bg-linear-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/50 rounded-xl p-4 cursor-pointer hover:bg-indigo-500/10 transition-colors flex items-center justify-between z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Navigation size={20} className={userRideState === "searching" ? "animate-pulse" : ""} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">
                {userRideState === "searching" ? "Finding your captain..." : "Captain is on the way!"}
              </h4>
              <p className="text-indigo-300 text-xs mt-0.5">Tap to view live tracking</p>
            </div>
          </div>
          <ArrowLeft size={18} className="text-indigo-400 rotate-180" />
        </div>
      )}

      {/* Booking Form */}
      {(!userRideState || userRideState === "booking") && (
        <div className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl p-5 overflow-visible shadow-2xl relative z-20">
          <AnimatePresence mode="wait" custom={step === 2 ? 1 : -1}>
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" custom={-1} variants={slideVariants} initial="initial" animate="animate" exit="exit">
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
                      {activeField === "pickup" && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#222635] border border-white/10 rounded-xl overflow-y-auto max-h-52 z-[999] shadow-2xl">
                          {suggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className={`p-3 border-b border-white/5 cursor-pointer flex items-center gap-3 transition-colors ${idx === focusedIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                            >
                              <MapPin size={16} className="text-indigo-400 shrink-0" />
                              <span className="text-sm text-slate-200 truncate">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
                      {activeField === "destination" && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#222635] border border-white/10 rounded-xl overflow-y-auto max-h-52 z-[999] shadow-2xl">
                          {suggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className={`p-3 border-b border-white/5 cursor-pointer flex items-center gap-3 transition-colors ${idx === focusedIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                            >
                              <MapPin size={16} className="text-purple-400 shrink-0" />
                              <span className="text-sm text-slate-200 truncate">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 active:scale-[0.98] transition-all duration-200"
                  >
                    Search Rides
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" custom={1} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setStep(1)} className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="text-xl font-bold text-white">Choose a Vehicle</h3>
                </div>

                <div className="space-y-3 mb-6">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setVehicleType(v.id)}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        vehicleType === v.id
                          ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/40"
                          : "bg-[#0f1117] border-white/5 hover:border-white/20"
                      }`}
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
                      <div className="text-lg font-bold text-white tracking-tight">{v.price}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleFinalSubmit}
                  disabled={!vehicleType}
                  className="w-full py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                >
                  <Zap size={16} className="text-indigo-200" />
                  Confirm {vehicleType ? vehicles.find((v) => v.id === vehicleType)?.name : "Booking"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}