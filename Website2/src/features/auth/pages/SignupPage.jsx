import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import { useToast } from '@shared/ui/toast/ToastProvider'

function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const { push } = useToast()

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password) {
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

    push({ title: 'Account created', message: 'Welcome to Nile Flow! Check your email to verify.' })
    setForm({ name: '', email: '', password: '', confirmPassword: '' })
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

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Full name
              <input
                value={form.name}
                onChange={(e) => setForm((cur) => ({ ...cur, name: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                placeholder="Jane Doe"
                required
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((cur) => ({ ...cur, email: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((cur) => ({ ...cur, password: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Confirm password
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((cur) => ({ ...cur, confirmPassword: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                placeholder="Repeat password"
                required
              />
            </label>
            <PrimaryButton className="w-full justify-center" type="submit">Create account</PrimaryButton>
          </form>

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
