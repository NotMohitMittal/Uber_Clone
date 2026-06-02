const jwt = require("jsonwebtoken");

const otpModel = require("../models/otp.model");
const sessionModel = require("../models/session.model");
const userModel = require("../models/user.model");
const {
  generateOtp,
  sendOtpEmail,
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/util");

const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Existing user",
      });
    }

    const user = await userModel.create({
      fullName: {
        firstName,
        lastName,
      },
      email,
      password,
    });

    // creating the OTP and saving into the db
    const OTP = generateOtp();

    await otpModel.create({
      user: user._id,
      otp: OTP,
      email,
    });

    sendOtpEmail(email, OTP);

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

const verifyEmail = async (req, res) => {
  const { otp, email } = req.body;

  try {
    const otpDoc = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // checks if the otp has passed the creating time greater than 5 minutes
    const isExpired = Date.now() - otpDoc.createdAt.getTime() > 5 * 60 * 1000;

    if (isExpired) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    const isMatch = await otpDoc.compareOtp(otp);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, {
      verified: true,
    });

    await otpModel.deleteMany({ email });

    res.status(200).json({
      message: "User verified",
      user, // resending this again because it's containing the [ verified: true ] for user rather than false
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

const resendUserOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }

    await otpModel.deleteMany({ email });

    const OTP = generateOtp();

    await otpModel.create({
      user: user._id,
      otp: OTP,
      email,
    });

    await sendOtpEmail(email, OTP);

    res.status(200).json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.verified) {
      return res.status(401).json({
        message: "Email not verified",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    const session = await sessionModel.create({
      user: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const refreshToken = await generateRefreshToken(
      user._id,
      res,
      session._id,
      "user",
    );
    const accessToken = await generateAccessToken(
      user._id,
      session._id,
      "user",
    );

    session.refreshToken = refreshToken;
    await session.save();

    res.status(200).json({
      message: "User logged-in successfully",
      user,
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database error",
    });
  }
};

const rotateToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(404).json({
      message: "RefreshToken not found",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Guard: reject captain tokens hitting the user endpoint — mirrors the
    // same check in captain rotateToken. This ensures the frontend probe
    // in checkAuth gets a clean 403 and doesn't accidentally log a captain
    // in as a user (or vice-versa).
    if (decoded.role !== "user") {
      return res.status(403).json({
        message: "Token role mismatch — not a user token",
      });
    }

    const session = await sessionModel.findOne({
      _id: decoded.sessionId,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "No login sessions found",
      });
    }

    const isMatch = await session.compareRefreshToken(refreshToken);

    if (!isMatch) {
      return res.status(403).json({
        message: "Valid session not found",
      });
    }

    const newAccessToken = await generateAccessToken(
      decoded.id,
      session._id,
      "user",
    );
    const newRefreshToken = await generateRefreshToken(
      decoded.id,
      res,
      session._id,
      "user",
    );

    session.refreshToken = newRefreshToken;
    await session.save();

    const user = await userModel.findOne({ _id: decoded.id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Tokens refreshed",
      accessToken: newAccessToken,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({
      message: "Invalid refreshToken",
    });
  }
};

const getUserProfile = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, {
      ignoreExpiration: false,
    });

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User-profile fetched: ",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({
      message: "Invalid access Token",
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
      message: "User logged-out successfully",
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
    return res.status(401).json({
      message: "Access Token required",
    });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, {
      ignoreExpiration: true,
    });

    const result = await sessionModel.updateMany(
      {
        user: decoded.id,
        revoked: false,
      },
      {
        revoked: true,
        refreshToken: null,
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        message: "No active sessions found",
      });
    }

    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "All accounts logged-out successfully",
    });
  } catch (error) {
    res.status(401).json({
      message: "Invalid access token",
    });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendUserOtp,
  loginUser,
  rotateToken,
  getUserProfile,
  logoutUser,
  logoutAllUsers,
};