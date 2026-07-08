import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { useAuth } from '@auth/AuthContext'
import { httpClient } from '@api/client/index'

const DATA_CATEGORIES = [
  'Account profile & personal information',
  'Order history & cart data',
  'Saved addresses & payment methods',
  'Product reviews & ratings',
  'Notification preferences',
  'Loyalty points (Nile Miles)',
  'Media uploads & profile photos',
  'Device & session logs',
]

function AccountDeletionPage() {
  const { user, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('form') // form | otp | status | cancelled
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [statusData, setStatusData] = useState(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Fetch deletion status on mount
  useEffect(() => {
    if (!user?.id && !user?.$id) return
    const userId = user.id || user.$id
    setLoading(true)
    httpClient.get(`/api/account/deletion/status/${userId}`)
      .then((res) => {
        const data = res.data
        setStatusData(data)
        if (data.status === 'pending' || data.status === 'otp_pending') {
          setStep('status')
        }
      })
      .catch(() => { /* no active request */ })
      .finally(() => setLoading(false))
  }, [user])

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await httpClient.post('/api/account/deletion/send-otp', { email })
      setStep('otp')
      setSuccessMsg('A 6-digit verification code has been sent to your email.')
      setResendCooldown(120)
    } catch (err) {
      const data = err?.response?.data || err
      if (data.code === 'OTP_RATE_LIMITED') {
        const mins = data.retryAfterMinutes || 60
        setError(`Too many requests. Please wait ${mins} minute(s) before trying again.`)
      } else {
        setError(data.error || 'Failed to send verification code.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    const otpString = otp.join('')
    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    setLoading(true)
    try {
      const res = await httpClient.post('/api/account/deletion/request', { email, otp: otpString })
      setStatusData(res.data)
      setStep('status')
      setSuccessMsg(res.message || 'Account deletion scheduled.')
    } catch (err) {
      const data = err?.response?.data || err
      const code = data.code
      if (code === 'OTP_INVALID') {
        const rem = data.remainingAttempts
        setError(`Invalid code. ${rem > 0 ? `${rem} attempt(s) remaining.` : 'No attempts remaining — request a new code.'}`)
      } else if (code === 'OTP_EXPIRED') {
        setError('Your code has expired. Please request a new one.')
        setStep('form')
      } else if (code === 'OTP_LOCKED') {
        setError('Too many failed attempts. Please request a new code.')
        setStep('form')
      } else if (code === 'ACTIVE_ORDERS_BLOCKING') {
        setError('You have active orders in progress. Please wait for them to complete before deleting your account.')
        setStep('form')
      } else {
        setError(data.error || 'Verification failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await httpClient.post('/api/account/deletion/send-otp', { email })
      setSuccessMsg('A new code has been sent to your email.')
      setResendCooldown(120)
      setOtp(['', '', '', '', '', ''])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to resend code.')
    } finally {
      setLoading(false)
    }
  }

  // Cancel deletion
  const handleCancelDeletion = async () => {
    setCancelLoading(true)
    setError('')
    try {
      await httpClient.post('/api/account/deletion/cancel', { reason: cancelReason })
      setStep('cancelled')
      setStatusData(null)
      setShowCancelConfirm(false)
      setSuccessMsg('Account deletion cancelled. Your account has been restored.')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to cancel deletion.')
    } finally {
      setCancelLoading(false)
    }
  }

  // OTP input helpers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`d-otp-${index + 1}`)?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`d-otp-${index - 1}`)?.focus()
    }
  }

  return (
    <PageShell>
      <ResponsiveSection
        eyebrow="Account"
        title="Delete account & data"
        description="Permanently remove your account and all associated personal data. Required under GDPR and Google Play Data Safety policy."
        className="py-10 sm:py-14 lg:py-16"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Warning */}
          <Alert
            title="This action is permanent and irreversible"
            description="Deleting your account will permanently remove all your personal data after a grace period. This cannot be undone."
            tone="warning"
          />

          {loading && !statusData && step === 'form' && (
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
              <Loader label="Checking account status…" />
            </div>
          )}

          {/* Step: Form */}
          {step === 'form' && (
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
              <div className="mb-6 space-y-3">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Data that will be permanently deleted</p>
                <ul className="space-y-1.5">
                  {DATA_CATEGORIES.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <span className="text-red-500">&times;</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {error && <Alert title="Error" description={error} tone="warning" />}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Confirm your email address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                </label>
                <PrimaryButton type="submit" className="w-full justify-center" disabled={loading || !email}>
                  {loading ? 'Sending code…' : 'Request account deletion'}
                </PrimaryButton>
                <p className="text-center text-xs text-[var(--color-text-muted)]">
                  A 6-digit verification code will be sent to your email.
                </p>
              </form>
            </div>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
              <div className="mb-6 text-center">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Verify your identity</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Enter the 6-digit code sent to {email}</p>
              </div>

              {successMsg && <Alert title="Code sent" description={successMsg} tone="success" />}
              {error && <Alert title="Error" description={error} tone="warning" />}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`d-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="h-12 w-9 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-muted)] text-center text-lg font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] sm:h-14 sm:w-12 sm:text-xl"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>

                <PrimaryButton type="submit" className="w-full justify-center" disabled={loading || otp.join('').length !== 6}>
                  {loading ? 'Verifying…' : 'Confirm deletion'}
                </PrimaryButton>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendCooldown > 0}
                    className="text-sm text-[var(--color-primary)] hover:text-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(''); setOtp(['', '', '', '', '', '']) }}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step: Status */}
          {step === 'status' && statusData && (
            <>
              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Deletion request</p>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                    {statusData.status === 'pending' ? 'Pending Deletion' : statusData.status}
                  </span>
                </div>
                {statusData?.scheduledDeletionDate && (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Scheduled for permanent deletion on{' '}
                    <strong className="text-red-600">
                      {new Date(statusData.scheduledDeletionDate).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </strong>
                  </p>
                )}
              </div>

              {statusData.status === 'pending' && !showCancelConfirm && (
                <Button variant="outline" className="w-full justify-center" onClick={() => setShowCancelConfirm(true)}>
                  Cancel deletion request
                </Button>
              )}

              {showCancelConfirm && (
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8 space-y-4">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Cancel your deletion request?</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Your account will be restored and you can continue normally.</p>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Reason (optional)</label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Why are you cancelling?"
                      maxLength={300}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex gap-3">
                    <Button variant="primary" className="flex-1 justify-center" onClick={handleCancelDeletion} disabled={cancelLoading}>
                      {cancelLoading ? '…' : 'Keep my account'}
                    </Button>
                    <Button variant="ghost" className="flex-1 justify-center" onClick={() => { setShowCancelConfirm(false); setError('') }}>
                      No, proceed
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step: Cancelled */}
          {step === 'cancelled' && (
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-md)] sm:p-8">
              <p className="text-lg font-semibold text-green-600">Deletion cancelled</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Your account has been restored. You can continue using Nile Flow as normal.</p>
              <Link to="/" className="mt-4 inline-block text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)]">
                Return to home &rarr;
              </Link>
            </div>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default AccountDeletionPage
