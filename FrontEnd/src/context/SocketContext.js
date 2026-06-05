import { create } from "zustand";
import { io } from "socket.io-client";
import { useRideStore } from "./RideContext";

// In production on Render, frontend and backend share the same origin.
// socket.io-client connects to window.location.origin when no URL is given,
// which is exactly what we want.
// In local dev, set VITE_SOCKET_URL=http://localhost:3000 in FrontEnd/.env.local
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const useSocketStore = create((set, get) => ({
  socket: null,

  connectSocket: (authUser) => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      // Allow both websocket and polling so Render's proxy doesn't block it.
      // Render's infrastructure can sometimes drop raw websocket upgrades;
      // starting with polling then upgrading is the safest approach.
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    const joinServer = () => {
      socket.emit("join", {
        userId: authUser._id,
        userType: authUser.role || "user",
      });

      const { rideDetails, userRideState, captainRideState } =
        useRideStore.getState();

      if (
        rideDetails?._id &&
        (userRideState === "searching" ||
          userRideState === "confirmed" ||
          userRideState === "active" ||
          captainRideState === "accepted" ||
          captainRideState === "trip_active")
      ) {
        socket.emit("rejoin_ride", {
          rideId: rideDetails._id,
          userId: authUser._id,
          userType: authUser.role || "user",
        });
      }
    };

    socket.on("connect", joinServer);
    socket.on("reconnect", joinServer);

    socket.on("new-ride", () => {
      // Handled directly by CaptainDashboard via its own useEffect listener.
    });

    socket.on("ride-accepted", (rideData) => {
      const { setRideDetails, setUserRideState } = useRideStore.getState();
      setRideDetails(rideData);
      setUserRideState("confirmed");
    });

    socket.on("captain_location_update", ({ location }) => {
      if (!location?.coordinates) return;
      const [lng, lat] = location.coordinates;
      useRideStore.getState().setCaptainLocation({ lat, lng });
    });

    socket.on("trip-started", () => {
      useRideStore.getState().setUserRideState("active");
    });

    socket.on("trip-completed", () => {
      useRideStore.getState().setUserRideState("completed");
      setTimeout(() => {
        useRideStore.getState().resetRide();
      }, 4000);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  getSocket: () => get().socket,
}));
