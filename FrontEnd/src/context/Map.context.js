import { create } from "zustand";
import { AxiosAPI } from "../api/Axios"; // Make sure your path is correct

export const useMapStore = create((set, get) => ({
  suggestions: [],
  isLoadingSuggestions: false,
  distance: null,
  duration: null,

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

  getDistance_Duration: async (origin, destination) => {
    try {
      const res = await AxiosAPI.get("/map/get-distance-time", {
        params: { origin, destination },
      });
      console.log(res.data);
      set({
        distance: res.data.distance,
        duration: res.data.duration,
      });

      console.log(get().distance)
      console.log(get().duration)
    } catch (error) {
      console.log("Failed to get distance and duration : ", error);
    }
  },
}));
