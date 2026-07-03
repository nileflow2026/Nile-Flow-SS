import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import InfoCard from '@shared/ui/card/InfoCard'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'

const highlights = [
  {
    title: 'Responsive commerce journeys',
    description: 'Every page is designed to flow naturally from 320px phones to wide desktop displays with no awkward overflow.',
    badge: 'Adaptive UX',
  },
  {
    title: 'Fast mobile-first interactions',
    description: 'Touch targets, card spacing, and navigation all scale comfortably for thumb-friendly usage.',
    badge: 'Mobile first',
  },
  {
    title: 'Premium storefront experience',
    description: 'The product surfaces are tuned for trust, clarity, and conversion across all devices.',
    badge: 'Premium feel',
  },
]

function HomePage() {
  return (
    <PageShell>
      <section className="py-10 sm:py-14 lg:py-20">
        <div className="responsive-shell grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-6 shadow-[var(--shadow-md)] sm:p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Nile Flow Commerce OS</p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              A responsive commerce platform designed for Africa’s next digital storefronts.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
              Discover a refined experience for shopping, checkout, payments, and AI-assisted discovery—carefully optimized for every screen size.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton className="w-full justify-center sm:w-auto">Explore products</PrimaryButton>
              <Link to="/checkout" className="flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                Checkout preview
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Responsive by default</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">Fluid grids, adaptive cards, and touch-friendly controls.</p>
            </div>
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Conversion-ready</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Built to feel polished on mobile and desktop alike.</p>
                </div>
                <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-secondary)]">
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ResponsiveSection eyebrow="Experience pillars" title="Every transition feels deliberate" description="The responsive foundation now spans layout, spacing, typography, navigation, and content density.">
        <Alert title="Design-system parity" description="Product cards, badges, loaders, alerts, and modal patterns now follow the same light, premium language used across the mobile experience." tone="success" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <InfoCard key={item.title} title={item.title} description={item.description} badge={item.badge} />
          ))}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default HomePage
