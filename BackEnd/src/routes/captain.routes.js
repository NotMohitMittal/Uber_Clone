const express = require("express");
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware");
const captainController = require("../controllers/captain.controller");

const router = express.Router();

router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First-name is required")
      .isLength({ min: 3 })
      .withMessage("First-name must be at least 3 characters"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last-name is required")
      .isLength({ min: 3 })
      .withMessage("Last-name must be at least 3 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("color")
      .trim()
      .notEmpty()
      .withMessage("Vehicle color is required")
      .isLength({ min: 3 })
      .withMessage("Invalid color"),
    body("plate")
      .trim()
      .notEmpty()
      .withMessage("Plate number is required")
      .isLength({ min: 3 })
      .withMessage("Invalid plate-number"),
    body("capacity")
      .notEmpty()
      .withMessage("Vehicle capacity is required")
      .isInt({ min: 1 })
      .withMessage("Capacity must be at least 1"),
    body("vehicleType")
      .notEmpty()
      .withMessage("Vehicle type is required")
      .isIn(["car", "motorcycle", "auto"])
      .withMessage("Vehicle type must be car, motorcycle or auto"),
  ],
  authMiddleware.validateUserInput,
  captainController.registerUser,
);

router.post(
  "/verify-email",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
    body("otp").notEmpty().withMessage("OTP is required"),
  ],
  authMiddleware.validateUserInput,
  captainController.verifyEmail,
);

router.post(
  "/resend/otp",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
  ],
  authMiddleware.validateUserInput,
  captainController.resendCaptainOtp,
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  authMiddleware.validateUserInput,
  captainController.loginCaptain,
);

router.get("/refresh-token", captainController.rotateToken);

router.post("/logout", captainController.logoutUser);
router.post("/logout-all", captainController.logoutAllUsers);


router.post("/captain-availability", authMiddleware.validateUserLogin, captainController.changeAvailability)

// logout-all
// get-profile

module.exports = router;
