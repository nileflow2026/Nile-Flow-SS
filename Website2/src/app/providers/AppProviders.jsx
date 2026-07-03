import { BrowserRouter } from 'react-router-dom'
import AppRouter from '../router'
import { SkipLink } from '@shared/ui/SkipLink'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from '@shared/ui/toast/ToastProvider'

export default function AppProviders() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <SkipLink />
          <AppRouter />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
