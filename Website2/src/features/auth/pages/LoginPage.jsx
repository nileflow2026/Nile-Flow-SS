import { useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { useAuth } from '@auth/AuthContext'
import { oauthBridge } from '@auth/oauthBridge'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { usePostHog } from '@posthog/react'

const OAUTH_ERRORS = {
  popup_blocked: 'Popup was blocked. Please allow popups for this site or use manual sign-in.',
  popup_closed: 'Sign-in window was closed. Please try again.',
  timeout: 'Sign-in timed out. Please check your connection and try again.',
  cancelled: 'You cancelled the sign-in. No changes were made.',
};

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { push } = useToast()
  const posthog = usePostHog()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState({ google: false, facebook: false })

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    const result = await signIn(form.email, form.password)
    setLoading(false)

    if (result.success) {
      const signedInUser = result.data?.user
      if (signedInUser) {
        posthog.identify(signedInUser.$id || signedInUser.id, {
          name: signedInUser.name || signedInUser.username,
          email: signedInUser.email,
        })
      }
      posthog.capture('user_logged_in', { method: 'email' })
      push({ title: 'Welcome back!', message: 'Redirecting you…' })
      navigate(from, { replace: true })
    } else {
      setError(
        result.error === 'RATE_LIMITED'
          ? 'Too many sign-in attempts. Please wait a moment and try again.'
          : result.error || 'Sign in failed. Please check your credentials.',
      )
    }
  }, [form, signIn, navigate, from, push])

  const handleGoogleSignIn = useCallback(async () => {
    setError('')
    setOauthLoading((prev) => ({ ...prev, google: true }))

    const result = await oauthBridge.signInWithGoogle({ usePopup: true })

    if (result.success && result.user) {
      posthog.identify(result.user.$id || result.user.id, {
        name: result.user.name || result.user.username,
        email: result.user.email,
      })
      posthog.capture('user_logged_in_with_google', { method: 'google_popup' })
      push({ title: 'Welcome!', message: 'Signed in with Google.' })
      navigate(from, { replace: true })
    } else if (result.success && result.redirecting) {
      // Redirect flow — browser will navigate away
      return
    } else {
      // OAuth failed — show user-friendly error
      setError(
        OAUTH_ERRORS[result.error] || result.error || 'Google sign-in failed. Please try again.',
      )
    }

    setOauthLoading((prev) => ({ ...prev, google: false }))
  }, [navigate, from, push])

  const handleFacebookSignIn = useCallback(async () => {
    setError('')
    setOauthLoading((prev) => ({ ...prev, facebook: true }))

    const result = await oauthBridge.signInWithFacebook({ usePopup: true })

    if (result.success && result.user) {
      push({ title: 'Welcome!', message: 'Signed in with Facebook.' })
      navigate(from, { replace: true })
    } else if (result.success && result.redirecting) {
      // Redirect flow
      return
    } else {
      setError(
        OAUTH_ERRORS[result.error] || result.error || 'Facebook sign-in failed. Please try again.',
      )
    }

    setOauthLoading((prev) => ({ ...prev, facebook: false }))
  }, [navigate, from, push])

  const isAnyLoading = loading || oauthLoading.google || oauthLoading.facebook

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
        <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-lg)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Sign in</p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">Welcome back</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Sign in to manage orders, saved favorites, and premium benefits.
          </p>

          {error && <Alert title="Unable to sign in" description={error} tone="warning" />}

          {loading ? (
            <div className="mt-6">
              <Loader label="Signing in…" />
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((cur) => ({ ...cur, email: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-emerald-500"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((cur) => ({ ...cur, password: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--color-border)] text-emerald-600 focus:ring-emerald-500 bg-[var(--color-surface-muted)] cursor-pointer"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-emerald-600 hover:text-amber-600">
                  Forgot password?
                </Link>
              </div>
              <PrimaryButton className="w-full justify-center" type="submit" disabled={isAnyLoading}>
                {isAnyLoading ? 'Signing in…' : 'Sign in'}
              </PrimaryButton>
            </form>
          )}

          {/* OAuth options */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--color-surface)] px-2 text-[var(--color-text-muted)]">Or continue with</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 justify-center rounded-full border-[var(--color-border)] text-[var(--color-text-secondary)] transition-all hover:shadow-md hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                onClick={handleGoogleSignIn}
                disabled={isAnyLoading}
              >
                {oauthLoading.google ? (
                  'Connecting…'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.53Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H2.98v2.58A10 10 0 0 0 12 22Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M6.41 13.91A6.01 6.01 0 0 1 6.41 10.1V7.52H2.98a10 10 0 0 0 0 12.78l3.43-2.59Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 6.04c1.47 0 2.79.5 3.83 1.48l2.87-2.87A9.95 9.95 0 0 0 12 2a10 10 0 0 0-9.02 5.52l3.43 2.59C7.2 7.8 9.4 6.04 12 6.04Z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </span>
                )}
              </Button>
              
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-emerald-600 hover:text-amber-600">Create one</Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}

export default LoginPage
