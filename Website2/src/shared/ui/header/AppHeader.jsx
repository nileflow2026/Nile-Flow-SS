import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Button from '@shared/ui/button/Button'
import { useTheme } from '@app/providers/ThemeProvider'
import { useAuth } from '@auth/AuthContext'
import { usePostHog } from '@posthog/react'
import { cartService } from '@api/services'

const navItems = [
  { label: 'Home', to: '/home' },
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
  const [cartCount, setCartCount] = useState(0)
  const posthog = usePostHog()

  const isLandingRoute = ['/', '/landing', '/Landing'].includes(location.pathname)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const userId = user?.$id || user?.id

  useEffect(() => {
    let active = true

    const loadCartCount = async () => {
      if (!isAuthenticated || !userId) {
        setCartCount(0)
        return
      }

      const items = await cartService.getCart(userId)
      if (active) {
        setCartCount(items.reduce((total, item) => total + (item.quantity || 1), 0))
      }
    }

    const handleCartUpdate = (event) => {
      if (!event.detail?.userId || event.detail.userId === userId) loadCartCount()
    }

    loadCartCount()
    window.addEventListener('cart:updated', handleCartUpdate)
    return () => {
      active = false
      window.removeEventListener('cart:updated', handleCartUpdate)
    }
  }, [isAuthenticated, userId])

  const handleSignOut = async () => {
    setSigningOut(true)
    posthog.capture('user_signed_out')
    await signOut()
    posthog.reset()
    setSigningOut(false)
  }

  if (isLandingRoute) return null

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
            <img src="/logo.png" alt="Nile Flow" className="h-8 w-24 object-cover sm:h-10 sm:w-28" />
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
                  isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-[var(--color-text-secondary)] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400'
                }`
              }
            >
              <span className="inline-flex items-center gap-2">
                {item.label}
                {item.to === '/cart' && cartCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </span>
            </NavLink>
          ))}
          
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

        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            aria-label="Search products"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.2-4.2" />
            </svg>
          </Link>

          <Link
            to="/cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            aria-label="View cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1" />
              <circle cx="19" cy="20" r="1" />
              <path d="M3 3h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L17 7H7" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 md:hidden ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="responsive-shell flex flex-col gap-2 py-3">
          {[...navItems, ...authNavItems].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-[var(--color-text-secondary)] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400'
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
                {signingOut ? 'Signing out…' : 'Sign out'}
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
