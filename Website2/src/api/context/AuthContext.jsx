/**
 * AuthContext
 *
 * React bridge to AuthManager. Provides auth state and actions to the component tree.
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
import { authManager } from '@api/auth/AuthManager';
import { initializeApi } from '@api/client/index';

const AuthContext = createContext(null);

export function AuthProvider({ children, onInitialized }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState(null);
  const initDone = useRef(false);

  // ── Initialize API + restore session ─────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      setIsLoading(true);
      try {
        const session = await initializeApi({ validateSession: true });
        if (session.isAuthenticated && session.user) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
        onInitialized?.();
      } catch (err) {
        setInitializationError(err?.message || 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [onInitialized]);

  // ── Listen for forced logout from interceptors ────────────────
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // ── Auth actions ──────────────────────────────────────────────

  const signIn = useCallback(async (email, password, rememberMe = false) => {
    const result = await authManager.signIn({ email, password, rememberMe });
    if (result.success && result.data?.user) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const signUp = useCallback(async (email, password, username, phone) => {
    const result = await authManager.signUp({ email, password, username, phone });
    if (result.success && result.data?.user) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await authManager.signOut();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return authManager.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (email, token, newPassword) => {
    return authManager.resetPassword(email, token, newPassword);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return authManager.signInWithGoogle();
  }, []);

  const signInWithFacebook = useCallback(async () => {
    return authManager.signInWithFacebook();
  }, []);

  const handleOAuthCallback = useCallback(async (provider, code, state) => {
    const result = await authManager.handleOAuthCallback(provider, code, state);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const verifyEmail = useCallback(async (email, verificationCode) => {
    return authManager.verifyEmail(email, verificationCode);
  }, []);

  const resendVerificationCode = useCallback(async (email) => {
    return authManager.resendVerificationCode(email);
  }, []);

  // ── Memoized context value ────────────────────────────────────

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      initializationError,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      resetPassword,
      signInWithGoogle,
      signInWithFacebook,
      handleOAuthCallback,
      verifyEmail,
      resendVerificationCode,
      authManager,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      initializationError,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      resetPassword,
      signInWithGoogle,
      signInWithFacebook,
      handleOAuthCallback,
      verifyEmail,
      resendVerificationCode,
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
