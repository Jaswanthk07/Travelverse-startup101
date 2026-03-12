import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import TravelerDashboard from "./pages/TravelerDashboard";
import ContentDashboard from "./pages/ContentDashboard";
import AddLandmark from "./pages/AddLandmark";
import AddEvent from "./pages/AddEvent";
import LandmarkDetails from "./pages/LandmarkDetails";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/traveler"
          element={
            <ProtectedRoute allowedRoles={["traveler"]}>
              <TravelerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/content"
          element={
            <ProtectedRoute allowedRoles={["content-manager"]}>
              <ContentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/content/new"
          element={
            <ProtectedRoute allowedRoles={["content-manager"]}>
              <AddLandmark />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/content/events/new"
          element={
            <ProtectedRoute allowedRoles={["content-manager"]}>
              <AddEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/content/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["content-manager"]}>
              <AddLandmark />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landmark/:id"
          element={
            <ProtectedRoute>
              <LandmarkDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
