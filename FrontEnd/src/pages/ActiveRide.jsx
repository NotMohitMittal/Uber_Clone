import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Phone, MessageSquare, Shield, Star, X, Navigation, ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRideStore } from "../context/RideContext";
import { useSocketStore } from "../context/SocketContext";
import LiveTracking from "../components/LiveTracking"; // <-- Import your new map component!

export default function ActiveRide() {
  const navigate = useNavigate();
  const { userRideState, setUserRideState } = useRideStore();
  
  // 1. Pull the socket to listen for captain movements
  const { socket } = useSocketStore();
  const [captainLocation, setCaptainLocation] = useState(null);

  useEffect(() => {
    if (!userRideState) {
      navigate("/");
    }
  }, [userRideState, navigate]);

  // 2. Listen for high-frequency GPS pings from the Captain!
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      // Safely parse the GeoJSON data emitted by the captain's LiveTracking component
      if (data?.location?.coordinates) {
        setCaptainLocation({
          lat: data.location.coordinates[1], // Latitude is second in GeoJSON
          lng: data.location.coordinates[0], // Longitude is first
        });
      }
    };

    socket.on("captain_location_update", handleLocationUpdate);
    return () => socket.off("captain_location_update", handleLocationUpdate);
  }, [socket]);

  if (!userRideState) return null;

  const handleCancel = () => {
    setUserRideState("");
    navigate("/");
  };

  const driverDetails = {
    name: "Rahul Sharma",
    rating: "4.8",
    vehicle: "Toyota Etios",
    plate: "MH 12 AB 1234",
    otp: "8492",
    eta: "3 min",
  };

  return (
    <div className="bg-[#0f1117] min-h-screen w-full relative flex flex-col font-sans">
      {/* GLOBAL BACK BUTTON */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate("/")}
          className="p-2.5 bg-[#1a1d27]/80 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-white/10 transition-colors shadow-lg"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* ================= STATE 1: SEARCHING ================= */}
      {userRideState === "searching" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="relative flex items-center justify-center mb-12 mt-12">
            <motion.div animate={{ scale: [1, 2.5], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} className="absolute w-24 h-24 bg-purple-500 rounded-full" />
            <motion.div animate={{ scale: [1, 2], opacity: [0.8, 0] }} transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }} className="absolute w-24 h-24 bg-indigo-500 rounded-full" />
            <div className="relative w-20 h-20 bg-linear-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <Navigation size={32} className="text-white drop-shadow-md" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Finding your ride</h2>
          <p className="text-slate-400 text-sm mb-8 text-center px-4">Matching you with the nearest and best available captain...</p>
          <button onClick={handleCancel} className="mt-auto w-full max-w-md mx-auto py-3.5 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-colors">
            Cancel Request
          </button>
        </div>
      )}

      {/* ================= STATE 2: CONFIRMED ================= */}
      {userRideState === "confirmed" && (
        <div className="flex flex-col h-screen">
          
          {/* 3. REPLACED STATIC BACKGROUND WITH LIVE MAP */}
          <div className="flex-1 relative bg-[#1a1d27]">
            <LiveTracking 
              mode="user_tracking" 
              captainLocation={captainLocation} 
            />
            
            {/* The ETA Overlay on top of the Map */}
            <div className="absolute top-20 left-4 right-4 bg-[#0f1117]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-lg max-w-md mx-auto z-10">
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg">Arriving in {driverDetails.eta}</span>
                <span className="text-slate-400 text-xs">Captain is on the way</span>
              </div>
              <div className="bg-purple-500/20 text-purple-400 p-2 rounded-full">
                <MapPin size={20} />
              </div>
            </div>
          </div>

          {/* Bottom Driver Info Drawer */}
          <div className="bg-[#1a1d27] border-t border-white/10 rounded-t-3xl p-5 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-700 rounded-full border-2 border-indigo-500 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">👨🏽‍✈️</div>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">{driverDetails.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-400 mt-0.5">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span>{driverDetails.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white text-black px-2.5 py-1 rounded-md font-bold text-sm mb-1 tracking-wider">{driverDetails.plate}</div>
                  <div className="text-xs text-slate-400">{driverDetails.vehicle}</div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-linear-to-r from-[#0f1117] to-[#161925] border border-white/5 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3">
                  <Shield size={24} className="text-green-400" />
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-0.5">Secure PIN</span>
                    <span className="text-white text-sm">Provide this to the captain</span>
                  </div>
                </div>
                <div className="bg-[#222635] px-4 py-2 rounded-lg text-white font-mono text-2xl font-bold tracking-widest select-all">
                  {driverDetails.otp}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-white text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200"><Phone size={18} />Call</button>
                <button className="flex-1 bg-[#222635] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-white/5"><MessageSquare size={18} />Message</button>
                <button onClick={handleCancel} className="w-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl"><X size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}