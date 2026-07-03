import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import Alert from '@shared/ui/alert/Alert'

const mockDeals = [
  { id: 1, name: 'Nile Premium Coffee', price: 'KES 1,200', was: 'KES 1,800', discount: '-33%', image: '☕', category: 'Beverages' },
  { id: 2, name: 'Handwoven Basket Set', price: 'KES 2,400', was: 'KES 3,600', discount: '-33%', image: '🧺', category: 'Home & Living' },
  { id: 3, name: 'Organic Shea Butter Trio', price: 'KES 1,900', was: 'KES 2,850', discount: '-33%', image: '🧴', category: 'Beauty' },
  { id: 4, name: 'Maasai Beaded Collection', price: 'KES 1,200', was: 'KES 1,800', discount: '-33%', image: '📿', category: 'Accessories' },
  { id: 5, name: 'Ethiopian Yirgacheffe', price: 'KES 1,500', was: 'KES 2,000', discount: '-25%', image: '☕', category: 'Beverages' },
  { id: 6, name: 'Kenyan Honey Pack', price: 'KES 800', was: 'KES 1,200', discount: '-33%', image: '🍯', category: 'Groceries' },
]

const categories = ['All', 'Beverages', 'Home & Living', 'Beauty', 'Accessories', 'Groceries']

function DealsPage() {
  return (
    <PageShell>
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-accent)]/10 px-4 py-14 text-center sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Limited time</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Flash deals</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">
          Up to 50% off on handpicked African products. These deals won't last — grab yours before they're gone.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link to="/products"><PrimaryButton>Shop all deals</PrimaryButton></Link>
          <Link to="/premium-deals" className="min-h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
            Premium deals
          </Link>
        </div>
      </div>

      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              cat === 'All' ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
            }`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockDeals.map((deal) => (
            <Link key={deal.id} to={`/products/${deal.id}`} className="group rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--color-surface-muted)] text-2xl">
                  {deal.image}
                </div>
                <Badge variant="warning">{deal.discount}</Badge>
              </div>
              <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">{deal.category}</p>
              <p className="mt-1 text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">{deal.name}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-lg font-bold text-[var(--color-accent)]">{deal.price}</span>
                <span className="text-sm text-[var(--color-text-muted)] line-through">{deal.was}</span>
              </div>
            </Link>
          ))}
        </div>

        <Alert title="Join Nile Flow Premium" description="Get early access to deals and an extra 10% off select items." tone="info" className="mt-8">
          <Link to="/premium-deals" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]">
            Learn more
          </Link>
        </Alert>
      </ResponsiveSection>
    </PageShell>
  )
}

export default DealsPage
