import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { useAuth } from '@auth/AuthContext'

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email) return

    setError('')
    setLoading(true)
    const result = await forgotPassword(email)
    setLoading(false)

    if (result.success) {
      setSent(true)
    } else {
      setError(result.message || 'Failed to send reset link. Please try again.')
    }
  }

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Password reset</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Forgot password?</h1>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
            Enter the email associated with your account and we'll send a reset link.
          </p>

          {sent && (
            <Alert
              title="Check your inbox"
              description="If an account exists with that email, you'll receive password reset instructions shortly."
              tone="success"
            />
          )}

          {error && <Alert title="Unable to send" description={error} tone="warning" />}

          {loading ? (
            <div className="mt-6">
              <Loader label="Sending reset link…" />
            </div>
          ) : !sent ? (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <PrimaryButton className="w-full justify-center" type="submit">Send reset link</PrimaryButton>
            </form>
          ) : (
            <div className="mt-6">
              <Link to="/login">
                <PrimaryButton className="w-full justify-center">Back to sign in</PrimaryButton>
              </Link>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}

export default ForgotPasswordPage
