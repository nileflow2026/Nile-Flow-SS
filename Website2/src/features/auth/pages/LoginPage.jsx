import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import { useToast } from '@shared/ui/toast/ToastProvider'

function LoginPage() {
  const [error, setError] = useState('')
  const { push } = useToast()

  const handleSubmit = (event) => {
    event.preventDefault()
    push({ title: 'Welcome back!', message: 'Redirecting to your dashboard...' })
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

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Email address
              <input
                type="email"
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Password
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                placeholder="••••••••"
                required
              />
            </label>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">
                Forgot password?
              </Link>
            </div>
            <PrimaryButton className="w-full justify-center" type="submit">Sign in</PrimaryButton>
          </form>

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
