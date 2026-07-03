import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import { useToast } from '@shared/ui/toast/ToastProvider'

function ResetPasswordPage() {
  const { token } = useParams()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [reset, setReset] = useState(false)
  const { push } = useToast()

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    push({ title: 'Password updated', message: 'You can now sign in with your new password.' })
    setReset(true)
  }

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">New password</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Reset your password</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Choose a strong password you haven't used before.
          </p>

          {error && <Alert title="Unable to reset" description={error} tone="warning" />}

          {reset ? (
            <div className="mt-6 space-y-4">
              <Alert
                title="All set!"
                description="Your password has been updated successfully."
                tone="success"
              />
              <Link to="/login" className="block">
                <PrimaryButton className="w-full justify-center">Sign in with new password</PrimaryButton>
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                New password
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
                Confirm new password
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((cur) => ({ ...cur, confirmPassword: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="Repeat password"
                  required
                />
              </label>
              <PrimaryButton className="w-full justify-center" type="submit">Reset password</PrimaryButton>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
            <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">Back to sign in</Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}

export default ResetPasswordPage
