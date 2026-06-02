import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { useAuthStore } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  const navigate = useNavigate();

  const { verifyOTP, resendOTP, authUser } = useAuthStore();

  // Safety Check: If user refreshes the page and loses state, send them back to login
  useEffect(() => {
    if (!authUser) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
    }
  }, [authUser, navigate]);

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    if (timer === 0) return; // Stop the interval when it hits 0

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const pastedArray = pastedData.split("");
      setOtp(pastedArray);
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length < 6) return;

    setIsLoading(true);

    try {
      const userRole = authUser?.role || "user";

      const result = await verifyOTP(otpValue, userRole);

      if (result.success) {
        toast.success("OTP verified successfully");
        if (userRole === "captain") {
          navigate("/captain-dashboard");
        } else {
          navigate("/");
        }
      } else {
        toast.error(result.message || "Invalid OTP");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setTimer(30);
    inputRefs.current[0].focus();

    await resendOTP();
    toast.success("OTP resent");
  };

  // If authUser is null, don't try to render the rest of the page to prevent a crash
  if (!authUser) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090C15] font-sans relative overflow-hidden p-4">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Verification Card */}
      <div className="w-full max-w-md bg-[#131826]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/80 p-8 z-10 relative">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl mb-6 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <ShieldCheck className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Enter Verification Code
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            We've sent a 6-digit one time password to <br />
            {/* Added Optional Chaining here to prevent crashes */}
            <span className="font-medium text-white"> {authUser?.email} </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* OTP Input Fields */}
          <div
            className="flex justify-between gap-2 sm:gap-3"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold text-white bg-[#0B0F19] border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-inner"
                autoComplete="off"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join("").length < 6}
            className="w-full py-4 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Verify Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Resend Section */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm text-slate-400">Didn't receive the code?</p>

          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors focus:outline-none ${
              timer > 0
                ? "text-slate-500 cursor-not-allowed"
                : "text-purple-400 hover:text-purple-300"
            }`}
          >
            <RefreshCw
              className={`h-4 w-4 ${timer === 0 ? "group-hover:rotate-180 transition-transform duration-500" : ""}`}
            />
            {timer > 0
              ? `Resend code in 00:${timer.toString().padStart(2, "0")}`
              : "Resend Code Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
