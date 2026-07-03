import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import { useToast } from '@shared/ui/toast/ToastProvider'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { push } = useToast()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email) return
    push({ title: 'Reset link sent', message: 'Check your email inbox for instructions.' })
    setSent(true)
  }

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Password reset</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Forgot password?</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Enter the email associated with your account and we'll send a reset link.
          </p>

          {sent && (
            <Alert
              title="Check your inbox"
              description="If an account exists with that email, you'll receive password reset instructions shortly."
              tone="success"
            />
          )}

          {!sent && (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <PrimaryButton className="w-full justify-center" type="submit">Send reset link</PrimaryButton>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  )
}

export default ForgotPasswordPage
