// via the `role` field on authUser.  This file re-exports a thin compatibility
// shim so that any component still importing `useCaptainStore` continues to work
// without changes.
//
// All captain-specific actions (register, login, verify-OTP, logout, checkAuth)
// are handled by useAuthStore with `role = "captain"`.
import { create } from "zustand";
import { useAuthStore } from "./UserContext";
import { AxiosAPI } from "../api/Axios"; 

export const useCaptainStore = create((set) => ({
  isTogglingStatus: false,

  toggleAvailability: async () => {
    set({ isTogglingStatus: true });

    try {
      const res = await AxiosAPI.post("/captain/captain-availability");

      const newStatus = res.data.status;

      // 1. Get the current global Auth Store state
      const authStore = useAuthStore.getState();

      // 2. Safely log the before state
      console.log("Before Update:", authStore.authUser); 

      // 3. Update the global state using Zustand's built-in setState
      if (authStore.authUser) {
        useAuthStore.setState({
          authUser: {
            ...authStore.authUser,
            status: newStatus,
          },
        });
      }
      
      // 4. Safely log the after state
      console.log("After Update:", useAuthStore.getState().authUser); 

      return { success: true, status: newStatus };
    } catch (error) {
      console.error("Toggle Availability Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update status",
      };
    } finally {
      set({ isTogglingStatus: false });
    }
  },
}));