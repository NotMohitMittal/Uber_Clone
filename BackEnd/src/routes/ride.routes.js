const express = require("express");
const { body, query } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware");
const rideController = require("../controllers/ride.controller");

const router = express.Router();

router.post(
  "/create-ride",
  [
    body("pickup").notEmpty().withMessage("Pickup is required"),
    body("destination").notEmpty().withMessage("Destination is required"),
    body("vehicleType")
      .isIn(["car", "auto", "motorcycle"])
      .withMessage("Invalid vehicle type"),
  ],
  authMiddleware.validateUserInput,
  authMiddleware.validateUserLogin,
  rideController.createRide,
);

router.get(
  "/ride-fare",
  [
    query("distance").notEmpty().isNumeric().withMessage("Invalid distance"),
    query("duration").notEmpty().isNumeric().withMessage("Invalid duration"),
  ],
  authMiddleware.validateUserInput,
  authMiddleware.validateUserLogin,
  rideController.getRideFare,
);

router.post(
  "/accept",
  authMiddleware.validateUserLogin,
  rideController.acceptRide,
);
router.post(
  "/start",
  authMiddleware.validateUserLogin,
  rideController.startTrip,
);
router.post(
  "/complete",
  authMiddleware.validateUserLogin,
  rideController.completeTrip,
);

module.exports = router;
