import { create } from "zustand";
import { AxiosAPI } from "../api/Axios";

// ─── Persistence helpers ──────────────────────────────────────────────────────
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

// If the captain refreshes while a ride is just "incoming", drop it back to idle
// (because the timer would have expired anyway). Otherwise, keep their active state.
const initCaptainState =
  persisted?.captainRideState === "incoming"
    ? "idle"
    : (persisted?.captainRideState ?? "idle");

export const useRideStore = create((set, get) => ({
  isBookingRide: false,

  rideDetails: persisted?.rideDetails ?? null,
  userRideState: persisted?.userRideState ?? "",
  captainRideState: initCaptainState,
  farePrice: persisted?.farePrice ?? null,
  captainLocation: persisted?.captainLocation ?? null,
  captainEta: persisted?.captainEta ?? null,
  userLocation: null,

  // ── Setters ───────────────────────────────────────────────────────────────
  setUserRideState: (newState) => {
    set({ userRideState: newState });
    const s = get();
    saveRideState({ ...s, userRideState: newState });
  },

  setCaptainRideState: (newState) => {
    set({ captainRideState: newState });
    const s = get();
    saveRideState({ ...s, captainRideState: newState });
  },

  setRideDetails: (ride) => {
    set({ rideDetails: ride });
    const s = get();
    saveRideState({ ...s, rideDetails: ride });
  },

  setCaptainLocation: (loc) => {
    set({ captainLocation: loc });
    const s = get();
    saveRideState({ ...s, captainLocation: loc });
  },

  setCaptainEta: (eta) => {
    set({ captainEta: eta });
    const s = get();
    saveRideState({ ...s, captainEta: eta });
  },

  setUserLocation: (loc) => {
    set({ userLocation: loc });
  },

  setFarePrice: (price) => {
    set({ farePrice: price });
    const s = get();
    saveRideState({ ...s, farePrice: price });
  },

  // ── Full reset ────────────────────────────────────────────────────────────
  resetRide: () => {
    clearRideState();
    set({
      rideDetails: null,
      userRideState: "",
      captainRideState: "idle",
      farePrice: null,
      captainLocation: null,
      captainEta: null,
      isBookingRide: false,
    });
  },

  // ── APIs ──────────────────────────────────────────────────────────────────
  bookRide: async (rideData) => {
    try {
      set({ isBookingRide: true });
      const res = await AxiosAPI.post("/ride/create-ride", rideData);
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
