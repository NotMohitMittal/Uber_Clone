const { sendMessageToSocketId } = require("../../socket");
const rideModel = require("../models/ride.model");
const userModel = require("../models/user.model");
const {
  getCaptainsInTheRadius,
  getAddressCoordinate,
  getDistanceTime,
} = require("../services/map.service");
const { generateOtp, sendRideOtpEmail } = require("../utils/util");

const getFare = (distance, duration) => {
  const fareConfig = {
    car: { baseFare: 60, perKm: 18, perMinute: 2.5 },
    auto: { baseFare: 35, perKm: 11, perMinute: 1.5 },
    motorcycle: { baseFare: 25, perKm: 8, perMinute: 1 },
  };

  const calculatedFares = {};

  console.log( "From get-fare : ", distance, duration)

  // SO THE GOOGLE MAPS SENDS THE LOCATION/DISTANCE FROM THE RIDER TO DRIVER IN METERS AND SECONDS SO LATER -
  // IN THE FUTURE YOU HAVE TO FIX THESE BELOW DETAILS CAUSE THEY ARE IN "KM" & "MINUTES" DIRECTLY.

  for (const vehicle in fareConfig) {
    const config = fareConfig[vehicle];
    const totalFare =
      config.baseFare + distance * config.perKm + duration * config.perMinute;
    calculatedFares[vehicle] = Math.round(totalFare);
  }

  return calculatedFares;
};

const createRide = async (req, res) => {
  const { pickup, destination, vehicleType } = req.body;

  try {
    // Google Distance Matrix returns distance in metres and duration in seconds.
    // getFare() expects km and minutes, so we convert here.
    const distanceTimeData = await getDistanceTime(pickup, destination);
    const distanceKm = distanceTimeData.distance.value / 1000; // m  → km
    const durationMin = distanceTimeData.duration.value / 60; // s  → min

    const allFares = getFare(distanceKm, durationMin);
    const fare = allFares[vehicleType];

    console.log(fare);

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
      distance: distanceTimeData.distance.value,
      duration: distanceTimeData.duration.value,
      otp,
    });




    const pickupCoordinates = await getAddressCoordinate(pickup);
    const captainsInRange = await getCaptainsInTheRadius(
      pickupCoordinates.lat,
      pickupCoordinates.lng,
      1000, // radius in kms
    );

    console.log( "Captain in Range: ", captainsInRange);

    const rideWithUser = await rideModel.findById(ride._id).populate("user");

    // 2. Emit the 'new-ride' event to every captain in radius!
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
    res.status(500).json({
      message: "Database error",
    });
  }
};

const getRideFare = async (req, res) => {
  const { distance, duration } = req.query;

  const farePrice = getFare(distance, duration);

  console.log(farePrice);
  return res.status(200).json({
    message: "Ride fare fetched",
    farePrice,
  });
};

// ── Accept Ride ──────────────────────────────────────────────────────────────
// Called by captain when they tap Accept. Marks ride "accepted" and saves captain.
const acceptRide = async (req, res) => {
  const { rideId } = req.body;
  if (!rideId) return res.status(400).json({ message: "rideId is required" });

  try {
    const captainId = req.user.id; // captain is authenticated

    const ride = await rideModel
      .findByIdAndUpdate(
        rideId,
        { status: "accepted", captain: captainId },
        { new: true },
      )
      .populate("user")
      .populate("captain");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Notify user that their ride was accepted (socket emit from frontend handles this,
    // but we also emit here so the user's app updates if the tab is open)
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

// ── Start Trip ────────────────────────────────────────────────────────────────
// Called when captain picks up the passenger and starts the trip.
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
        data: ride,
      });
    }

    return res.status(200).json({ message: "Trip started", ride });
  } catch (err) {
    console.error("Start trip error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


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
