import { Link } from 'react-router-dom'
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

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61580711948973', icon: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V3.9c0-.9.3-1.6 1.6-1.6h1.7V.1C16.2.1 15 0 13.6 0c-2.5 0-4.2 1.5-4.2 4.3v2.4H6.7V9.9h2.7v11.1h4.1z" />
    </svg>
  ) },
  { label: 'Instagram', href: 'https://www.instagram.com/nileflowafrica?igsh=NTVoYWR1YW94Y3Bp', icon: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ) },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nile-flow-683806395?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', icon: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.94 8.5A1.56 1.56 0 1 0 6.94 5.38a1.56 1.56 0 0 0 0 3.12ZM5.5 9.75h2.88V18H5.5zM10.18 9.75h2.76v1.12h.04c.38-.73 1.32-1.5 2.72-1.5 2.91 0 3.45 1.91 3.45 4.4V18h-2.88v-7.56c0-1.8-.03-4.12-2.51-4.12-2.52 0-2.9 1.97-2.9 4V18H10.18z" />
    </svg>
  ) },
]

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <AppHeader />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]/80">
        <div className="responsive-shell py-10 sm:py-12 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.7fr_0.7fr_0.8fr]">
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <item.icon className="h-4 w-4" />
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
