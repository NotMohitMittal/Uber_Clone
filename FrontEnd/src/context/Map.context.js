import { create } from "zustand";
import { AxiosAPI } from "../api/Axios";

export const useMapStore = create((set, get) => ({
  suggestions: [],
  isLoadingSuggestions: false,

  // Raw Google Maps values — metres and seconds
  // These are stored raw so callers can convert to km/min as needed.
  distance: null,  // metres
  duration: null,  // seconds

  fetchSuggestions: async (input) => {
    if (!input || input.length < 3) {
      set({ suggestions: [] });
      return;
    }
    set({ isLoadingSuggestions: true });
    try {
      const res = await AxiosAPI.get("/map/get-suggestions", {
        params: { input },
      });
      set({ suggestions: res.data });
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      set({ suggestions: [] });
    } finally {
      set({ isLoadingSuggestions: false });
    }
  },

  clearSuggestions: () => set({ suggestions: [] }),

  // Returns { distanceM, durationS, distanceKm, durationMin, distanceText, durationText }
  // so callers never have to re-derive units themselves.
  getDistance_Duration: async (origin, destination) => {
    try {
      const res = await AxiosAPI.get("/map/get-distance-time", {
        params: { origin, destination },
      });

      // Google Distance Matrix element shape:
      //   { distance: { value: <metres>, text }, duration: { value: <seconds>, text } }
      const element = res.data;
      const distanceM = element?.distance?.value ?? null;
      const durationS = element?.duration?.value ?? null;

      console.log("getDistance_Duration raw →", distanceM, "m /", durationS, "s");

      set({
        distance: distanceM,  // metres
        duration: durationS,  // seconds
      });

      // Return the values directly so async callers don't rely on stale store state
      return {
        distanceM,
        durationS,
        distanceKm:  distanceM != null ? distanceM / 1000 : null,
        durationMin: durationS  != null ? durationS  / 60   : null,
        distanceText: element?.distance?.text ?? "",
        durationText: element?.duration?.text ?? "",
      };
    } catch (error) {
      console.error("Failed to get distance and duration:", error);
      return null;
    }
  },
}));