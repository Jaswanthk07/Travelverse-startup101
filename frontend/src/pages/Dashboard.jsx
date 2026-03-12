import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "content-manager") {
    return <Navigate to="/dashboard/content" replace />;
  }

  return <Navigate to="/dashboard/traveler" replace />;
}

export default Dashboard;
