const jwt = require("jsonwebtoken");

const otpModel = require("../models/otp.model");
const captainModel = require("../models/captain.model");
const {
  generateOtp,
  sendOtpEmail,
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/util");
const sessionModel = require("../models/session.model");

const registerUser = async (req, res) => {
  const {
    firstName,
    lastName,
    password,
    email,
    color,
    plate,
    capacity,
    vehicleType,
  } = req.body;

  try {
    const existingCaptain = await captainModel.findOne({ email });

    if (existingCaptain) {
      return res.status(409).json({
        message: "Captain already exists",
      });
    }

    const captain = await captainModel.create({
      fullName: {
        firstName,
        lastName,
      },
      password,
      email,
      vehicle: {
        color,
        plate,
        capacity,
        vehicleType,
      },
    });

    const OTP = generateOtp();

    await otpModel.create({
      user: captain._id,
      otp: OTP,
      email,
    });

    sendOtpEmail(email, OTP);

    res.status(201).json({
      message: "Captain created successfully",
      captain,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpDoc = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(404).json({
        message: "OTP not found",
      });
    }

    const isExpired = Date.now() - otpDoc.createdAt.getTime() > 5 * 60 * 1000;

    if (isExpired) {
      return res.status(401).json({
        message: "OTP expired",
      });
    }

    const isMatch = await otpDoc.compareOtp(otp);

    if (!isMatch) {
      return res.status(403).json({
        message: "Invalid OTP",
      });
    }

    // BUG FIX: use findByIdAndUpdate with { new: true } so we get the updated
    // document back (verified: true) — same pattern as user.controller
    const captain = await captainModel.findByIdAndUpdate(
      otpDoc.user,
      { verified: true },
      { new: true },
    );

    await otpModel.deleteMany({ email });

    res.status(200).json({
      message: "Captain verified",
      captain, // return captain so frontend can update authUser
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

const resendCaptainOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const captain = await captainModel.findOne({ email });

    if (!captain) {
      return res.status(404).json({
        message: "Captain not found",
      });
    }

    if (captain.verified) {
      return res.status(400).json({
        message: "Captain already verified",
      });
    }

    await otpModel.deleteMany({ email });

    const OTP = generateOtp();

    await otpModel.create({
      user: captain._id,
      otp: OTP,
      email,
    });

    await sendOtpEmail(email, OTP);

    res.status(200).json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

const loginCaptain = async (req, res) => {
  const { email, password } = req.body;

  try {
    const captain = await captainModel.findOne({ email }).select("+password");

    if (!captain) {
      return res.status(404).json({
        message: "Captain not found",
      });
    }

    // BUG FIX: add verified check (same as user login)
    if (!captain.verified) {
      return res.status(401).json({
        message: "Email not verified",
      });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
      return res.status(403).json({
        message: "Invalid credentials",
      });
    }

    const session = await sessionModel.create({
      user: captain._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const refreshToken = await generateRefreshToken(
      captain._id,
      res,
      session._id,
      "captain",
    );
    const accessToken = await generateAccessToken(
      captain._id,
      session._id,
      "captain",
    );

    session.refreshToken = refreshToken;
    await session.save();

    res.status(200).json({
      message: "Captain logged-in successfully",
      captain,
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

// BUG FIX: route was POST but frontend (Axios + checkAuth) calls GET.
// The route in captain_routes.js must be changed to router.get (see fixed routes file).
const rotateToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "RefreshToken not found",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Guard: this endpoint is captain-only. If the token was issued for a
    // user (role !== "captain"), reject immediately with 403 so the frontend
    // probe falls through to the user endpoint correctly.
    if (decoded.role !== "captain") {
      return res.status(403).json({
        message: "Token role mismatch — not a captain token",
      });
    }

    const session = await sessionModel.findOne({
      _id: decoded.sessionId,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "Session not found",
      });
    }

    const isMatch = await session.compareRefreshToken(refreshToken);

    if (!isMatch) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const captain = await captainModel.findById(decoded.id);

    // Guard: the decoded id must resolve to an actual captain document
    if (!captain) {
      return res.status(404).json({
        message: "Captain not found",
      });
    }

    const newRefreshToken = await generateRefreshToken(
      decoded.id,
      res,
      session._id,
      "captain",
    );
    const newAccessToken = await generateAccessToken(
      decoded.id,
      session._id,
      "captain",
    );

    session.refreshToken = newRefreshToken;
    await session.save();

    res.status(200).json({
      message: "New tokens created",
      newAccessToken,
      captain,
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({
      message: "Invalid refreshToken",
    });
  }
};

const logoutUser = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access Token required",
    });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, {
      ignoreExpiration: true,
    });

    const session = await sessionModel.findOne({
      _id: decoded.sessionId,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    session.revoked = true;
    session.refreshToken = null;
    await session.save();

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Captain logged-out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    if (error.name === "JsonWebTokenError") {
      return res
        .status(403)
        .json({ message: "Invalid access token signature" });
    }

    res.status(500).json({
      message: "Internal server error during logout",
    });
  }
};

const logoutAllUsers = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access Token required" });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, {
      ignoreExpiration: true,
    });

    const result = await sessionModel.updateMany(
      { user: decoded.id, revoked: false },
      { revoked: true, refreshToken: null },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "No active sessions found" });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({ message: "All captain sessions logged out" });
  } catch (error) {
    res.status(401).json({ message: "Invalid access token" });
  }
};
const changeAvailability = async (req, res) => {
  try {
    const captain = await captainModel.findById(req.user.id);

    if (!captain) {
      return res.status(404).json({
        message: "Unable to find the captain",
      });
    }

    captain.status = captain.status === "active" ? "inactive" : "active";

    await captain.save();

    return res.status(200).json({
      message: `Captain is now ${captain.status}`,
      status: captain.status,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Database error",
    });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendCaptainOtp,
  loginCaptain,
  rotateToken,
  logoutUser,
  logoutAllUsers,
  changeAvailability,
};
