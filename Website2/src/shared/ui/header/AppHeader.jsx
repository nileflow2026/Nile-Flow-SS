import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Button from '@shared/ui/button/Button'
import { useTheme } from '@app/providers/ThemeProvider'
import { useAuth } from '@api/context/AuthContext'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Cart', to: '/cart' },
]

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { isAuthenticated, user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
  }

  const userName = user?.name || user?.username || user?.email?.split('@')[0] || 'Profile'

  const authNavItems = isAuthenticated
    ? [
        { label: 'Orders', to: '/orders' },
        { label: 'Profile', to: '/profile' },
      ]
    : []

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl">
      <div className="responsive-shell flex items-center justify-between gap-4 py-3 sm:py-4">
        <Link to="/" className="flex items-center gap-3" aria-label="Nile Flow home">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-sm font-semibold text-white shadow-[var(--shadow-sm)]">
            <img src="/logo.png" alt="Nile Flow" className="h-15 w-32 object-cover" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Nile Flow</p>
            <p className="text-xs text-[var(--color-text-muted)]">Commerce OS</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {[...navItems, ...authNavItems].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                  isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
                }`
              }
              aria-label="Profile"
            >
              <ProfileIcon />
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              aria-label="Toggle color theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile">
                  <Button variant="outline" className="px-4 py-2">{userName}</Button>
                </Link>
                <Button variant="ghost" className="px-4 py-2 text-sm" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? '…' : 'Sign out'}
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="px-4 py-2">Sign in</Button>
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      </div>

      <div id="mobile-nav" className={`overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 md:hidden ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="responsive-shell flex flex-col gap-2 py-3">
          {[...navItems, ...authNavItems].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              aria-label="Toggle color theme"
            >
              {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
            </button>
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 rounded-2xl border border-[var(--color-border)] px-3 py-3 text-center text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
              >
                {signingOut ? 'Signing out…' : `Sign out (${userName})`}
              </button>
            ) : (
              <Link to="/login" className="flex-1 rounded-2xl border border-[var(--color-border)] px-3 py-3 text-center text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
