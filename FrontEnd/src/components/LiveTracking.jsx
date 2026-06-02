import React, { useState, useEffect, useRef, useCallback } from "react";
import { LoadScript, GoogleMap, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { MapPin, AlertCircle, Loader2, RefreshCw } from "lucide-react";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f1117" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e2035" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111525" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2a2d4a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0c14" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1a1d27" }] },
];

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API || "";

const LiveTracking = ({
  mode = "user_tracking",
  captainLocation = null,
  socket = null,
  rideId = null,
  updateIntervalMs = 10000,
  height = "100%",
  showControls = true,
}) => {
  const [userPosition, setUserPosition] = useState(null);
  const [error, setError]               = useState(null);
  const [mapLoaded, setMapLoaded]       = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const mapRef      = useRef(null);
  const watchIdRef  = useRef(null);
  const intervalRef = useRef(null);

  // ── GPS acquisition ────────────────────────────────────────────────────────
  const onGPSSuccess = useCallback((pos) => {
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setUserPosition(loc);
    setLastUpdated(new Date());
    setError(null); // Clear errors on success

    if (mode === "captain_tracking" && socket && rideId) {
      socket.emit("captain_location_update", {
        rideId,
        location: { type: "Point", coordinates: [loc.lng, loc.lat] },
        timestamp: Date.now(),
      });
    }
  }, [mode, socket, rideId]);

  const onGPSError = useCallback((err) => {
    console.warn("GPS Warning:", err.message);
    // Only set error if we have NO user position AND NO captain position.
    // If we have the captain, we want to show the map anyway!
    setUserPosition((prev) => {
      if (!prev) {
        setError(`GPS signal weak or timed out. Waiting for connection...`);
      }
      return prev; 
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError, {
      enableHighAccuracy: true,
      timeout: 10000, // 10 sec timeout for initial load
    });

    watchIdRef.current = navigator.geolocation.watchPosition(onGPSSuccess, onGPSError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000, 
    });

    if (mode === "user_tracking" || mode === "captain_tracking") {
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError, {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 15000, 
        });
      }, updateIntervalMs);
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [onGPSSuccess, onGPSError, mode, updateIntervalMs]);

  // ── DYNAMIC MAP CAMERA (FITS BOTH USERS ON SCREEN) ────────────────────────
  useEffect(() => {
    if (mapRef.current && window.google) {
      // If we have BOTH locations, zoom out to fit both in the frame
      if (userPosition && captainLocation && mode === "user_tracking") {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(userPosition);
        bounds.extend(captainLocation);
        mapRef.current.fitBounds(bounds);
        
        // Add a little padding so markers don't touch the edges
        const padding = { top: 50, bottom: 50, left: 50, right: 50 };
        mapRef.current.panToBounds(bounds, padding);
      } 
      // Otherwise, just follow whoever is available
      else if (userPosition) {
        mapRef.current.panTo(userPosition);
      } else if (captainLocation) {
        mapRef.current.panTo(captainLocation);
      }
    }
  }, [userPosition, captainLocation, mode]);

  const mapCenter = userPosition || captainLocation || { lat: 28.6139, lng: 77.2090 };

  const userMarkerIcon = mapLoaded && window.google ? {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="#6366f1" stroke="white" stroke-width="3"/>
        <circle cx="18" cy="18" r="6" fill="white"/>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(36, 36),
    anchor: new window.google.maps.Point(18, 18),
  } : null;

  const captainMarkerIcon = mapLoaded && window.google ? {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
        <text x="20" y="26" text-anchor="middle" font-size="18" fill="white">🚗</text>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  } : null;

  // ── Error state (Only show if we have NO user AND NO captain) ──────────────
  if (error && !userPosition && !captainLocation) {
    return (
      <div className="w-full bg-[#1a1d27] rounded-2xl border border-red-500/20 flex flex-col items-center justify-center p-6 text-center" style={{ height }}>
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
          <AlertCircle className="text-red-400" size={22} />
        </div>
        <p className="text-sm font-bold text-white mb-1">Location Error</p>
        <p className="text-xs text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => { setError(null); setLastUpdated(new Date()); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!userPosition && !captainLocation && mode !== "route_preview") {
    return (
      <div className="w-full bg-[#1a1d27] rounded-2xl border border-white/10 flex flex-col items-center justify-center p-6" style={{ height }}>
        <Loader2 className="text-indigo-500 animate-spin mb-3" size={28} />
        <p className="text-sm font-bold text-white mb-1">Acquiring GPS</p>
        <p className="text-xs text-slate-500 animate-pulse">Connecting to satellites…</p>
      </div>
    );
  }

  const apiKey = GOOGLE_MAPS_KEY;
  const hasApiKey = apiKey && apiKey !== "" && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY";

  // ── Full Google Maps render ───────────────────────────────────────────────
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl" style={{ height }}>
      <LoadScript googleMapsApiKey={apiKey} onLoad={() => setMapLoaded(true)}>
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={mapCenter}
          zoom={15}
          onLoad={(map) => { mapRef.current = map; }}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: DARK_MAP_STYLE,
            gestureHandling: "greedy",
          }}
        >
          {userPosition && userMarkerIcon && (
            <Marker position={userPosition} icon={userMarkerIcon} onClick={() => setSelectedMarker("user")} />
          )}
          
          {selectedMarker === "user" && userPosition && (
            <InfoWindow position={userPosition} onCloseClick={() => setSelectedMarker(null)}>
              <div style={{ background: "#1a1d27", padding: 6, borderRadius: 8 }}>
                <p style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 12, margin: 0 }}>📍 Your location</p>
              </div>
            </InfoWindow>
          )}

          {captainLocation && captainMarkerIcon && (
            <Marker position={captainLocation} icon={captainMarkerIcon} onClick={() => setSelectedMarker("captain")} />
          )}
          
          {selectedMarker === "captain" && captainLocation && (
            <InfoWindow position={captainLocation} onCloseClick={() => setSelectedMarker(null)}>
              <div style={{ background: "#1a1d27", padding: 6, borderRadius: 8 }}>
                <p style={{ color: "#34d399", fontWeight: 700, fontSize: 12, margin: 0 }}>🚗 Captain</p>
                <p style={{ color: "#94a3b8", fontSize: 10, margin: "2px 0 0" }}>En route to pickup</p>
              </div>
            </InfoWindow>
          )}

          {userPosition && captainLocation && (
            <Polyline
              path={[userPosition, captainLocation]}
              options={{ strokeColor: "#6366f1", strokeOpacity: 0.7, strokeWeight: 3, geodesic: true }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {showControls && (
        <div className="absolute top-3 left-3 z-10 bg-[#0f1117]/85 backdrop-blur border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-lg pointer-events-none">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">Live Tracking</p>
            {lastUpdated && <p className="text-[9px] text-indigo-400 font-mono mt-0.5">{lastUpdated.toLocaleTimeString()}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;