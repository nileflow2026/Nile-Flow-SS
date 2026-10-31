import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import App from "./App";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import NotificationsPage from "./Pages/NotificationsPage";
/* import { Toaster } from 'sonner'; */
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./core/auth";
import { RouteGuard } from "./core/auth";
import LanguageSettings from "./Pages/LanguageSettings";
import UserPage from "./Pages/UserPage";
import Users from "./Pages/Users";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <AuthProvider>
      <ThemeProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* Default path redirects to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Login is the only public account route. */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/register"
            element={<Navigate to="/login" replace />}
          />

          {/* Protected routes with RouteGuard — no flash of protected content */}
          <Route
            path="/dashboard"
            element={
              <RouteGuard>
                <Dashboard />
              </RouteGuard>
            }
          />

          <Route
            path="/NotificationsPage"
            element={
              <RouteGuard>
                <NotificationsPage />
              </RouteGuard>
            }
          />
          <Route
            path="/language-settings"
            element={
              <RouteGuard>
                <LanguageSettings />
              </RouteGuard>
            }
          />
          <Route
            path="/users"
            element={
              <RouteGuard requiredResource="users" requiredAction="view">
                <Users />
              </RouteGuard>
            }
          />
          <Route
            path="/users/:userId"
            element={
              <RouteGuard requiredResource="users" requiredAction="view">
                <UserPage />
              </RouteGuard>
            }
          />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  </Router>,
);
