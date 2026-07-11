/**
 * ProtectedRoute (Legacy shim)
 * Redirects to the new RouteGuard-based implementation.
 * Kept for backward compatibility — prefer importing from "@/core/auth/RouteGuard" directly.
 */
import React from "react";
import { useAuth } from "../core/auth";
import { RouteGuard } from "../core/auth";

export const ProtectedRoute = ({ children }) => {
  return <RouteGuard>{children}</RouteGuard>;
};

export default ProtectedRoute;
