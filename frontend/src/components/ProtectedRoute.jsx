import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, isReady, user } = useAuth();

  if (!isReady) {
    return (
      <main className="section-shell flex min-h-[60vh] items-center justify-center">
        <div className="glass-panel rounded-[1.5rem] px-6 py-4 text-sm text-slate-300">
          Loading TravelVerse...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
