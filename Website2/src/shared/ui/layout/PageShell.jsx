import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '@shared/ui/header/AppHeader'
import { useTheme } from '@app/providers/ThemeProvider'

const shopLinks = [
  { label: 'Products', to: '/products' },
  { label: 'Search', to: '/search' },
  { label: 'Deals', to: '/deals' },
  { label: 'Premium Deals', to: '/premium-deals' },
  { label: 'Group Buy', to: '/group-buy' },
  { label: 'Cart', to: '/cart' },
]

const supportLinks = [
  { label: 'Help Center', to: '/help-center' },
  { label: 'My Orders', to: '/orders' },
  { label: 'Track Order', to: '/orders' },
  { label: 'Return Policy', to: '/return-policy' },
  { label: 'Cancel Order', to: '/cancel-order' },
]

const companyLinks = [
  { label: 'About Nile Flow', to: '/about' },
  { label: 'Careers', to: '/careers' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
]

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <defs>
        <linearGradient id="insta-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#insta-grad)" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="url(#insta-grad)" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="url(#insta-grad)" stroke="none" />
    </svg>
  )
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="#0A66C2" {...props}>
      <path d="M6.94 8.5A1.56 1.56 0 1 0 6.94 5.38a1.56 1.56 0 0 0 0 3.12ZM5.5 9.75h2.88V18H5.5zM10.18 9.75h2.76v1.12h.04c.38-.73 1.32-1.5 2.72-1.5 2.91 0 3.45 1.91 3.45 4.4V18h-2.88v-7.56c0-1.8-.03-4.12-2.51-4.12-2.52 0-2.9 1.97-2.9 4V18H10.18z" />
    </svg>
  )
}

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61580711948973', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/nileflowafrica?igsh=NTVoYWR1YW94Y3Bp', icon: InstagramIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nile-flow-683806395?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', icon: LinkedInIcon },
]

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-[var(--shadow-md)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-[var(--shadow-lg)] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  )
}

function PageShell({ children }) {
  const { isDark } = useTheme()

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <AppHeader />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <ScrollToTopButton />

      <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]/80">
        {/* App download banner */}
        <div className={`border-b border-[var(--color-border)] ${
          isDark
            ? 'bg-[var(--color-surface-muted)]'
            : 'bg-gradient-to-r from-[var(--color-primary)]/[0.04] via-[var(--color-accent)]/[0.04] to-[var(--color-primary)]/[0.04]'
        }`}>
          <div className="responsive-shell flex flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left sm:py-8">
            <div>
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Get the Nile Flow app</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Shop, track, and save on the go.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.314a.9.9 0 0 0-.609.857v19.658a.9.9 0 0 0 .609.857l.105.048L14.59 12 3.714 1.266l-.105.048zM20.692 10.345l-4.696-2.713-1.607 1.607 2.953 2.953-2.953 2.953 1.607 1.607 4.696-2.713c.978-.565.978-1.83 0-2.394zM3.714 22.734l10.876-10.734-1.607-1.607-9.269 9.269zM14.983 12l-9.269-9.269 1.607-1.607L14.983 12z" />
                </svg>
                Google Play
              </a>
              <a
                href="#"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                App Store
              </a>
            </div>
          </div>
        </div>

        <div className="responsive-shell py-10 sm:py-12 lg:py-14">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-[1.15fr_0.7fr_0.7fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-sm font-semibold text-white shadow-[var(--shadow-sm)]">
                  NF
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Nile Flow</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Trusted African commerce</p>
                </div>
              </div>

              <p className="max-w-xl text-sm leading-7 text-[var(--color-text-secondary)]">
                Discover authentic products, secure payments, and dependable delivery designed for modern everyday shopping across Africa.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                  Shop now
                </Link>
                <a href="mailto:hello@nileflow.com" className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                  Contact us
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">Shop</h3>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
                {shopLinks.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="transition hover:text-[var(--color-primary)]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">Support</h3>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
                {supportLinks.map((item) => (
                  <li key={item.label}>
                    {item.to.startsWith('mailto:') ? (
                      <a href={item.to} className="transition hover:text-[var(--color-primary)]">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} className="transition hover:text-[var(--color-primary)]">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">Company</h3>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
                {companyLinks.map((item) => (
                  <li key={item.label}>
                    {item.to.startsWith('mailto:') ? (
                      <a href={item.to} className="transition hover:text-[var(--color-primary)]">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} className="transition hover:text-[var(--color-primary)]">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">
              © 2026 Nile Flow. Built for trusted commerce across Africa.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] transition hover:scale-105"
                >
                  <item.icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PageShell
