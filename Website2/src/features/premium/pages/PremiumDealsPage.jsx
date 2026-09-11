import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import { productService } from '@api/services'
import { SeoHead } from '@shared/seo/SeoHead'
import { imageProxyUrl } from '@api/config'
import { Crown, Flame, Clock, ArrowRight, Zap } from 'lucide-react'

// ── Countdown Hook ───────────────────────────────────────────────────────────
// Accepts an ISO timestamp string and counts down to it each second.
// Reads via ref so the interval doesn't need to restart when the prop changes.
function useCountdown(endTime) {
  const [display, setDisplay] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const intervalRef = useRef(null)
  const endTimeRef = useRef(endTime)

  useEffect(() => {
    endTimeRef.current = endTime
  }, [endTime])

  useEffect(() => {
    if (!endTime) return

    const formatTime = () => {
      const target = new Date(endTimeRef.current).getTime()
      const now = Date.now()
      const totalSeconds = Math.max(0, Math.floor((target - now) / 1000))
      if (totalSeconds <= 0) {
        setIsExpired(true)
        return '00:00:00'
      }
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    setDisplay(formatTime())
    intervalRef.current = setInterval(() => {
      setDisplay(formatTime())
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — interval must not restart

  return { display, isExpired }
}

// ── Premium Deal Card Component ──────────────────────────────────────────────
function PremiumDealCard({ product, discount }) {
  const { display: countdown, isExpired } = useCountdown(product.endTime)

  return (
    <div
      className="group relative rounded-2xl border-2 border-purple-500 bg-[var(--color-surface)] shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-purple-600"
    >
      {/* Premium Badge */}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 z-10">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] sm:text-xs font-bold">
          <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> PREMIUM
        </span>
        {discount >= 40 && (
          <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-black animate-pulse">
            BEST VALUE
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative px-2 pt-12 pb-2 sm:px-4 sm:pt-16 sm:pb-4">
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg bg-gradient-to-br from-purple-500 to-pink-500">
          -{discount}%
        </div>
        <img
          src={product.image ? imageProxyUrl(product.image, 400, 90) : '/logo.png'}
          alt={product.productName}
          className="w-full h-36 sm:h-48 object-cover rounded-xl bg-[var(--color-surface-muted)]"
          onError={(e) => { e.target.src = '/logo.png' }}
        />
      </div>

      {/* Content */}
      <div className="px-2 pb-2 sm:px-4 sm:pb-4">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5 sm:mb-1">
          {product.category}
        </p>
        <h3 className="font-bold text-[var(--color-text-primary)] text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-2 sm:mb-3 group-hover:text-purple-600 transition-colors">
          {product.productName}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-base sm:text-xl font-black text-purple-600">
            KES {product.dealPrice?.toLocaleString?.() ?? product.dealPrice}
          </span>
          <span className="text-xs sm:text-sm text-[var(--color-text-muted)] line-through">
            KES {product.price?.toLocaleString?.() ?? product.price}
          </span>
        </div>

        {/* Countdown */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-2 sm:mb-3 ${
          isExpired
            ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
            : 'bg-purple-50 text-purple-700 animate-pulse'
        }`}>
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
          {isExpired ? (
            <span className="text-[10px] sm:text-xs font-medium">Deal Expired</span>
          ) : (
            <span className="text-[10px] sm:text-xs font-mono font-bold">{countdown}</span>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/deal/${product.$id}`}
          className="block w-full text-center py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isExpired ? 'Deal Ended' : 'Shop Now →'}
        </Link>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
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

  return (
    <PageShell>
      <SeoHead
        title="Premium Deals & Exclusive Offers"
        description="Unlock member-only savings and exclusive discounts on Nile Flow. Premium benefits included."
        keywords={['premium', 'deals', 'exclusive', 'members', 'discount']}
      />

      {/* ── Hero Section ── */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 px-4 py-12 text-center sm:py-16"
        style={{
          backgroundImage: 'url(/Premium Rewards Banner.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-purple-950/60 to-black/80" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold animate-pulse">
              <Crown className="w-3 h-3" /> EXCLUSIVE ACCESS
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
            <span className="text-purple-300">Premium</span> Members
            <span className="text-purple-400"> Only</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-200">
            Special discounts reserved for Nile Flow Premium members.
            Unlock savings of up to <span className="font-bold text-purple-400">43%</span> on exclusive products.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/products?featured=true"
              className="inline-flex items-center gap-2 min-h-11 rounded-full border-2 border-purple-400/40 bg-purple-500/20 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/30 hover:border-purple-400"
            >
              Browse All Products
            </Link>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 min-h-11 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-xl transition hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              View All Deals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Benefits Banner ── */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" /> Premium Members Save More
          </span>
          <span className="hidden sm:inline text-purple-200">|</span>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Early Access to Flash Sales
          </span>
          <span className="hidden sm:inline text-purple-200">|</span>
          <span className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-yellow-400" /> Extra 10% Off Deals
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        {/* Results Count */}
        <div className="mb-6 text-sm text-[var(--color-text-muted)]">
          Showing <span className="font-semibold text-purple-600">{products.length}</span> premium deals
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-600 animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Loading premium deals...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-12 text-center">
            <div className="text-6xl mb-4">👑</div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Premium deals coming soon</h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Exclusive member offers are being prepared. Check back soon!
            </p>
            <Link
              to="/featured-products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Browse Featured Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => {
              const discount = product.discount || 0
              return (
                <PremiumDealCard
                  key={product.$id}
                  product={product}
                  discount={discount}
                />
              )
            })}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-12 rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-transparent p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-600">Premium Benefits</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm text-[var(--color-text-primary)] font-medium">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default PremiumDealsPage
