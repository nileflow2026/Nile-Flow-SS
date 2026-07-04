import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import Loader from '@shared/ui/loader/Loader'
import Alert from '@shared/ui/alert/Alert'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { useAuth } from '@api/context/AuthContext'

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthCallback } = useAuth()

  const [error, setError] = useState('')
  const [status, setStatus] = useState('processing')
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const provider = searchParams.get('provider') || 'google'

    if (!code) {
      setError('Authorization code missing. Please try signing in again.')
      setStatus('error')
      return
    }

    const exchangeOAuth = async () => {
      try {
        const result = await handleOAuthCallback(provider, code, state)

        if (result.success) {
          setStatus('success')
          // Redirect to home after a brief moment
          setTimeout(() => navigate('/', { replace: true }), 1500)
        } else {
          setError(result.error || 'Failed to complete sign in. Please try again.')
          setStatus('error')
        }
      } catch (err) {
        setError('An unexpected error occurred during authentication.')
        setStatus('error')
      }
    }

    exchangeOAuth()
  }, [searchParams, handleOAuthCallback, navigate])

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
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}

export default OAuthCallbackPage
