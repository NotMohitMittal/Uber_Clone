import { create } from "zustand";
import { AxiosAPI } from "../api/Axios";

// ─── Why no localStorage? ─────────────────────────────────────────────────────
// The refresh token is an HttpOnly cookie — JS can't read it, so we can't
// decode the role from it on the frontend.  Instead, checkAuth tries the
// captain endpoint first (it will 401 if the stored cookie belongs to a user),
// then falls back to the user endpoint.  The backend already knows the role
// from the JWT payload it signed, so whichever endpoint succeeds tells us
// exactly who the caller is — no client-side role storage needed.
// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = create((set, get) => ({
  authUser: null,
  accessToken: null,
  userProfile: null,

  isFetchingProfile: false,
  isRegistering: false,
  isLoggingIn: false,
  isVerifyingOTP: false,
  isCheckingAuth: true,

  setAccessToken: (token) => set({ accessToken: token }),

  // ── Register ───────────────────────────────────────────────────────────────
  register: async (formData, role = "user") => {
    try {
      set({ isRegistering: true });

      const endpoint =
        role === "captain" ? "/captain/register" : "/user/register";

      const res = await AxiosAPI.post(endpoint, formData);

      const accountData = role === "captain" ? res.data.captain : res.data.user;

      set({ authUser: { ...accountData, role } });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    } finally {
      set({ isRegistering: false });
    }
  },

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  verifyOTP: async (otp, role = "user") => {
    try {
      set({ isVerifyingOTP: true });

      const email = get().authUser?.email;

      const endpoint =
        role === "captain" ? "/captain/verify-email" : "/user/verify-email";

      const res = await AxiosAPI.post(endpoint, { email, otp });

      const accountData = role === "captain" ? res.data.captain : res.data.user;

      set({ authUser: { ...accountData, role } });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "OTP verification failed",
      };
    } finally {
      set({ isVerifyingOTP: false });
    }
  },

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  resendOTP: async () => {
    try {
      set({ isVerifyingOTP: true });

      const { email, role = "user" } = get().authUser || {};

      const endpoint =
        role === "captain" ? "/captain/resend/otp" : "/user/resend/otp";

      await AxiosAPI.post(endpoint, { email });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isVerifyingOTP: false });
    }
  },

  // ── Get Profile ────────────────────────────────────────────────────────────
  getProfile: async () => {
    try {
      set({ isFetchingProfile: true });
      const res = await AxiosAPI.get("/user/profile");
      set({ userProfile: res.data.user });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isFetchingProfile: false });
    }
  },

  // ── Login ──────────────────────────────────────────────────────────────────
  loginUser: async (formData, role = "user") => {
    try {
      set({ isLoggingIn: true });

      const endpoint = role === "captain" ? "/captain/login" : "/user/login";

      const res = await AxiosAPI.post(endpoint, formData);

      const accountData = role === "captain" ? res.data.captain : res.data.user;

      set({
        authUser: { ...accountData, role },
        accessToken: res.data.accessToken,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ── Check Auth ─────────────────────────────────────────────────────────────
  // The refresh token is HttpOnly — we can't decode it in JS to read the role.
  // Strategy:
  //   1. If authUser is still in memory (soft refresh / navigation), use that
  //      role directly — one targeted request.
  //   2. On a hard refresh (state wiped), try captain first, then user.
  //      The backend validates the cookie JWT and returns the matching entity,
  //      so whichever call succeeds is authoritative.
  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });

      const inMemoryRole = get().authUser?.role;

      if (inMemoryRole) {
        // Fast path: role already known from this session
        return await get()._refreshForRole(inMemoryRole);
      }

      // Slow path: hard refresh, role unknown — probe both endpoints.
      // Try captain first; if its cookie doesn't match, the server 401s
      // and we fall through to the user endpoint.
      const captainResult = await get()._refreshForRole("captain");
      if (captainResult.success) return captainResult;

      return await get()._refreshForRole("user");
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ── Internal helper — attempt a token refresh for a given role ────────────
  // Returns { success: true } or { success: false }.
  // Never throws — callers always check the return value.
  _refreshForRole: async (role) => {
    try {
      const endpoint =
        role === "captain" ? "/captain/refresh-token" : "/user/refresh-token";

      const res = await AxiosAPI.get(endpoint);

      const accountData = role === "captain" ? res.data.captain : res.data.user;

      // captain rotateToken returns "newAccessToken"; user returns "accessToken"
      const token =
        role === "captain" ? res.data.newAccessToken : res.data.accessToken;

      set({
        authUser: { ...accountData, role },
        accessToken: token,
      });

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logoutUser: async () => {
    try {
      const role = get().authUser?.role || "user";
      const endpoint = role === "captain" ? "/captain/logout" : "/user/logout";

      await AxiosAPI.post(endpoint);
      set({ authUser: null, accessToken: null });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Logout failed",
      };
    }
  },

  // ── Force clear (called by Axios interceptor on unrecoverable 401) ────────
  clearAuth: () => {
    set({ authUser: null, accessToken: null, isCheckingAuth: false });
  },
}));
