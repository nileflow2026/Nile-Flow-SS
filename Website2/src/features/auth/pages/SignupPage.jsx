import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { useAuth } from '@api/context/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'

function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  const handleChange = (field) => (e) => {
    setForm((cur) => ({ ...cur, [field]: e.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.username || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const result = await signUp(form.email, form.password, form.username, form.phone)
    setLoading(false)

    if (result.success) {
      if (result.verificationNeeded) {
        setVerificationSent(true)
        push({ title: 'Almost there!', message: 'Check your email to verify your account.' })
      } else {
        push({ title: 'Account created', message: 'Welcome to Nile Flow!' })
        navigate('/', { replace: true })
      }
    } else {
      setError(result.error || 'Sign up failed. Please try again.')
    }
  }

  // After successful signup, redirect to verification page
  if (verificationSent) {
    const encodedEmail = encodeURIComponent(form.email)
    navigate(`/verify-email?email=${encodedEmail}`, { replace: true })
    return null
  }

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Get started</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Create your account</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Join Nile Flow for seamless shopping, order tracking, and exclusive member benefits.
          </p>

          {error && <Alert title="Something's off" description={error} tone="warning" />}

          {loading ? (
            <div className="mt-6">
              <Loader label="Creating your account…" />
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Full name *
                <input
                  value={form.username}
                  onChange={handleChange('username')}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Jane Doe"
                  required
                  autoComplete="name"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Email *
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Phone (optional)
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="+254 712 345 678"
                  autoComplete="tel"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Password *
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Confirm password *
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
              </label>
              <PrimaryButton className="w-full justify-center" type="submit" disabled={loading}>
                Create account
              </PrimaryButton>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">Sign in</Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}

export default SignupPage
