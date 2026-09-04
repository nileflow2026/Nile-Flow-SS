import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppHeader from '@shared/ui/header/AppHeader'

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

function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="#1DA1F2" {...props}>
      <path d="M18.9 3H22l-6.7 7.68L23.4 21h-5.8l-4.55-5.95L7.6 21H4.5l7.2-8.25L.6 3h5.95l4.1 5.43L18.9 3Zm-1.02 16.2h1.13L6.2 4.7H5.03l12.85 14.5Z" />
    </svg>
  )
}

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <defs>
        <linearGradient id="tiktok-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#69C9D0" />
          <stop offset="50%" stopColor="#EE1D52" />
          <stop offset="100%" stopColor="#69C9D0" />
        </linearGradient>
      </defs>
      <path d="M14.6 2.5c.2 2.3 1.4 3.8 3.5 4.4v2.9c-1.2.1-2.3-.2-3.4-.8v6.3a5.2 5.2 0 1 1-4.5-5.1v3.1a2.2 2.2 0 1 0 1.7 2.1V2.5h2.7Z" fill="url(#tiktok-grad)" />
    </svg>
  )
}

function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="#FF0000" {...props}>
      <path d="M23.5 7.2a3.1 3.1 0 0 0-2.2-2.2C19.6 4.4 12 4.4 12 4.4s-7.6 0-9.3.6A3.1 3.1 0 0 0 .5 7.2 32.6 32.6 0 0 0 0 12a32.6 32.6 0 0 0 .5 4.8 3.1 3.1 0 0 0 2.2 2.2c1.7.6 9.3.6 9.3.6s7.6 0 9.3-.6a3.1 3.1 0 0 0 2.2-2.2A32.6 32.6 0 0 0 24 12a32.6 32.6 0 0 0-.5-4.8ZM9.6 15.5V8.5l6.2 3.5-6.2 3.5Z" />
    </svg>
  )
}

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61580711948973', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/nileflowafrica?igsh=NTVoYWR1YW94Y3Bp', icon: InstagramIcon },
  { label: 'Twitter', href: 'https://twitter.com/nileflowafrica', icon: TwitterIcon },
  { label: 'TikTok', href: 'https://www.tiktok.com/@nileflowafrica', icon: TikTokIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@nileflowafrica', icon: YouTubeIcon },
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
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search])

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
       <AppHeader /> 

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <ScrollToTopButton />

      <footer className="border-t border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface-muted)_0%,var(--color-background)_100%)]">
        {/* African pattern divider */}
        <div className="h-[3px] w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,#16a34a_8px,#16a34a_12px,transparent_12px,transparent_20px,#d97706_20px,#d97706_24px,transparent_24px,transparent_32px)]" />

        {/* App download banner */}
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
          <div className="responsive-shell flex flex-col items-center gap-4 rounded-none border-y border-emerald-100/80 bg-[linear-gradient(90deg,rgba(16,185,129,0.12)_0%,var(--color-surface)_50%,rgba(245,158,11,0.12)_100%)] px-4 py-6 text-center shadow-sm sm:flex-row sm:justify-between sm:rounded-2xl sm:px-6 sm:py-8 sm:text-left">
            <div>
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Get the Nile Flow app</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Shop, track, and save on the go.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
              <a
                href="#"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1a73e8]/20 bg-[#1a73e8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1557b0] hover:shadow-md"
                aria-label="Get Nile Flow on Google Play"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#34A853" d="M2.7 2.3a2.1 2.1 0 0 0-.7 1.6v16.2c0 .7.3 1.2.7 1.6L13.1 12 2.7 2.3Z" />
                  <path fill="#FBBC04" d="m13.1 12 3.2 3 4.1-2.3c.8-.5.8-1.5 0-2l-4.1-2.3-3.2 3.6Z" />
                  <path fill="#EA4335" d="M2.7 2.3 13.1 12l3.2-3.6L4.4 2.1a1.8 1.8 0 0 0-1.7.2Z" />
                  <path fill="#4285F4" d="m2.7 21.7 10.4-9.7 3.2 3L4.4 21.9a1.8 1.8 0 0 1-1.7-.2Z" />
                </svg>
                Google Play
              </a>
            </div>
          </div>
        </div>

        <div className="responsive-shell py-10 sm:py-12 lg:py-14">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-[1.15fr_0.7fr_0.7fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-sm font-semibold text-white shadow-[var(--shadow-sm)]">
                  <img src="/logo.png" alt="Nile Flow" className="h-8 w-24 object-cover sm:h-10 sm:w-28" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Nile Flow</p>
                  <p className="text-xs text-emerald-500">Commerce OS</p>
                </div>
              </div>

              

              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 shadow-[var(--shadow-sm)]">
                  Shop now
                </Link>
                <a href="mailto:hello@nileflow.com" className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 shadow-[var(--shadow-sm)]">
                  Contact us
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">Shop</h3>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
                {shopLinks.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="transition hover:text-emerald-600">
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
                      <a href={item.to} className="transition hover:text-emerald-600">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} className="transition hover:text-emerald-600">
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
                      <a href={item.to} className="transition hover:text-emerald-600">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} className="transition hover:text-emerald-600">
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] transition hover:scale-105 hover:border-emerald-500 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30"
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