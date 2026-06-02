import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  CarFront,
} from "lucide-react";
import { useAuthStore } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState("user"); // "user" or "captain"
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { loginUser } = useAuthStore();

  const isCaptain = loginMode === "captain";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await loginUser(formData, loginMode);
    console.log(result);

    setIsLoading(false);

    if (result.success) {
      toast.success("Logged in successfully");

      // Route the user to their respective dashboard
      if (loginMode === "captain") {
        navigate("/captain-dashboard"); // Make sure this route exists in App.jsx!
      } else {
        navigate("/");
      }
    } else {
      toast.error(result.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090C15] font-sans relative overflow-hidden p-4">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 3px), linear-gradient(90deg, #ffffff 1px, transparent 3px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Dynamic Background Glow Effects */}
      <div
        className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${
          isCaptain ? "bg-emerald-600/20" : "bg-purple-600/20"
        }`}
      />
      <div
        className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${
          isCaptain ? "bg-teal-600/10" : "bg-blue-600/10"
        }`}
      />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#131826]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/80 p-8 z-10 relative">
        {/* Role Toggle Switch */}
        <div className="flex p-1 mb-8 bg-[#0B0F19] rounded-xl border border-slate-800 relative">
          <button
            type="button"
            onClick={() => setLoginMode("user")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 z-10 ${
              !isCaptain ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <User className="h-4 w-4" />
            Rider
          </button>
          <button
            type="button"
            onClick={() => setLoginMode("captain")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 z-10 ${
              isCaptain ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <CarFront className="h-4 w-4" />
            Captain
          </button>

          {/* Animated Slider Background */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out ${
              isCaptain
                ? "translate-x-full bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "translate-x-0 bg-purple-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            }`}
            style={{ left: "4px" }}
          />
        </div>

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className={`p-3 border rounded-2xl mb-4 transition-colors duration-500 ${
              isCaptain
                ? "bg-emerald-600/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-500"
                : "bg-purple-600/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-purple-500"
            }`}
          >
            {isCaptain ? (
              <CarFront className="h-8 w-8" />
            ) : (
              <User className="h-8 w-8" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight transition-all">
            {isCaptain ? "Captain Portal" : "Welcome back"}
          </h2>
          <p className="text-slate-400 text-sm">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div
              className={`relative flex items-center bg-[#0B0F19] rounded-xl p-1.5 border border-slate-800 focus-within:ring-1 transition-all ${
                isCaptain
                  ? "focus-within:ring-emerald-500 focus-within:border-emerald-500/50"
                  : "focus-within:ring-purple-500 focus-within:border-purple-500/50"
              }`}
            >
              <div className="p-2.5 bg-[#131826] rounded-lg text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent border-none focus:ring-0 text-sm px-3 text-white placeholder-slate-600 outline-none"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <a
                href="#forgot"
                className={`text-xs font-medium transition-colors ${
                  isCaptain
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-purple-400 hover:text-purple-300"
                }`}
              >
                Forgot password?
              </a>
            </div>
            <div
              className={`relative flex items-center bg-[#0B0F19] rounded-xl p-1.5 border border-slate-800 focus-within:ring-1 transition-all ${
                isCaptain
                  ? "focus-within:ring-emerald-500 focus-within:border-emerald-500/50"
                  : "focus-within:ring-purple-500 focus-within:border-purple-500/50"
              }`}
            >
              <div className="p-2.5 bg-[#131826] rounded-lg text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent border-none focus:ring-0 text-sm px-3 text-white placeholder-slate-600 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none pr-3"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 mt-6 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group bg-linear-to-r ${
              isCaptain
                ? "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            }`}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className={`font-semibold transition-colors ${
                isCaptain
                  ? "text-white hover:text-emerald-400"
                  : "text-white hover:text-purple-400"
              }`}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
