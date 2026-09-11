import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import { productService } from '@api/services'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { SeoHead } from '@shared/seo/SeoHead'
import { imageProxyUrl } from '@api/config'
import { Zap, Flame, Clock, ArrowRight, Tag } from 'lucide-react'

// ── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const [display, setDisplay] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const intervalRef = useRef(null)
  const endTimeRef = useRef(endTime)

  // Keep ref in sync when endTime prop changes (e.g. after manual refresh)
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — interval must not restart; endTime is accessed via ref

  return { display, isExpired }
}

// ── Urgency Badge Component ──────────────────────────────────────────────────
function UrgencyBadge({ discount, isExpiringSoon, isFlash, isPremium }) {
  if (isFlash) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
        <Zap className="w-3 h-3" />
        FLASH SALE
      </div>
    )
  }
  if (isPremium) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">
        <Flame className="w-3 h-3" />
        PREMIUM
      </div>
    )
  }
  if (discount >= 50) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
        <Tag className="w-3 h-3" />
        MEGA DEAL
      </div>
    )
  }
  if (isExpiringSoon) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
        <Clock className="w-3 h-3" />
        ENDING SOON
      </div>
    )
  }
  return null
}

// ── Deal Card Component ──────────────────────────────────────────────────────
function DealCard({ product, isFlash, isPremium, discount }) {
  const { display: countdown, isExpired } = useCountdown(product.endTime)

  return (
    <div
      className={`group relative rounded-2xl border-2 bg-[var(--color-surface)] shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        isFlash
          ? 'border-red-500 hover:border-red-600'
          : isPremium
          ? 'border-purple-500 hover:border-purple-600'
          : discount >= 50
          ? 'border-orange-500 hover:border-orange-600'
          : 'border-[var(--color-border)] hover:border-red-400'
      }`}
    >
      {/* Top Badges */}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 z-10">
        <UrgencyBadge
          discount={discount}
          isExpiringSoon={product.isExpiringSoon}
          isFlash={isFlash}
          isPremium={isPremium}
        />
        {discount >= 50 && (
          <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-black animate-pulse">
            BEST VALUE
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative px-2 pt-12 pb-2 sm:px-4 sm:pt-16 sm:pb-4">
        <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg ${
          discount >= 50 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-br from-red-500 to-orange-500'
        }`}>
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
        {/* Category */}
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5 sm:mb-1">
          {product.category}
        </p>

        {/* Product Name */}
        <h3 className="font-bold text-[var(--color-text-primary)] text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-2 sm:mb-3 group-hover:text-red-600 transition-colors">
          {product.productName}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-base sm:text-xl font-black text-red-600">
            KES {product.dealPrice?.toLocaleString?.() ?? product.dealPrice}
          </span>
          <span className="text-xs sm:text-sm text-[var(--color-text-muted)] line-through">
            KES {product.price?.toLocaleString?.() ?? product.price}
          </span>
        </div>

        {/* Countdown Timer */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-2 sm:mb-3 ${
          isExpired
            ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
            : product.isExpiringSoon
            ? 'bg-red-50 text-red-700 animate-pulse'
            : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
        }`}>
          <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${product.isExpiringSoon ? 'text-red-600' : ''}`} />
          {isExpired ? (
            <span className="text-[10px] sm:text-xs font-medium">Deal Expired</span>
          ) : (
            <span className="text-[10px] sm:text-xs font-mono font-bold">{countdown}</span>
          )}
        </div>

        {/* CTA Button */}
        <Link
          to={`/products/${product.productId || product.$id}`}
          className={`block w-full text-center py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
            isFlash
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl'
              : isPremium
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] hover:bg-red-600 hover:text-white'
          }`}
        >
          {isExpired ? 'Deal Ended' : 'View Deal →'}
        </Link>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
const DealsPage = () => {
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('type') || 'all'
  const [filter, setFilter] = useState(initialFilter)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [flashSales, setFlashSales] = useState([])
  const [globalTimeLeft, setGlobalTimeLeft] = useState(null)
  const { push } = useToast()

  const categories = [
    { value: 'all', label: 'All Deals', icon: '🔥' },
    { value: 'product', label: 'Product Deals', icon: '🏷️' },
    { value: 'flash', label: 'Flash Sales', icon: '⚡' },
    { value: 'premium', label: 'Premium', icon: '⭐' },
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      const [deals, flash] = await Promise.all([
        productService.getDealProducts(),
        productService.getFlashSales(),
      ])
      setProducts(deals)
      setFlashSales(flash)
      // DEBUG: log for flash filter matching
      if (flash.length > 0) {
        console.log('[DEBUG] Flash sale productIds:', flash.map(f => f.productId))
      }
      if (deals.length > 0) {
        console.log('[DEBUG] Deal productIds:', deals.slice(0, 3).map(d => d.productId))
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error)
      push({ title: 'Error', message: 'Could not load deals. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Update global countdown from all deals
  useEffect(() => {
    if (products.length === 0) return
    const nearest = products.reduce((min, p) => {
      if (!p.timeLeft) return min
      const totalSec = p.timeLeft.totalHours * 3600 + p.timeLeft.minutes * 60 + p.timeLeft.seconds
      return totalSec < (min?.totalSeconds ?? Infinity)
        ? { ...p.timeLeft, productId: p.$id, totalSeconds: totalSec }
        : min
    }, null)
    setGlobalTimeLeft(nearest)
  }, [products])

  const filteredProducts = products.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'flash') return flashSales.some((f) => f.productId === p.productId)
    if (filter === 'premium') return p.isPremium || p.premiumDeal
    return true
  })

  const isFilteredFlash = filter === 'flash'

  return (
    <PageShell>
      <SeoHead
        title="Deals & Flash Sales"
        description="Exclusive discounts and limited-time offers on Nile Flow products."
        keywords={['deals', 'flash sale', 'discount', 'premium', 'shopping']}
      />

      {/* ── Hero Section ── */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-red-950 via-orange-950 to-amber-950 px-4 py-12 text-center sm:py-16"
        style={{
          backgroundImage: 'url(/DealImage.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
              <Flame className="w-3 h-3" /> HOT DEALS
            </span>
            {globalTimeLeft && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-600/90 text-white text-xs font-bold">
                <Clock className="w-3 h-3" />
                Ends in {globalTimeLeft.totalHours}h {globalTimeLeft.minutes}m
              </span>
            )}
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
            <span className="text-red-400">Limited-Time</span> Savings
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-200">
            Up to <span className="font-bold text-red-400">50% off</span> on handpicked African products.
            These deals won't last — grab yours before they're gone.
          </p>

          <div className="mt-8 flex flex-nowrap items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 min-h-10 sm:min-h-11 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 hover:border-white/50"
            >
              Browse All Products
            </Link>
            <Link
              to="/featured-products"
              className="inline-flex items-center gap-2 min-h-10 sm:min-h-11 rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xl transition hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              Shop Featured Deals
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Flash Sale Ticker ── */}
      {flashSales.length > 0 && !isFilteredFlash && (
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm font-bold animate-pulse">
                <Zap className="w-5 h-5 text-yellow-300" />
                ⚡ FLASH SALE ACTIVE
              </span>
              <span className="text-xs text-red-100 hidden sm:inline">
                {flashSales.length} deals ending soon
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-black/20 px-3 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              <span>Next flash deal ends in: {(() => {
                const nearest = flashSales.reduce((min, f) => {
                  if (!f.timeLeft) return min
                  const total = f.timeLeft.totalHours * 3600 + f.timeLeft.minutes * 60 + f.timeLeft.seconds
                  return total < (min?.total ?? Infinity) ? { ...f.timeLeft, total } : min
                }, null)
                if (!nearest) return '--:--:--'
                const h = Math.floor(nearest.total / 3600)
                const m = Math.floor((nearest.total % 3600) / 60)
                const s = nearest.total % 60
                return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
              })()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        {/* Category Filters - Scrollable on small screens */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 justify-start sm:justify-center min-w-max px-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  cat.value === filter
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-105'
                    : 'bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-red-400 hover:text-red-600'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
                {cat.value === 'flash' && flashSales.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 rounded-full text-white">
                    {flashSales.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-6 h-6 text-red-600 animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Loading amazing deals...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-12 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No deals found</h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Try adjusting your filters or check back later for new deals.
            </p>
            <Link
              to="/featured-products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Browse Featured Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6 text-sm text-[var(--color-text-muted)]">
              Showing <span className="font-semibold text-red-600">{filteredProducts.length}</span> deals
              {filter !== 'all' && <span> in <span className="font-semibold">{categories.find(c => c.value === filter)?.label}</span></span>}
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => {
                const isFlash = flashSales.some((f) => f.productId === product.productId)
                const isPremium = product.isPremium || product.premiumDeal
                const discount = product.discount || 0

                return (
                  <DealCard
                    key={product.$id}
                    product={product}
                    isFlash={isFlash}
                    isPremium={isPremium}
                    discount={discount}
                  />
                )
              })}
            </div>
          </>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default DealsPage
