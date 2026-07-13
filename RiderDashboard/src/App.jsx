// In your App.jsx or main routing file
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { RiderAuthProvider } from "./Context/RiderAuthContext";
import { RiderProtectedRoute, PublicOnlyRoute } from "./auth/RouteGuards";
import RiderLogin from "./Pages/RiderLogin";
import RiderRegister from "./Pages/RiderRegister";
import RiderDashboard from "./Pages/RiderDashboard";
import { LocationTracker } from "./Pages/LocationTracker";
import UpdateNotifier from "./components/UpdateNotifier";

function App() {
  return (
    <Router>
      <RiderAuthProvider>
        <Routes>
          {/* Root redirect */}

          <Route path="/" element={<Navigate to="/rider/login" replace />} />

          {/* Public Rider Routes — wrapped with PublicOnlyRoute to prevent 
              authenticated riders from seeing login/register pages */}
          <Route
            path="/rider/login"
            element={
              <PublicOnlyRoute>
                <RiderLogin />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/rider/register"
            element={
              <PublicOnlyRoute>
                <RiderRegister />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Rider Routes */}
          <Route
            path="/rider/dashboard"
            element={
              <RiderProtectedRoute>
                <RiderDashboard />
              </RiderProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/rider/login" replace />} />
        </Routes>

        {/* Background components */}
        <LocationTracker />
        <UpdateNotifier />
      </RiderAuthProvider>
    </Router>
  );
}

export default App;
