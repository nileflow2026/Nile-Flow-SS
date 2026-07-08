import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'

function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const { push } = useToast()

  const [form, setForm] = useState({ password: '', confirmPassword: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email) {
      setError('Please enter your email address.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await resetPassword(form.email, token, form.password)
    setLoading(false)

    if (result.success) {
      setResetDone(true)
      push({ title: 'Password updated', message: 'You can now sign in with your new password.' })
    } else {
      setError(result.message || 'Failed to reset password. The link may have expired.')
    }
  }

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">New password</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Reset your password</h1>
          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">
            Choose a strong password you haven't used before.
          </p>

          {error && <Alert title="Unable to reset" description={error} tone="warning" />}

          {loading && (
            <div className="mt-6">
              <Loader label="Resetting password…" />
            </div>
          )}

          {resetDone ? (
            <div className="mt-6 space-y-4">
              <Alert
                title="All set!"
                description="Your password has been updated successfully."
                tone="success"
              />
              <Link to="/login">
                <PrimaryButton className="w-full justify-center">Sign in with new password</PrimaryButton>
              </Link>
            </div>
          ) : !loading && (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((cur) => ({ ...cur, email: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                New password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((cur) => ({ ...cur, password: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Confirm new password
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((cur) => ({ ...cur, confirmPassword: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
              </label>
              <PrimaryButton className="w-full justify-center" type="submit">Reset password</PrimaryButton>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">Back to sign in</Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}

export default ResetPasswordPage
