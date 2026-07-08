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
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Sign in</p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Welcome back</h1>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
            Sign in to manage orders, saved favorites, and premium benefits.
          </p>

          {error && <Alert title="Unable to sign in" description={error} tone="warning" />}

          {loading ? (
            <div className="mt-6">
              <Loader label="Signing in…" />
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((cur) => ({ ...cur, email: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-400"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((cur) => ({ ...cur, password: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-400"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-emerald-400 cursor-pointer"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-emerald-600 hover:text-amber-600 dark:text-emerald-400 dark:hover:text-amber-400">
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
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">Or continue with</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 justify-center rounded-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-all hover:shadow-md hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                onClick={handleGoogleSignIn}
                disabled={isAnyLoading}
              >
                {oauthLoading.google ? 'Connecting…' : 'Google'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-center rounded-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-all hover:shadow-md hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
                onClick={handleFacebookSignIn}
                disabled={isAnyLoading}
              >
                {oauthLoading.facebook ? 'Connecting…' : 'Facebook'}
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-emerald-600 hover:text-amber-600 dark:text-emerald-400 dark:hover:text-amber-400">Create one</Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}

export default LoginPage
