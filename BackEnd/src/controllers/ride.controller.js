const { sendMessageToSocketId, findSocketById } = require("../../socket");
const rideModel    = require("../models/ride.model");
const userModel    = require("../models/user.model");
const captainModel = require("../models/captain.model");
const {
  getCaptainsInTheRadius,
  getAddressCoordinate,
  getDistanceTime,
} = require("../services/map.service");
const { generateOtp, sendRideOtpEmail } = require("../utils/util");

// ── getFare ───────────────────────────────────────────────────────────────────
const getFare = (distanceKm, durationMin) => {
  const fareConfig = {
    car:        { baseFare: 60,  perKm: 18, perMinute: 2.5 },
    auto:       { baseFare: 35,  perKm: 11, perMinute: 1.5 },
    motorcycle: { baseFare: 25,  perKm: 8,  perMinute: 1   },
  };
  const result = {};
  for (const v in fareConfig) {
    const c = fareConfig[v];
    result[v] = Math.round(c.baseFare + distanceKm * c.perKm + durationMin * c.perMinute);
  }
  return result;
};

// ── createRide ────────────────────────────────────────────────────────────────
// KEY FIX: respond to the user as soon as the ride document is created.
// Captain search, socket emissions, and OTP email all happen AFTER the response
// is sent so the user sees the "searching" UI immediately instead of waiting
// 2-5 seconds for Google APIs + email.
const createRide = async (req, res) => {
  const { pickup, destination, vehicleType } = req.body;

  try {
    const distanceTimeData = await getDistanceTime(pickup, destination);
    const distanceKm  = distanceTimeData.distance.value / 1000;
    const durationMin = distanceTimeData.duration.value / 60;

    const allFares = getFare(distanceKm, durationMin);
    const fare     = allFares[vehicleType];

    if (!fare) return res.status(400).json({ message: "Invalid vehicle type" });

    const user = await userModel.findById(req.user.id);
    if (!user)  return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();

    const ride = await rideModel.create({
      user: req.user.id,
      pickup,
      destination,
      fare,
      distance: distanceTimeData.distance.value,
      duration: distanceTimeData.duration.value,
      otp,
    });

    const rideWithUser = await rideModel.findById(ride._id).populate("user");

    // ── Respond immediately — user sees the searching screen right away ──────
    res.status(201).json({ message: "New ride created", ride: rideWithUser });

    // ── Everything below is fire-and-forget — runs after response is sent ────
    // Captain search + socket notifications run in the background.
    // If any of these fail, the ride is already created and the user is already
    // in the searching state — they can wait for a retry or cancel.
    (async () => {
      try {
        const pickupCoords  = await getAddressCoordinate(pickup);
        const captainsInRange = await getCaptainsInTheRadius(
          pickupCoords.lat,
          pickupCoords.lng,
          1000, // km radius
        );

        console.log("Captains in range:", captainsInRange.length);

        captainsInRange.forEach((captain) => {
          if (captain.socketId) {
            sendMessageToSocketId(captain.socketId, {
              event: "new-ride",
              data:  rideWithUser,
            });
          }
        });
      } catch (err) {
        console.error("Captain search/notify error (non-fatal):", err.message);
      }

      try {
        await sendRideOtpEmail(user.email, otp);
      } catch (err) {
        console.error("OTP email error (non-fatal):", err.message);
      }
    })();

  } catch (error) {
    console.error("Ride creation error:", error);
    // Only reaches here if the DB create or initial distanceTime call failed
    if (!res.headersSent) {
      res.status(500).json({ message: "Database error" });
    }
  }
};

// ── getRideFare ───────────────────────────────────────────────────────────────
const getRideFare = async (req, res) => {
  const { distance, duration } = req.query;
  const distanceKm  = parseFloat(distance) / 1000;
  const durationMin = parseFloat(duration)  / 60;
  const farePrice   = getFare(distanceKm, durationMin);
  return res.status(200).json({ message: "Ride fare fetched", farePrice });
};

// ── acceptRide ────────────────────────────────────────────────────────────────
// BUG FIX: returnDocument:"after" is a MongoDB driver option, NOT a Mongoose
// option. Mongoose uses `new: true`. Using the wrong option returns the OLD
// document (without captain populated), so rideWithUser.captain was always null.
const acceptRide = async (req, res) => {
  const { rideId } = req.body;
  if (!rideId) return res.status(400).json({ message: "rideId is required" });

  try {
    const captainId = req.user.id;

    const ride = await rideModel
      .findByIdAndUpdate(
        rideId,
        { status: "accepted", captain: captainId },
        { new: true },          
      )
      .populate("user")
      .populate("captain");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Notify the user their ride was accepted
    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-accepted",
        data:  ride,
      });
    }

    // Put both sockets into the ride room for subsequent location broadcasts
    const captainDoc = await captainModel.findById(captainId);
    if (captainDoc?.socketId) {
      const captainSocket = findSocketById(captainDoc.socketId);
      if (captainSocket) captainSocket.join(`ride:${rideId}`);
    }
    if (ride.user?.socketId) {
      const userSocket = findSocketById(ride.user.socketId);
      if (userSocket) userSocket.join(`ride:${rideId}`);
    }

    return res.status(200).json({ message: "Ride accepted", ride });
  } catch (err) {
    console.error("Accept ride error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── startTrip ─────────────────────────────────────────────────────────────────
// BUG FIX: same returnDocument → new:true fix
const startTrip = async (req, res) => {
  const { rideId } = req.body;
  if (!rideId) return res.status(400).json({ message: "rideId is required" });

  try {
    const ride = await rideModel
      .findByIdAndUpdate(rideId, { status: "ongoing" }, { new: true })
      .populate("user");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "trip-started",
        data:  ride,
      });
    }

    return res.status(200).json({ message: "Trip started", ride });
  } catch (err) {
    console.error("Start trip error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── completeTrip ──────────────────────────────────────────────────────────────
const completeTrip = async (req, res) => {
  const { rideId } = req.body;
  if (!rideId) return res.status(400).json({ message: "rideId is required" });

  try {
    const ride = await rideModel
      .findByIdAndUpdate(rideId, { status: "completed" }, { new: true })
      .populate("user");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "trip-completed",
        data:  ride,
      });
    }

    return res.status(200).json({ message: "Trip completed", ride });
  } catch (err) {
    console.error("Complete trip error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createRide, getRideFare, acceptRide, startTrip, completeTrip };