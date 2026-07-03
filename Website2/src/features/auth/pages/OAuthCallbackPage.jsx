import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import Loader from '@shared/ui/loader/Loader'
import Alert from '@shared/ui/alert/Alert'
import PrimaryButton from '@shared/ui/button/PrimaryButton'

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const code = searchParams.get('code')
    const provider = searchParams.get('provider') || 'oauth'

    if (!code) {
      setError('Authorization code missing. Please try signing in again.')
      setStatus('error')
      return
    }

    // Simulate OAuth exchange
    const exchange = setTimeout(() => {
      setStatus('success')
    }, 1800)

    return () => clearTimeout(exchange)
  }, [searchParams])

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-20 sm:px-6 lg:py-28">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          {status === 'processing' && (
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Authenticating</p>
              <h1 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">Completing sign in</h1>
              <div className="mt-6">
                <Loader label="Verifying your credentials…" />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <Alert title="Sign in failed" description={error} tone="warning" />
              <PrimaryButton className="mt-6 w-full justify-center" onClick={() => navigate('/login')}>
                Try again
              </PrimaryButton>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Welcome</p>
              <h1 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">You're signed in</h1>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                Redirecting you to your dashboard…
              </p>
              <PrimaryButton className="mt-6 w-full justify-center" onClick={() => navigate('/')}>
                Continue to home
              </PrimaryButton>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}

export default OAuthCallbackPage
