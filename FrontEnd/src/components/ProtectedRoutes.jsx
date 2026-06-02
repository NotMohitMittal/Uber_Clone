import { Navigate } from "react-router-dom";
import { useAuthStore } from "../context/UserContext";
import { useCaptainStore } from "../context/CaptainContext";

const ProtectedRoute = ({ children }) => {
  const { authUser } = useAuthStore();
  // BUG FIX: useCaptainStore is now a hook (function), so call it as one
  const { authCaptain } = useCaptainStore();

  if (!authUser && !authCaptain) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;