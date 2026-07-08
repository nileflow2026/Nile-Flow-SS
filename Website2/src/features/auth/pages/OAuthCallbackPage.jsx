/**
 * OAuthCallbackPage
 *
 * Handles OAuth redirect callback from Google/Facebook.
 * This page is reached when the redirect flow is used
 * (popup was blocked or unavailable). The popup flow
 * communicates via postMessage and never reaches this page.
 *
 * States handled:
 * - Processing (loading spinner)
 * - Success (auto-redirect after 2s)
 * - Error (user-friendly message + retry button)
 * - User cancelled popup (returned to login)
 * - Popup blocked (fallback redirect in progress)
 * - OAuth provider error (Google returned an error)
 */

import { useEffect, useReducer, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Loader from '@shared/ui/loader/Loader'
import Alert from '@shared/ui/alert/Alert'
import { oauthBridge } from '@auth/oauthBridge'
import { useAuth } from '@auth/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const STATES = {
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
  LINKING: 'linking',
};

const initialState = {
  status: STATES.PROCESSING,
  error: '',
  message: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status, error: action.error || '', message: action.message || '' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const processedRef = useRef(false);

  const processCallback = useCallback(async () => {
    if (processedRef.current) return;
    processedRef.current = true;

    // Check for OAuth error parameter (e.g., user denied consent)
    const errorParam = searchParams.get('error');
    const errorDesc = searchParams.get('error_description') || searchParams.get('error_description');

    if (errorParam) {
      const messages = {
        'access_denied': 'You declined the sign-in request. Please try again to continue.',
        'consent_required': 'Permission was denied. Please allow access to sign in.',
        'interaction_required': 'Additional interaction is required to complete sign-in.',
        'login_required': 'Please sign in with your Google account to continue.',
      };
      dispatch({
        type: 'SET_STATUS',
        status: STATES.ERROR,
        error: messages[errorParam] || `${errorDesc || errorParam.replace(/_/g, ' ')}. Please try again.`,
      });
      return;
    }

    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const provider = searchParams.get('provider') || 'google';

    if (!code) {
      // No code and no error — might be a direct navigation to this page
      dispatch({
        type: 'SET_STATUS',
        status: STATES.ERROR,
        error: 'No authentication data received. Please sign in again.',
      });
      return;
    }

    // Process the OAuth callback via the bridge
    const result = await oauthBridge.handleCallback(code, stateParam, provider);

    if (result.success) {
      dispatch({
        type: 'SET_STATUS',
        status: STATES.SUCCESS,
        message: `Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
      });
      // Redirect to home after a brief success display
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } else {
      dispatch({
        type: 'SET_STATUS',
        status: STATES.ERROR,
        error: result.error || `${provider} sign-in failed. Please try again.`,
      });
    }
  }, [searchParams, navigate, signIn]);

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-20 sm:px-6 lg:py-28">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8 text-center">
          <AnimatePresence mode="wait">
            {state.status === STATES.PROCESSING && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg className="h-7 w-7 animate-spin text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                  Signing in
                </p>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Completing authentication
                </h1>
                <div className="mt-6">
                  <Loader label="Please wait while we securely connect your account…" />
                </div>
              </motion.div>
            )}

            {state.status === STATES.ERROR && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600 dark:text-red-400">
                  Sign-in failed
                </p>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Something went wrong
                </h1>
                <div className="mt-4">
                  <Alert
                    title="Unable to sign in with Google"
                    description={state.error}
                    tone="warning"
                  />
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <PrimaryButton className="w-full justify-center" onClick={() => navigate('/login')}>
                    Back to sign in
                  </PrimaryButton>
                  <Link to="/signup" className="text-sm font-semibold text-emerald-600 hover:text-amber-600 dark:text-emerald-400">
                    Create an account instead
                  </Link>
                </div>
              </motion.div>
            )}

            {state.status === STATES.SUCCESS && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                  Welcome
                </p>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Signed in successfully!
                </h1>
                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
                  {state.message}. Redirecting you…
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageShell>
  )
}

export default OAuthCallbackPage
