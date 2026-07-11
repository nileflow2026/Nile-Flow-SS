import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import Alert from '@shared/ui/alert/Alert'

const mockPremiumDeals = [
  { id: 1, name: 'Nile Premium Coffee Bundle', price: 'KES 2,800', was: 'KES 4,200', discount: '-33%', image: '☕' },
  { id: 2, name: 'Artisan Basket Collection', price: 'KES 3,200', was: 'KES 5,000', discount: '-36%', image: '🧺' },
  { id: 3, name: 'Luxury Shea Butter Set', price: 'KES 2,400', was: 'KES 3,600', discount: '-33%', image: '🧴' },
  { id: 4, name: 'Premium Beaded Jewelry', price: 'KES 1,600', was: 'KES 2,800', discount: '-43%', image: '📿' },
  { id: 5, name: 'Ethiopian Coffee Sampler', price: 'KES 2,200', was: 'KES 3,200', discount: '-31%', image: '☕' },
  { id: 6, name: 'Kenyan Honey Bundle', price: 'KES 1,400', was: 'KES 2,200', discount: '-36%', image: '🍯' },
]

const benefits = ['Early access to all flash deals', 'Extra 10% off premium deals', 'Free delivery on orders over KES 1,000', 'Exclusive member-only products']

function PremiumDealsPage() {
  return (
    <PageShell>
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/50 via-emerald-50/30 to-amber-50/50 px-4 py-14 text-center sm:px-6 sm:py-20 dark:from-amber-950/10 dark:via-emerald-950/5 dark:to-amber-950/10">
        <Badge variant="primary">Premium</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Premium deals</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">
          Exclusive discounts reserved for Nile Flow Premium members. Upgrade to unlock savings of up to 43%.
        </p>
      </div>

      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        <Alert title="Not a Premium member yet?" description="Get early access to deals, extra 10% off, and free delivery. Join today." tone="info" className="mb-8">
          <div className="mt-3 flex flex-wrap gap-3">
            <PrimaryButton>Upgrade to Premium — KES 499/mo</PrimaryButton>
            <Link to="/deals" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-emerald-500 hover:text-emerald-600">
              Browse regular deals
            </Link>
          </div>
        </Alert>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockPremiumDeals.map((deal) => (
            <div key={deal.id} className="group relative rounded-3xl border border-amber-200/50 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-lg sm:p-6">
              <div className="absolute right-4 top-4"><Badge variant="primary">Premium</Badge></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--color-surface-muted)] text-2xl">{deal.image}</div>
              <p className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{deal.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-lg font-bold text-amber-600">{deal.price}</span>
                <span className="text-sm text-[var(--color-text-muted)] line-through">{deal.was}</span>
                <Badge variant="warning">{deal.discount}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-amber-200/30 bg-gradient-to-br from-amber-50/30 to-transparent p-6 shadow-[var(--shadow-lg)] dark:from-amber-950/10 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">Premium benefits</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm text-[var(--color-text-primary)]">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default PremiumDealsPage
