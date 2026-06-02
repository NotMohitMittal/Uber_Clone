import { create } from "zustand";
import { AxiosAPI } from "../api/Axios";

// ─── Persistence helpers ──────────────────────────────────────────────────────
// sessionStorage: survives page refresh, cleared when the tab/browser closes.
// This is intentionally NOT localStorage — we don't want stale ride state
// hanging around across sessions.
const RIDE_KEY = "uber_active_ride";

const saveRideState = (state) => {
  try {
    sessionStorage.setItem(RIDE_KEY, JSON.stringify(state));
  } catch {}
};

const loadRideState = () => {
  try {
    const raw = sessionStorage.getItem(RIDE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearRideState = () => {
  try {
    sessionStorage.removeItem(RIDE_KEY);
  } catch {}
};

// ─── Store ────────────────────────────────────────────────────────────────────
const persisted = loadRideState();

export const useRideStore = create((set, get) => ({
  isBookingRide: false,

  // Rehydrate from sessionStorage on module load so a page refresh doesn't
  // wipe an in-progress ride.
  rideDetails:     persisted?.rideDetails    ?? null,
  userRideState:   persisted?.userRideState  ?? "",
  farePrice:       persisted?.farePrice      ?? null,
  captainLocation: persisted?.captainLocation ?? null,
  userLocation:    null,   // live GPS — not persisted (re-acquired every mount)

  // ── Setters ───────────────────────────────────────────────────────────────

  setUserRideState: (newState) => {
    set({ userRideState: newState });
    // Keep sessionStorage in sync after every state transition
    const s = get();
    saveRideState({
      rideDetails:     s.rideDetails,
      userRideState:   newState,
      farePrice:       s.farePrice,
      captainLocation: s.captainLocation,
    });
  },

  setRideDetails: (ride) => {
    set({ rideDetails: ride });
    const s = get();
    saveRideState({
      rideDetails:     ride,
      userRideState:   s.userRideState,
      farePrice:       s.farePrice,
      captainLocation: s.captainLocation,
    });
  },

  setCaptainLocation: (loc) => {
    set({ captainLocation: loc });
    // Persist captain location so the map doesn't jump on refresh
    const s = get();
    saveRideState({
      rideDetails:     s.rideDetails,
      userRideState:   s.userRideState,
      farePrice:       s.farePrice,
      captainLocation: loc,
    });
  },

  setUserLocation: (loc) => {
    // User location is live GPS — never persisted to avoid stale coords
    set({ userLocation: loc });
  },

  setFarePrice: (price) => {
    set({ farePrice: price });
    const s = get();
    saveRideState({
      rideDetails:     s.rideDetails,
      userRideState:   s.userRideState,
      farePrice:       price,
      captainLocation: s.captainLocation,
    });
  },

  // ── Full reset — call after trip completion or cancellation ──────────────
  resetRide: () => {
    clearRideState();
    set({
      rideDetails:     null,
      userRideState:   "",
      farePrice:       null,
      captainLocation: null,
      isBookingRide:   false,
    });
  },

  // ── API actions ───────────────────────────────────────────────────────────

  bookRide: async (rideData) => {
    try {
      set({ isBookingRide: true });
      const res = await AxiosAPI.post("/ride/create-ride", rideData);
      // Persist immediately so a mid-booking refresh recovers gracefully
      get().setRideDetails(res.data.ride);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Booking failed",
      };
    } finally {
      set({ isBookingRide: false });
    }
  },

  ridePrice: async ({ distance, duration }) => {
    try {
      const res = await AxiosAPI.get("/ride/ride-fare", {
        params: { distance, duration },
      });
      get().setFarePrice(res.data.farePrice);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch fares",
      };
    }
  },
}));