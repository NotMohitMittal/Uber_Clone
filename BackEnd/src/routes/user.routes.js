const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express();

router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 3 })
      .withMessage("first-name must be at least 3 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 3 })
      .withMessage("last-name must be at least 3 characters"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Minimum 6 characters"),
  ],
  authMiddleware.validateUserInput,
  userController.registerUser,
);

router.post(
  "/verify-email",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
    body("otp").notEmpty().withMessage("OTP is required"),
  ],
  authMiddleware.validateUserInput,
  userController.verifyEmail,
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
  userController.resendUserOtp,
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Minimum 6 characters"),
  ],
  authMiddleware.validateUserInput,
  userController.loginUser,
);

router.get("/refresh-token", userController.rotateToken);

router.get("/profile", userController.getUserProfile);

router.post("/logout", userController.logoutUser);
router.post("/logout-all", userController.logoutAllUsers);



module.exports = router;
