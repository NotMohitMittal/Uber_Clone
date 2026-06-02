import { Navigate } from "react-router-dom";
import { useAuthStore } from "../context/UserContext";

const NonProtectedRoute = ({ children }) => {
  const { authUser } = useAuthStore();

  if (authUser) {
    const destination =
      authUser.role === "captain" ? "/captain-dashboard" : "/";
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default NonProtectedRoute;
