import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import Badge from '@shared/ui/badge/Badge'
import Alert from '@shared/ui/alert/Alert'
import { productService } from '@api/services'
import { SeoHead } from '@shared/seo/SeoHead'

const PremiumDealsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productService.getDealProducts()
      .then((items) => {
        if (!cancelled) {
          const premium = items.filter((p) => p.isPremium || p.premiumDeal)
          setProducts(premium)
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const benefits = [
    'Early access to all flash deals',
    'Extra 10% off premium deals',
    'Free delivery on orders over KES 1,000',
    'Exclusive member-only products',
    'Priority customer support',
  ]

  const getTimeDisplay = (timeLeft) => {
    if (!timeLeft || timeLeft.totalHours < 0) return 'Limited time'
    if (timeLeft.totalHours < 1) {
      return `${Math.floor(timeLeft.minutes)}m ${Math.floor(timeLeft.seconds)}s`
    }
    return `${Math.floor(timeLeft.totalHours)}h ${Math.floor(timeLeft.minutes % 60)}m`
  }

  return (
    <PageShell>
      <SeoHead
        title="Premium Deals & Exclusive Offers"
        description="Unlock member-only savings and exclusive discounts on Nile Flow. Premium benefits included."
        keywords={['premium', 'deals', 'exclusive', 'members', 'discount']}
      />
      <div
        className="relative overflow-hidden bg-gradient-to-br from-amber-50/50 via-emerald-50/30 to-amber-50/50 px-4 py-8 sm:py-10 text-center"
        style={{
          backgroundImage: 'url(/Premium Rewards Banner.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-white/50" />
        <div className="relative z-10">
        <Badge variant="primary" className="mb-4">⭐ Premium Member</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
          Exclusive Premium Deals
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">
          Special discounts reserved for Nile Flow Premium members. Upgrade to unlock savings of up to 43%.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/products?featured=true" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-emerald-500 hover:text-emerald-600">
            Browse all products
          </Link>
          <Link to="/deals" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-emerald-500 hover:text-emerald-600">
            Flash sales
          </Link>
        </div>
        </div>
      </div>

      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        <Alert
          title="Premium Benefits Active"
          description="You're seeing exclusive member pricing. Upgrade today to unlock all benefits."
          tone="info"
          className="mb-8"
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-emerald-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <Badge variant="secondary" className="mb-4">No premium deals</Badge>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Premium deals coming soon</h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Check back later or browse our featured products.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.$id}
                className="group relative rounded-3xl border-2 border-amber-200/30 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)] transition-all duration-300 hover:shadow-xl sm:p-6"
              >
                <div className="absolute right-3 top-3 z-10">
                  <Badge variant="primary" className="text-xs font-bold">PREMIUM</Badge>
                </div>
                <div className="absolute left-3 top-3 z-10">
                  <Badge variant="warning" className="text-xs font-bold">EXCLUSIVE</Badge>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-gradient-to-r from-amber-100 to-amber-200 text-2xl">
                  {product.image}
                </div>
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">{product.category}</p>
                <p className="mt-1 text-base font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-600">
                  {product.productName}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-amber-600">{product.dealPrice}</span>
                    <span className="text-sm text-[var(--color-text-muted)] line-through">{product.price}</span>
                  </div>
                  <Badge variant="success" className="text-xs font-bold">
                    {product.discount}% OFF
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3" />
                  </svg>
                  <span>{getTimeDisplay(product.timeLeft)}</span>
                </div>

                <Link
                  to={`/products/${product.productId || product.$id}`}
                  className="mt-4 block w-full rounded-full bg-[var(--color-surface-muted)] px-4 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-emerald-600 hover:text-white active:scale-95"
                >
                  View product
                </Link>
              </div>
            ))}
          </div>
        )}

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
