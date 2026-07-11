import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail, resendVerificationCode } = useAuth()
  const { push } = useToast()

  const email = searchParams.get('email') || ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)

  const inputRefs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (!/^\d$/.test(value) && value !== '') return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-advance to next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Backspace to go to previous input
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('')
    if (digits.length === 0) return

    const newCode = ['', '', '', '', '', '']
    digits.forEach((digit, i) => {
      newCode[i] = digit
    })
    setCode(newCode)

    // Focus the next empty input or the last one
    const nextEmpty = newCode.findIndex((d) => d === '')
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.')
      return
    }
    if (!email) {
      setError('Email address is missing. Please sign up again.')
      return
    }

    setLoading(true)
    const result = await verifyEmail(email, fullCode)
    setLoading(false)

    if (result.success) {
      setVerified(true)
      push({ title: 'Account verified!', message: 'Your email has been confirmed.' })
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } else {
      setError(result.message || 'Verification failed. Please check the code and try again.')
      // Clear code on failure
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return

    setResending(true)
    const result = await resendVerificationCode(email)
    setResending(false)

    if (result.success) {
      setResendCooldown(60)
      push({ title: 'Code resent', message: 'A new verification code has been sent to your email.' })
    } else {
      setError(result.message || 'Failed to resend code.')
    }
  }

  if (!email) {
    return (
      <PageShell>
        <section className="flex items-center justify-center px-4 py-20 sm:px-6 lg:py-28">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Verification</p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Missing email</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
              We couldn't find your email address. Please sign up again to receive a verification code.
            </p>
            <div className="mt-6">
              <Link to="/signup">
                <PrimaryButton className="w-full justify-center">Sign up</PrimaryButton>
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    )
  }

  if (verified) {
    return (
      <PageShell>
        <section className="flex items-center justify-center px-4 py-20 sm:px-6 lg:py-28">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-900/30">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Email verified!</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
              Your account is now active. Redirecting to sign in…
            </p>
          </div>
        </section>
      </PageShell>
    )
  }

  const isComplete = code.every((d) => d !== '')

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Verify your email</p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">Enter verification code</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            We sent a 6-digit code to <strong className="text-[var(--color-text-primary)]">{email}</strong>. Enter it below to activate your account.
          </p>

          {error && <Alert title="Verification failed" description={error} tone="warning" />}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Code input grid */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-14 w-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-center text-2xl font-bold text-[var(--color-text-primary)] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:h-16 sm:w-14"
                  aria-label={`Digit ${index + 1}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <PrimaryButton
              className="w-full justify-center"
              type="submit"
              disabled={!isComplete || loading}
            >
              {loading ? 'Verifying…' : 'Verify email'}
            </PrimaryButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending || resendCooldown > 0}
                className="font-semibold text-emerald-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending
                  ? 'Resending…'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend code'}
              </button>
            </p>
          </div>

          <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
            <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}

export default VerifyEmailPage
