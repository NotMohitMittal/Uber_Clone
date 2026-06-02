import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import RegistrationPage from "./pages/RegistrationPage";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import RideBookingPage from "./pages/RideBookingPage";
import ProtectedRoute from "./components/ProtectedRoutes";
import LoginPage from "./pages/LoginPage";
import NonProtectedRoute from "./components/NonProtectedRoute";
import OTPVerificationPage from "./pages/OTPVerificationPage";
import { useAuthStore } from "./context/UserContext";
import UserProfile from "./pages/UserProfile";
import ComingSoonPage from "./pages/ComingSoonPage";
import CaptainDashboard from "./pages/CaptainDashboard";
import NotFoundPage from "./pages/PageNotFound";
import ActiveRide from "./pages/ActiveRide";
import { useSocketStore } from "./context/SocketContext";

const App = () => {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      connectSocket(authUser);
    } else {
      disconnectSocket();
    }

    // Cleanup on unmount
    return () => disconnectSocket();
  }, [authUser, connectSocket, disconnectSocket]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#090C15]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route path="/OTP-verification" element={<OTPVerificationPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain-dashboard"
          element={
            <ProtectedRoute>
              <CaptainDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/register"
          element={
            <NonProtectedRoute>
              <Navbar />
              <RegistrationPage />
            </NonProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={
            <NonProtectedRoute>
              <LoginPage />
            </NonProtectedRoute>
          }
        />

        <Route
          path="/ride-booking"
          element={
            <ProtectedRoute>
              <RideBookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <ComingSoonPage featureName="Billing-system" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ComingSoonPage featureName="Settings-page" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/security"
          element={
            <ProtectedRoute>
              <ComingSoonPage featureName="Security-page" />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />

        <Route
          path="/active-ride"
          element={
            <ProtectedRoute>
              <ActiveRide />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
