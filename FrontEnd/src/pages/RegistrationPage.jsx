import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Sun,
  Moon,
  CarFront,
  Palette,
  Hash,
  Users,
  LayoutTemplate,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MultiRoleRegistration() {
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user"); // 'user' or 'captain'

  const { register } = useAuthStore();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    // Captain specific fields
    vehicleType: "car",
    color: "",
    plate: "",
    capacity: 1,
  });

  // Handle global dark mode toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare payload based on role
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    };

    if (role === "captain") {
      Object.assign(payload, {
        vehicleType: formData.vehicleType,
        color: formData.color,
        plate: formData.plate,
        capacity: Number(formData.capacity),
      });
    }

    const result = await register(payload, role);

    if (result.success) {
      toast.success("Registered successfully");

      navigate("/OTP-verification");
    } else {
      toast.error(result.message || "Invalid credentials");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 py-12 transition-colors duration-500 bg-linear-to-br from-blue-50 via-purple-50 to-purple-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 ${isDark ? "dark" : ""}`}
    >
      <div className="relative w-full max-w-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transition-colors duration-300 border border-purple-100 dark:border-slate-700">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="absolute top-6 right-6 p-2 rounded-full bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
              <LayoutTemplate className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Join UBER
          </h2>
          <p className="text-purple-600/80 dark:text-purple-300/80 mt-2 text-sm font-medium">
            Create an account to get started.
          </p>
        </div>

        {/* Role Selector Toggle */}
        <div className="flex p-1.5 bg-gray-100 dark:bg-slate-900/50 rounded-xl mb-8 border border-gray-200 dark:border-slate-700/50">
          <button
            onClick={() => setRole("user")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              role === "user"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm border border-gray-200/50 dark:border-slate-600"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <User className="h-4 w-4" />I want to ride
          </button>
          <button
            onClick={() => setRole("captain")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              role === "captain"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm border border-gray-200/50 dark:border-slate-600"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <CarFront className="h-4 w-4" />I want to drive
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Base User Details */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="space-y-1.5 w-full">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                  <input
                    name="firstName"
                    type="text"
                    required
                    minLength={3}
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none placeholder-gray-400"
                    placeholder="First Name"
                  />
                </div>
              </div>

              <div className="space-y-1.5 w-full">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                  <input
                    name="lastName"
                    type="text"
                    required
                    minLength={3}
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none placeholder-gray-400"
                    placeholder="Last Name"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none placeholder-gray-400"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none placeholder-gray-400"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Captain Specific Details - Conditionally Rendered */}
          <div
            className={`transition-all duration-500 overflow-hidden ${role === "captain" ? "max-h-125 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="pt-6 mt-2 border-t border-purple-100 dark:border-slate-700 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vehicle Details
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                {/* Vehicle Type */}
                <div className="space-y-1.5 w-full">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vehicle Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CarFront className="h-5 w-5 text-purple-400" />
                    </div>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      required={role === "captain"}
                      className="w-full pl-10 pr-4 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none appearance-none"
                    >
                      <option value="car">Car</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="auto">Auto Rickshaw</option>
                    </select>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-1.5 w-full">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Capacity (Seats)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      required={role === "captain"}
                      value={formData.capacity}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none"
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                {/* Color */}
                <div className="space-y-1.5 w-full">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vehicle Color
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Palette className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      name="color"
                      type="text"
                      required={role === "captain"}
                      minLength={3}
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none placeholder-gray-400"
                      placeholder="e.g. White"
                    />
                  </div>
                </div>

                {/* Plate */}
                <div className="space-y-1.5 w-full">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plate Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      name="plate"
                      type="text"
                      required={role === "captain"}
                      minLength={3}
                      value={formData.plate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-purple-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-purple-50/30 dark:bg-slate-700/50 dark:text-white outline-none placeholder-gray-400 uppercase"
                      placeholder="DL 01 AB 1234"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium py-3 rounded-xl transition-colors focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900 shadow-md flex justify-center items-center gap-2"
          >
            {role === "captain" ? (
              <>Register as Captain</>
            ) : (
              <>Register as Rider</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Already registered?{" "}
          <a
            href="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors hover:underline"
          >
            Login here
          </a>
        </div>
      </div>
    </div>
  );
}
