const jwt = require("jsonwebtoken");
const sendEmail = require("../services/email.service");

const generateAccessToken = async (userId, sessionId = null, role = "user") => {
  return jwt.sign(
    {
      id: userId,
      sessionId: sessionId,
      role: role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
};

const generateRefreshToken = async (
  userId,
  res,
  sessionId = null,
  role = "user",
) => {
  const refreshToken = jwt.sign(
    {
      id: userId,
      sessionId: sessionId,
      role: role,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: (process.env.NODE_ENV = "production"),
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return refreshToken;
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (email, otp) => {
  const subject = "Verify Your Email";

  const text = `
Your OTP for email verification is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this, please ignore this email.
`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
    
    <h2 style="color: #333; text-align: center;">
      Email Verification
    </h2>

    <p style="font-size: 16px; color: #555;">
      Hello,
    </p>

    <p style="font-size: 16px; color: #555;">
      Your One-Time Password (OTP) for email verification is:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <span style="
        display: inline-block;
        padding: 15px 30px;
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 5px;
        color: #ffffff;
        background-color: #4f46e5;
        border-radius: 8px;
      ">
        ${otp}
      </span>
    </div>

    <p style="font-size: 15px; color: #777;">
      This OTP will expire in <strong>5 minutes</strong>.
    </p>

    <p style="font-size: 15px; color: #777;">
      If you did not request this verification, you can safely ignore this email.
    </p>

    <hr style="margin: 30px 0;" />

    <p style="font-size: 13px; color: #999; text-align: center;">
      © 2026 UBER . All rights reserved.
    </p>
  </div>
  `;

  await sendEmail(email, subject, text, html);
};

const sendRideOtpEmail = async (email, otp) => {
  const subject = "Your Ride PIN - Secure your trip";
  const text = `
Your ride is confirmed!
Please provide this secure PIN to your captain when they arrive to start your trip: ${otp}

Safety Tip: Never share this PIN before the captain arrives and you have verified the vehicle details.

If you did not request this ride, please contact support immediately.
`;

  const html = `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f7f9fa; padding: 30px; border-radius: 16px;">
    
    <div style="background-color: #000000; padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
      <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">
        Ride Confirmed 🚗
      </h2>
    </div>

    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 16px; color: #333333; margin-top: 0;">
        Hello,
      </p>
      <p style="font-size: 16px; color: #555555; line-height: 1.6;">
        Your captain is on the way! To ensure your safety and verify your ride, please provide the following secure PIN to your captain when you enter the vehicle.
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">
          Your Secure Ride PIN
        </span>
        <br/>
        
        <div style="margin-top: 12px; margin-bottom: 12px;">
          <span style="
            display: inline-block;
            padding: 18px 40px;
            font-size: 38px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #ffffff;
            background: linear-gradient(135deg, #111111 0%, #444444 100%);
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            /* The magic CSS that makes tap-to-copy work */
            user-select: all;
            -webkit-user-select: all;
            -moz-user-select: all;
            cursor: pointer;
          " title="Click to highlight and copy">
            ${otp}
          </span>
        </div>

      </div>

      <div style="background-color: #f0f4f8; padding: 18px; border-left: 4px solid #000000; border-radius: 6px; margin-top: 30px;">
        <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.5;">
          <strong style="color: #000000;">🛡️ Safety Tip:</strong> Never share this PIN with the captain over the phone. Only provide it once you are at the vehicle and have verified the license plate.
        </p>
      </div>
      
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <p style="font-size: 13px; color: #999999;">
        Have a safe trip!
      </p>
      <p style="font-size: 12px; color: #bbbbbb;">
        © 2026 UBER. All rights reserved.
      </p>
    </div>

  </div>
  `;

  await sendEmail(email, subject, text, html);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateOtp,
  sendOtpEmail,
  sendRideOtpEmail,
};
