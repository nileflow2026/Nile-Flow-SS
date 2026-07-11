/**
 * ProtectedRoute
 *
 * Route guard. Uses <Navigate> with a useRef guard set BEFORE rendering
 * the Navigate component, so it can only trigger navigation exactly once.
 *
 * Props:
 *   children       - Protected content
 *   redirectTo     - Where to redirect (default: /login)
 *   requireAuth    - If true, redirects unauthenticated users
 *   guestOnly      - If true, redirects authenticated users to home
 */

import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Loader from '@shared/ui/loader/Loader';

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requireAuth = false,
  guestOnly = false,
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const decidedRef = useRef(false);

  // Auth still loading → show spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader label="Verifying session…" />
      </div>
    );
  }

  // ── Decision block — runs only ONCE ───────────────────────────
  if (!decidedRef.current) {
    // Set ref BEFORE returning Navigate so next render skips this block
    decidedRef.current = true;

    // Guest-only page + authenticated → redirect home
    if (guestOnly && isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    // Protected page + not authenticated → redirect to login
    if (requireAuth && !isAuthenticated) {
      return <Navigate to={redirectTo} replace />;
    }

    // Neither condition matched → allow rendering (will fall through)
  }

  return children;
}

export default ProtectedRoute;
