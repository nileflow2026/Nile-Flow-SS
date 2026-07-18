/**
 * PrivateRoute (Legacy shim)
 * Redirects to the new RouteGuard-based implementation.
 * Kept for backward compatibility.
 */
import React from "react";
import { RouteGuard } from "../core/auth";

export default function PrivateRoute({
  children,
  component: Component,
  ...rest
}) {
  if (Component) {
    return (
      <RouteGuard>
        <Component {...rest} />
      </RouteGuard>
    );
  }

  return <RouteGuard>{children}</RouteGuard>;
}
