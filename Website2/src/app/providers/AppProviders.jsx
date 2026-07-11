import { BrowserRouter } from 'react-router-dom'
import AppRouter from '../router'
import { SkipLink } from '@shared/ui/SkipLink'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from '@shared/ui/toast/ToastProvider'
import { AuthProvider } from '@auth/AuthContext'
import posthog from 'posthog-js'
import { PostHogProvider, PostHogErrorBoundary } from '@posthog/react'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
})

export default function AppProviders() {
  return (
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <SkipLink />
                <AppRouter />
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  )
}
