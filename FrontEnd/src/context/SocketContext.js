import { create } from "zustand";
import { io } from "socket.io-client";
import { useRideStore } from "./RideContext";

export const useSocketStore = create((set, get) => ({
  socket: null,

  connectSocket: (authUser) => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ── JOIN ─────────────────────────────────────────────────────────────────
    // Called both on initial connect AND on every reconnect (e.g. after a
    // page refresh). This re-registers the captain/user's socketId server-side
    // so they keep receiving ride events.
    const joinServer = () => {
      socket.emit("join", {
        userId: authUser._id,
        userType: authUser.role || "user",
      });

      // Re-join the active ride room if one was in progress when the page
      // was refreshed. The server should have a "rejoin_ride" event that puts
      // this socket back into the ride-specific room.
      const { rideDetails, userRideState } = useRideStore.getState();
      if (
        rideDetails?._id &&
        (userRideState === "searching" ||
          userRideState === "confirmed" ||
          userRideState === "active")
      ) {
        socket.emit("rejoin_ride", {
          rideId: rideDetails._id,
          userId: authUser._id,
          userType: authUser.role || "user",
        });
      }
    };

    socket.on("connect", joinServer);

    // socket.io fires "reconnect" after a dropped connection is restored.
    // Re-join so we don't miss any in-flight events.
    socket.on("reconnect", joinServer);

    // ── INCOMING RIDE REQUEST (captain side) ─────────────────────────────────
    // Payload: the full populated ride object from ride.controller.createRide
    socket.on("new-ride", (rideData) => {
      // Handled by captain dashboard component (it subscribes to the socket
      // directly via useEffect). We expose the socket so components can use it.
    });

    // ── RIDE ACCEPTED by captain (user side) ─────────────────────────────────
    socket.on("ride-accepted", (rideData) => {
      const { setRideDetails, setUserRideState } = useRideStore.getState();
      setRideDetails(rideData);
      setUserRideState("confirmed");
    });

    // ── CAPTAIN REAL-TIME LOCATION ────────────────────────────────────────────
    // Payload: { rideId, location: { type:"Point", coordinates:[lng, lat] }, timestamp }
    socket.on("captain_location_update", ({ location }) => {
      if (!location?.coordinates) return;
      const [lng, lat] = location.coordinates;
      useRideStore.getState().setCaptainLocation({ lat, lng });
    });

    // ── TRIP STARTED ──────────────────────────────────────────────────────────
    socket.on("trip-started", () => {
      useRideStore.getState().setUserRideState("active");
    });

    // ── TRIP COMPLETED ────────────────────────────────────────────────────────
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

  // Convenience getter so components don't need to import the full store
  getSocket: () => get().socket,
}));