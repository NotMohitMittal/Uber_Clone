import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Edit3,
  Key,
  AlertTriangle,
  Activity,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../context/UserContext";

export default function UserProfile() {
  const { authUser, resendOTP } = useAuthStore();
  const navigate = useNavigate();

  // Fallback data in case the store is loading or empty during dev
  const profileData = {
    firstName: authUser?.fullName?.firstName || authUser?.firstName || "Aria",
    lastName: authUser?.fullName?.lastName || authUser?.lastName || "Mehta",
    email: authUser?.email || "aria.mehta@example.com",
    verified: authUser?.verified ?? true,
    joined: authUser?.createdAt
      ? new Date(authUser.createdAt).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })
      : "October 2023",
  };

  const initials =
    `${profileData.firstName[0]}${profileData.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen w-full bg-[#090C15] text-white font-sans p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto mb-8">
        {/* Go Back Button */}
        <button
          onClick={() => navigate(-1)} // Goes back to the previous page in history
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group w-fit focus:outline-none"
        >
          <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/5 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Go Back</span>
        </button>

        {/* Page Header */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          My Profile
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="max-w-4xl mx-auto bg-[#131826]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden relative z-10">
        {/* Decorative Banner */}
        <div className="h-32 w-full bg-linear-to-r from-indigo-900/40 via-purple-900/40 to-blue-900/40 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
        </div>

        {/* Profile Info Section */}
        <div className="px-6 sm:px-10 pb-10">
          {/* Avatar & Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-8 gap-4">
            <div className="flex items-end gap-5">
              <div className="h-24 w-24 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 p-1 shadow-xl shadow-purple-900/20">
                <div className="h-full w-full bg-[#131826] rounded-xl flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold tracking-wider">
                  {initials}
                </div>
              </div>
              <div className="pb-1">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {profileData.firstName} {profileData.lastName}
                  {profileData.verified && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />
                  )}
                </h2>
                <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profileData.email}
                </p>
              </div>
            </div>

            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-white w-full sm:w-auto">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Form Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">First Name</label>
                    <div className="flex items-center bg-[#131826] rounded-xl p-3 border border-slate-800">
                      <User className="h-4 w-4 text-slate-500 mr-3" />
                      <span className="text-sm text-slate-200">
                        {profileData.firstName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Last Name</label>
                    <div className="flex items-center bg-[#131826] rounded-xl p-3 border border-slate-800">
                      <User className="h-4 w-4 text-slate-500 mr-3" />
                      <span className="text-sm text-slate-200">
                        {profileData.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs text-slate-500">
                      Email Address
                    </label>
                    <div className="flex items-center bg-[#131826] rounded-xl p-3 border border-slate-800">
                      <Mail className="h-4 w-4 text-slate-500 mr-3" />
                      <span className="text-sm text-slate-200">
                        {profileData.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Controls */}
              <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">
                    Password & Security
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update your password to keep your account secure.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto justify-center shrink-0">
                  <Key className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            </div>

            {/* Right Column: Status & Activity Widgets */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  Account Status
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      Member Since
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                      {profileData.joined}
                    </span>
                  </div>

                  <div className="h-px w-full bg-slate-800/50" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-slate-500" />
                      Verification
                    </span>
                    {console.log(authUser.verified)}
                    {profileData.verified ? (
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {!profileData.verified && (
                  <button
                    onClick={() => {
                      resendOTP();
                      navigate("/OTP-verification");
                    }}
                    className="w-full mt-5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    Verify Account Now
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-linear-to-br from-indigo-600/10 to-purple-600/10 rounded-2xl p-6 border border-indigo-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-bold text-indigo-100">
                    Ride Activity
                  </h3>
                </div>
                <p className="text-3xl font-bold text-white mt-3">248</p>
                <p className="text-xs text-indigo-300/70 mt-1">
                  Total trips completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
