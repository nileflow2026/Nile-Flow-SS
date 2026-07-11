/**
 * AuthContext
 *
 * Enterprise-grade React authentication context.
 * Provides auth state and actions to the entire component tree.
 *
 * Key improvements over previous implementation:
 * - Proper state hydration before rendering protected content
 * - No UI flicker during initialization
 * - Cross-tab state synchronization
 * - Graceful error handling for initialization failures
 * - Proactive token refresh scheduling
 * - Security event logging
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { authService } from './authService';
import { permissionManager, ROLES } from './permissionManager';
import { crossTabSync } from './crossTabSync';
import { normalizeRole } from './authUtils';

const AuthContext = createContext(null);

/**
 * Initialization states:
 * - 'init': Auth is being initialized
 * - 'ready': Auth is initialized and ready
 * - 'error': Initialization failed
 * - 'unauthenticated': No session found, but ready
 */
const INIT_STATES = {
  INIT: 'init',
  READY: 'ready',
  ERROR: 'error',
  UNAUTHENTICATED: 'unauthenticated',
};

export function AuthProvider({ children, onInitialized }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initState, setInitState] = useState(INIT_STATES.INIT);
  const [initializationError, setInitializationError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initDone = useRef(false);

  // ── Initialize auth on mount ─────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      try {
        const session = await authService.initialize();

        if (session.isAuthenticated && session.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          permissionManager.initialize(normalizeRole(session.user.role));
          setInitState(INIT_STATES.READY);
        } else {
          setInitState(INIT_STATES.UNAUTHENTICATED);
        }

        onInitialized?.();
      } catch (err) {
        setInitializationError(err?.message || 'Authentication initialization failed');
        setInitState(INIT_STATES.ERROR);
        onInitialized?.(err);
      }
    };

    // Use requestIdleCallback to avoid blocking initial render
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => init(), { timeout: 2000 });
    } else {
      init();
    }
  }, [onInitialized]);

  // ── Initialize cross-tab sync after auth is ready ────────────
  useEffect(() => {
    if (initState !== INIT_STATES.READY) return;

    crossTabSync.initialize();

    const unsubForceLogout = crossTabSync.onForceLogout(async () => {
      await handleLogout();
    });

    const unsubLogin = crossTabSync.onLogin((data) => {
      // Another tab logged in — update state
      authService.validateSession().then((session) => {
        if (session.isAuthenticated && session.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          permissionManager.initialize(normalizeRole(session.user.role));
        }
      });
    });

    const unsubLogout = crossTabSync.onLogout(() => {
      setUser(null);
      setIsAuthenticated(false);
      permissionManager.reset();
    });

    return () => {
      unsubForceLogout();
      unsubLogin();
      unsubLogout();
    };
  }, [initState]);

  // ── Listen for forced logout ─────────────────────────────────
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setIsAuthenticated(false);
      permissionManager.reset();
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  // ── Auth Actions ─────────────────────────────────────────────

  const handleLogin = useCallback(async (email, password) => {
    const result = await authService.signIn({ email, password });
    if (result.success && result.data?.user) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      permissionManager.initialize(normalizeRole(result.data.user.role));
      crossTabSync.notifyLogin(result.data.user);
    }
    return result;
  }, []);

  const handleSignUp = useCallback(async (email, password, username, phone) => {
    const result = await authService.signUp({ email, password, username, phone });
    if (result.success && result.data?.user) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      permissionManager.initialize(normalizeRole(result.data.user.role));
      crossTabSync.notifyLogin(result.data.user);
    }
    return result;
  }, []);

  const handleLogout = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setIsAuthenticated(false);
    permissionManager.reset();
    crossTabSync.notifyLogout();
  }, []);

  const handleVerifyEmail = useCallback(async (email, code) => {
    return authService.verifyEmail(email, code);
  }, []);

  const handleResendCode = useCallback(async (email) => {
    return authService.resendVerificationCode(email);
  }, []);

  const handleForgotPassword = useCallback(async (email) => {
    return authService.forgotPassword(email);
  }, []);

  const handleResetPassword = useCallback(async (email, token, newPassword) => {
    return authService.resetPassword(email, token, newPassword);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    return authService.signInWithGoogle();
  }, []);

  const handleFacebookSignIn = useCallback(async () => {
    return authService.signInWithFacebook();
  }, []);

  const handleOAuthCallback = useCallback(async (provider, code, state) => {
    const result = await authService.handleOAuthCallback(provider, code, state);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      permissionManager.initialize(normalizeRole(result.user.role));
      crossTabSync.notifyLogin(result.user);
    }
    return result;
  }, []);

  const refreshNow = useCallback(async () => {
    setIsRefreshing(true);
    const { refreshScheduler } = await import('./refreshScheduler');
    const result = await refreshScheduler.refreshNow();
    setIsRefreshing(false);
    return result;
  }, []);

  // ── Memoized context value ───────────────────────────────────
  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading: initState === INIT_STATES.INIT,
      isReady: initState === INIT_STATES.READY || initState === INIT_STATES.UNAUTHENTICATED,
      initializationError,
      isRefreshing,
      signIn: handleLogin,
      signUp: handleSignUp,
      signOut: handleLogout,
      verifyEmail: handleVerifyEmail,
      resendVerificationCode: handleResendCode,
      forgotPassword: handleForgotPassword,
      resetPassword: handleResetPassword,
      signInWithGoogle: handleGoogleSignIn,
      signInWithFacebook: handleFacebookSignIn,
      handleOAuthCallback,
      refreshNow,
      authService,
    }),
    [
      user,
      isAuthenticated,
      initState,
      initializationError,
      isRefreshing,
      handleLogin,
      handleSignUp,
      handleLogout,
      handleVerifyEmail,
      handleResendCode,
      handleForgotPassword,
      handleResetPassword,
      handleGoogleSignIn,
      handleFacebookSignIn,
      handleOAuthCallback,
      refreshNow,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
