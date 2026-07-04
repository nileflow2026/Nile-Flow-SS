import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { useAuth } from '@api/context/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'

function LoginPage() {
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { push } = useToast()

  const [form, setForm] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    const result = await signIn(form.email, form.password, rememberMe)
    setLoading(false)

    if (result.success) {
      push({ title: 'Welcome back!', message: 'Redirecting you…' })
      navigate(from, { replace: true })
    } else {
      setError(result.error || 'Sign in failed. Please check your credentials.')
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await signInWithGoogle()
    // Redirects away — no need to handle response
    setLoading(false)
  }

  const handleFacebookSignIn = async () => {
    setLoading(true)
    await signInWithFacebook()
    setLoading(false)
  }

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Sign in</p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">Welcome back</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Sign in to manage orders, saved favorites, and premium benefits.
          </p>

          {error && <Alert title="Something's off" description={error} tone="warning" />}

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
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
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
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">
                  Forgot password?
                </Link>
              </div>
              <PrimaryButton className="w-full justify-center" type="submit" disabled={loading}>Sign in</PrimaryButton>
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
                className="flex-1 justify-center"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Google
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={handleFacebookSignIn}
                disabled={loading}
              >
                Facebook
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">Create one</Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}

export default LoginPage
