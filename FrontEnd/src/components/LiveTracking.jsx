import React, { useState, useEffect, useRef, useCallback } from "react";
import { useJsApiLoader, GoogleMap, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { AlertCircle, Loader2, RefreshCw, Maximize2, Minimize2, Navigation } from "lucide-react";

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

const makeIcon = (svg, size) => {
  if (typeof window === "undefined" || !window.google?.maps) return null;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
};

const USER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="16" fill="#6366f1" stroke="white" stroke-width="3"/>
  <circle cx="18" cy="18" r="6" fill="white"/>
</svg>`;

const CAPTAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
  <text x="20" y="26" text-anchor="middle" font-size="18" fill="white">&#x1F697;</text>
</svg>`;

const PICKUP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28S40 35 40 20C40 9 31 0 20 0z" fill="#f59e0b" stroke="white" stroke-width="2.5"/>
  <circle cx="20" cy="20" r="8" fill="white"/>
  <circle cx="20" cy="20" r="4" fill="#f59e0b"/>
</svg>`;

const LiveTracking = ({
  mode = "user_tracking",
  captainLocation = null,
  pickupLocation = null,   // { lat, lng } — pre-geocoded coords (legacy)
  pickupAddress  = null,   // string address — LiveTracking geocodes it internally
  socket = null,
  rideId = null,
  updateIntervalMs = 5000,
  height = "100%",
  showControls = true,
  allowFullscreen = false,
}) => {
  const [userPosition, setUserPosition]     = useState(null);
  const [error, setError]                   = useState(null);
  const [lastUpdated, setLastUpdated]       = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isFullscreen, setIsFullscreen]     = useState(false);
  // Internal geocoded pickup — resolved from pickupAddress once Maps SDK is ready
  const [resolvedPickup, setResolvedPickup] = useState(pickupLocation);

  const mapRef         = useRef(null);
  const watchIdRef     = useRef(null);
  const intervalRef    = useRef(null);
  const geocodedRef    = useRef(false); // prevent re-geocoding same address

  // FIXED: Ref prevents the map from resetting zoom every 5 seconds
  const boundsFitRef   = useRef(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  // ── Internal geocoding — runs once when SDK is ready and address is known ──
  // This is the correct place to geocode because isLoaded guarantees the SDK
  // is available. External callers just pass pickupAddress (a string) and we
  // handle the rest. Falls back to the pre-geocoded pickupLocation prop.
  useEffect(() => {
    if (!isLoaded || !window.google?.maps) return;
    if (geocodedRef.current) return;

    // If pre-geocoded coords were passed, use them directly
    if (pickupLocation && !resolvedPickup) {
      setResolvedPickup(pickupLocation);
      geocodedRef.current = true;
      boundsFitRef.current = false; // re-fit bounds with pickup marker
      return;
    }

    if (!pickupAddress) return;

    geocodedRef.current = true; // mark before async to prevent double-fire
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: pickupAddress }, (results, status) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        setResolvedPickup({ lat: loc.lat(), lng: loc.lng() });
        boundsFitRef.current = false; // reset so camera re-fits with new marker
        console.log("[LiveTracking] geocoded pickup:", pickupAddress, loc.lat(), loc.lng());
      } else {
        console.warn("[LiveTracking] geocoding failed:", status, pickupAddress);
        geocodedRef.current = false; // allow retry on next render
      }
    });
  }, [isLoaded, pickupAddress, pickupLocation, resolvedPickup]);

  // Reset geocode ref when address changes so we re-geocode for a new ride
  useEffect(() => {
    geocodedRef.current = false;
    setResolvedPickup(pickupLocation ?? null);
    boundsFitRef.current = false;
  }, [pickupAddress, pickupLocation]);

  const onGPSSuccess = useCallback((pos) => {
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setUserPosition(loc);
    setLastUpdated(new Date());
    setError(null);

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
    setUserPosition((prev) => {
      if (!prev) setError("GPS signal weak or timed out. Waiting for connection…");
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError, { enableHighAccuracy: true, timeout: 10000 });
    watchIdRef.current = navigator.geolocation.watchPosition(onGPSSuccess, onGPSError, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    
    if (mode === "user_tracking" || mode === "captain_tracking") {
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
      }, updateIntervalMs);
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [onGPSSuccess, onGPSError, mode, updateIntervalMs]);

  // ── Camera: fit all visible points (FIXED: Only once unless recentered) ──────
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !window.google?.maps) return;

    const points = [];
    if (userPosition) points.push(userPosition);
    if (captainLocation && mode === "user_tracking") points.push(captainLocation);
    if (resolvedPickup && mode === "captain_tracking") points.push(resolvedPickup);

    if (points.length >= 2) {
      if (!boundsFitRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend(p));
        mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        boundsFitRef.current = true;
      }
    } else if (points.length === 1) {
      if (!boundsFitRef.current) {
        mapRef.current.panTo(points[0]);
        boundsFitRef.current = true;
      }
    }
  }, [userPosition, captainLocation, pickupLocation, mode, isLoaded]);

  const mapCenter = userPosition || captainLocation || pickupLocation || { lat: 28.6139, lng: 77.2090 };
  const wrapperStyle = isFullscreen ? { position: "fixed", inset: 0, zIndex: 9999, height: "100dvh" } : { height };

  if ((error || loadError) && !userPosition && !captainLocation && !pickupLocation) {
    return (
      <div className="w-full bg-[#1a1d27] rounded-2xl border border-red-500/20 flex flex-col items-center justify-center p-6 text-center" style={wrapperStyle}>
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
          <AlertCircle className="text-red-400" size={22} />
        </div>
        <p className="text-sm font-bold text-white mb-1">Location Error</p>
        <p className="text-xs text-slate-400 mb-4">{error || "Failed to load Google Maps"}</p>
        <button onClick={() => { setError(null); setLastUpdated(new Date()); }} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors">
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  if (!isLoaded || !window.google?.maps || (!userPosition && !captainLocation && !pickupLocation)) {
    return (
      <div className="w-full bg-[#1a1d27] rounded-2xl border border-white/10 flex flex-col items-center justify-center p-6" style={wrapperStyle}>
        <Loader2 className="text-indigo-500 animate-spin mb-3" size={28} />
        <p className="text-sm font-bold text-white mb-1">{(!isLoaded || !window.google?.maps) ? "Loading Maps…" : "Acquiring GPS"}</p>
        <p className="text-xs text-slate-500 animate-pulse">{(!isLoaded || !window.google?.maps) ? "Fetching Google Maps SDK" : "Connecting to satellites…"}</p>
      </div>
    );
  }

  const userMarkerIcon    = makeIcon(USER_SVG,    36);
  const captainMarkerIcon = makeIcon(CAPTAIN_SVG, 40);
  const pickupMarkerIcon  = makeIcon(PICKUP_SVG,  40);

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    ...(window.google?.maps && {
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
    }),
    styles: DARK_MAP_STYLE,
    gestureHandling: "greedy",
    clickableIcons: false,
  };

  return (
    <div className="relative w-full overflow-hidden border border-white/10 shadow-xl transition-all duration-300" style={{ ...wrapperStyle, borderRadius: isFullscreen ? 0 : "1rem" }}>
      <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={mapCenter} zoom={15} onLoad={(map) => { mapRef.current = map; }} options={mapOptions}>
        {userPosition && userMarkerIcon && <Marker position={userPosition} icon={userMarkerIcon} onClick={() => setSelectedMarker("user")} />}
        {selectedMarker === "user" && userPosition && (
          <InfoWindow position={userPosition} onCloseClick={() => setSelectedMarker(null)}>
            <div style={{ background: "#1a1d27", padding: 6, borderRadius: 8 }}><p style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 12, margin: 0 }}>{mode === "captain_tracking" ? "🚗 You (Captain)" : "📍 Your location"}</p></div>
          </InfoWindow>
        )}

        {captainLocation && captainMarkerIcon && mode === "user_tracking" && <Marker position={captainLocation} icon={captainMarkerIcon} onClick={() => setSelectedMarker("captain")} />}
        {selectedMarker === "captain" && captainLocation && mode === "user_tracking" && (
          <InfoWindow position={captainLocation} onCloseClick={() => setSelectedMarker(null)}>
            <div style={{ background: "#1a1d27", padding: 6, borderRadius: 8 }}><p style={{ color: "#34d399", fontWeight: 700, fontSize: 12, margin: 0 }}>🚗 Captain</p><p style={{ color: "#94a3b8", fontSize: 10, margin: "2px 0 0" }}>En route</p></div>
          </InfoWindow>
        )}

        {resolvedPickup && pickupMarkerIcon && mode === "captain_tracking" && <Marker position={resolvedPickup} icon={pickupMarkerIcon} onClick={() => setSelectedMarker("pickup")} />}
        
        {userPosition && captainLocation && mode === "user_tracking" && <Polyline path={[userPosition, captainLocation]} options={{ strokeColor: "#6366f1", strokeOpacity: 0.7, strokeWeight: 3, geodesic: true }} />}
        {userPosition && resolvedPickup && mode === "captain_tracking" && <Polyline path={[userPosition, resolvedPickup]} options={{ strokeColor: "#f59e0b", strokeOpacity: 0.7, strokeWeight: 3, geodesic: true }} />}
      </GoogleMap>

      {showControls && (
        <>
          <div className="absolute top-3 left-3 z-10 bg-[#0f1117]/85 backdrop-blur border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-lg pointer-events-none">
            <div className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" /></div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Live Tracking</p>
              {lastUpdated && <p className="text-[9px] text-indigo-400 font-mono mt-0.5">{lastUpdated.toLocaleTimeString()}</p>}
            </div>
          </div>
          
          {/* FIXED: Re-center button to easily snap back to cars if you drag away! */}
          <button onClick={() => { boundsFitRef.current = false; setLastUpdated(new Date()); }} className="absolute bottom-6 right-3 z-10 w-10 h-10 bg-[#0f1117]/90 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg" title="Re-center map">
            <Navigation size={18} className="text-indigo-400" />
          </button>
        </>
      )}

      {allowFullscreen && (
        <button onClick={() => setIsFullscreen((f) => !f)} className="absolute top-3 right-3 z-10 w-10 h-10 bg-[#0f1117]/90 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg">
          {isFullscreen ? <Minimize2 size={16} className="text-white" /> : <Maximize2 size={16} className="text-white" />}
        </button>
      )}
    </div>
  );
};

export default LiveTracking;