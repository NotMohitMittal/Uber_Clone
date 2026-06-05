const { sendMessageToSocketId } = require("../../socket");
const rideModel = require("../models/ride.model");
const userModel = require("../models/user.model");
const {
  getCaptainsInTheRadius,
  getAddressCoordinate,
  getDistanceTime,
} = require("../services/map.service");
const { generateOtp, sendRideOtpEmail } = require("../utils/util");

// ── getFare ───────────────────────────────────────────────────────────────────
// Expects distanceKm (kilometres) and durationMin (minutes).
// Returns fares for all vehicle types.
const getFare = (distanceKm, durationMin) => {
  const fareConfig = {
    car:        { baseFare: 60,  perKm: 18, perMinute: 2.5 },
    auto:       { baseFare: 35,  perKm: 11, perMinute: 1.5 },
    motorcycle: { baseFare: 25,  perKm: 8,  perMinute: 1   },
  };

  const calculatedFares = {};

  for (const vehicle in fareConfig) {
    const config = fareConfig[vehicle];
    const totalFare =
      config.baseFare +
      distanceKm  * config.perKm +
      durationMin * config.perMinute;
    calculatedFares[vehicle] = Math.round(totalFare);
  }

  return calculatedFares;
};

// ── createRide ────────────────────────────────────────────────────────────────
const createRide = async (req, res) => {
  const { pickup, destination, vehicleType } = req.body;

  try {
    // Google Distance Matrix → metres & seconds → convert to km & minutes
    const distanceTimeData = await getDistanceTime(pickup, destination);
    const distanceKm  = distanceTimeData.distance.value / 1000; // m  → km
    const durationMin = distanceTimeData.duration.value / 60;   // s  → min

    const allFares = getFare(distanceKm, durationMin);
    const fare     = allFares[vehicleType];

    console.log("createRide fares:", allFares, "selected:", vehicleType, fare);

    if (!fare) {
      return res.status(400).json({ message: "Invalid vehicle type" });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();

    const ride = await rideModel.create({
      user: req.user.id,
      pickup,
      destination,
      fare,
      distance: distanceTimeData.distance.value, // store raw metres
      duration: distanceTimeData.duration.value, // store raw seconds
      otp,
    });

    const pickupCoordinates = await getAddressCoordinate(pickup);
    const captainsInRange   = await getCaptainsInTheRadius(
      pickupCoordinates.lat,
      pickupCoordinates.lng,
      1000, // radius in km
    );

    console.log("Captains in range:", captainsInRange.length);

    const rideWithUser = await rideModel.findById(ride._id).populate("user");

    captainsInRange.forEach((captain) => {
      if (captain.socketId) {
        sendMessageToSocketId(captain.socketId, {
          event: "new-ride",
          data: rideWithUser,
        });
      }
    });

    await sendRideOtpEmail(user.email, otp);

    res.status(201).json({
      message: "New ride created",
      ride: rideWithUser,
    });
  } catch (error) {
    console.error("Ride creation error:", error);
    res.status(500).json({ message: "Database error" });
  }
};

// ── getRideFare ───────────────────────────────────────────────────────────────
// Query params: distance (metres), duration (seconds)
// Converts to km / minutes before calling getFare so the math is always correct.
const getRideFare = async (req, res) => {
  const { distance, duration } = req.query;

  // The client sends raw Google Maps values (metres & seconds).
  // Convert here so getFare always receives km and minutes.
  const distanceKm  = parseFloat(distance) / 1000;
  const durationMin = parseFloat(duration) / 60;

  console.log("getRideFare input (raw):", distance, duration);
  console.log("getRideFare converted:", distanceKm, "km /", durationMin, "min");

  const farePrice = getFare(distanceKm, durationMin);

  console.log("farePrice:", farePrice);

  return res.status(200).json({
    message: "Ride fare fetched",
    farePrice,
  });
};

// ── acceptRide ────────────────────────────────────────────────────────────────
const acceptRide = async (req, res) => {
  const { rideId } = req.body;
  if (!rideId) return res.status(400).json({ message: "rideId is required" });

  try {
    const captainId = req.user.id;

    const ride = await rideModel
      .findByIdAndUpdate(
        rideId,
        { status: "accepted", captain: captainId },
        { returnDocument: "after" },
      )
      .populate("user")
      .populate("captain");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-accepted",
        data: ride,
      });
    }

    return res.status(200).json({ message: "Ride accepted", ride });
  } catch (err) {
    console.error("Accept ride error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── startTrip ─────────────────────────────────────────────────────────────────
const startTrip = async (req, res) => {
  const { rideId } = req.body;
  if (!rideId) return res.status(400).json({ message: "rideId is required" });

  try {
    const ride = await rideModel
      .findByIdAndUpdate(rideId, { status: "ongoing" }, { returnDocument: "after" })
      .populate("user");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "trip-started",
        data: ride,
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
        data: ride,
      });
    }

    return res.status(200).json({ message: "Trip completed", ride });
  } catch (err) {
    console.error("Complete trip error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRide,
  getRideFare,
  acceptRide,
  startTrip,
  completeTrip,
};