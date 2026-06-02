const socketIo = require("socket.io");
const userModel = require("./src/models/user.model");
const captainModel = require("./src/models/captain.model");

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ── JOIN ────────────────────────────────────────────────────────────────
    // Called by both user and captain on every connect/reconnect.
    // Saves the new socketId to DB so ride.controller can look it up.
    socket.on("join", async (data) => {
      try {
        const { userId, userType } = data;

        // Attach to socket object so other handlers can read it without
        // needing a DB lookup (e.g. captain_location_update below).
        socket.userId = userId;
        socket.userType = userType;

        if (userType === "user") {
          await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
        } else if (userType === "captain") {
          await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
        }
      } catch (error) {
        console.error("Error in join event:", error);
        socket.emit("error", { message: "Failed to join socket" });
      }
    });

    // ── REJOIN RIDE ─────────────────────────────────────────────────────────
    // Called by SocketContext on every reconnect (page refresh, network blip).
    // Puts the socket back into the ride-specific room so it keeps receiving
    // captain_location_update, trip-started, and trip-completed events.
    // Also re-saves the new socketId to DB because it changes on every
    // new socket connection.
    socket.on("rejoin_ride", async ({ rideId, userId, userType }) => {
      if (!rideId) return;

      socket.join(`ride:${rideId}`);
      console.log(
        `[socket] ${userType} ${userId} rejoined room ride:${rideId}`,
      );

      try {
        if (userType === "captain") {
          await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
        } else {
          await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
        }
      } catch (err) {
        console.error("rejoin_ride DB update error:", err.message);
      }
    });

    // ── JOIN RIDE ROOM ──────────────────────────────────────────────────────
    // Lightweight version — just joins the room without a DB write.
    // Called by ride.controller after accept so both sockets are in the room.
    socket.on("join_ride_room", ({ rideId }) => {
      if (!rideId) return;
      socket.join(`ride:${rideId}`);
      console.log(`[socket] ${socket.id} joined room ride:${rideId}`);
    });

    // ── CAPTAIN LOCATION UPDATE (idle / between rides) ───────────────────────
    // Used while captain is online but NOT in an active trip.
    // Saves location to DB so getCaptainsInTheRadius works for new bookings.
    // BUG FIX: original handler expected { lat, lng } but GeoJSON and the
    // frontend both send { type:"Point", coordinates:[lng, lat] }.
    // We now accept both shapes so nothing breaks.
    socket.on("update-location-captain", async (data) => {
      try {
        const { userId, location } = data;

        let geoPoint;

        if (location?.coordinates) {
          // GeoJSON shape — { type:"Point", coordinates:[lng, lat] }
          geoPoint = {
            type: "Point",
            coordinates: location.coordinates,
          };
        } else if (location?.lat !== undefined && location?.lng !== undefined) {
          // Legacy flat shape — { lat, lng }
          geoPoint = {
            type: "Point",
            coordinates: [location.lng, location.lat],
          };
        } else {
          return socket.emit("error", { message: "Invalid location data" });
        }

        await captainModel.findByIdAndUpdate(userId, { location: geoPoint });
      } catch (error) {
        console.error("Error updating captain location:", error);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    // ── CAPTAIN LOCATION UPDATE (during active trip) ──────────────────────────
    // Emitted by LiveTracking (captain_tracking mode) every few seconds.
    // Does two things:
    //   1. Broadcasts the location to everyone in the ride room (user sees it).
    //   2. Persists it to the captain model for geo queries.
    socket.on(
      "captain_location_update",
      async ({ rideId, location, timestamp }) => {
        if (!location?.coordinates) return;

        // Broadcast to user (and anyone else) in this ride's room
        io.to(`ride:${rideId}`).emit("captain_location_update", {
          location,
          timestamp: timestamp || Date.now(),
        });

        // Persist so the captain shows up in radius searches
        const userId = socket.userId;
        if (userId) {
          try {
            await captainModel.findByIdAndUpdate(userId, {
              location: {
                type: "Point",
                coordinates: location.coordinates, // already [lng, lat]
              },
            });
          } catch (err) {
            console.error("captain_location_update save error:", err.message);
          }
        }
      },
    );

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

// ── sendMessageToSocketId ────────────────────────────────────────────────────
// Used by ride.controller to push events directly to a specific socket.
const sendMessageToSocketId = (socketId, messageObject) => {
  if (io) {
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log("Socket.io not initialized.");
  }
};

// ── sendMessageToRideRoom ────────────────────────────────────────────────────
// Broadcasts to everyone in a ride room (user + captain).
// Use this in ride.controller when you want both parties notified.
// e.g. sendMessageToRideRoom(rideId, { event: "trip-started", data: ride })
const sendMessageToRideRoom = (rideId, messageObject) => {
  if (io) {
    io.to(`ride:${rideId}`).emit(messageObject.event, messageObject.data);
  } else {
    console.log("Socket.io not initialized.");
  }
};

// ── findSocketById ───────────────────────────────────────────────────────────
// Returns the raw Socket object for a given socketId.
// Useful in ride.controller to join sockets into a ride room on accept.
const findSocketById = (socketId) => {
  return io?.sockets?.sockets?.get(socketId) ?? null;
};

module.exports = {
  initializeSocket,
  sendMessageToSocketId,
  sendMessageToRideRoom,
  findSocketById,
};
