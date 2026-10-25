import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'
import ProductCard from '@shared/ui/product-card/ProductCard'
import BannerCarousel from '@shared/ui/banner-carousel/BannerCarousel'
import { businessService, categoryService, productService } from '@api/services'
import { imageProxyUrl } from '@api/config'
import BusinessBanner from '@features/businesses/components/BusinessBanner'
import { BUSINESS_HOME_LIMIT } from '@features/businesses/data/businesses'

const fallbackProducts = [
  {
    id: 'demo-1',
    productName: 'Everyday Essentials Bundle',
    price: 2400,
    description: 'Fresh staples and household favorites delivered fast.',
    image: '/logo.png',
    featured: true,
  },
  {
    id: 'demo-2',
    productName: 'Premium Local Artisan Set',
    price: 5600,
    description: 'Handpicked goods from trusted merchants across the region.',
    image: '/logo.png',
    premium: true,
  },
  {
    id: 'demo-3',
    productName: 'Smart Tech Starter Pack',
    price: 18200,
    description: 'Reliable devices and accessories for everyday life.',
    image: '/logo.png',
    featured: true,
  },
]

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState(fallbackProducts)
  const [banners, setBanners] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [bannersLoading, setBannersLoading] = useState(true)
  const [dealsLoading, setDealsLoading] = useState(true)
  const [dealCounts, setDealCounts] = useState({ flash: 0, deals: 0, endingSoon: 0 })
  const [businesses, setBusinesses] = useState([])
  const [businessesLoading, setBusinessesLoading] = useState(true)
  const [businessesError, setBusinessesError] = useState(null)
  const [businessRetryKey, setBusinessRetryKey] = useState(0)
  const categoryRailRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productService.getFeaturedProducts(true)
      .then((items) => {
        if (!cancelled) setFeaturedProducts(items.slice(0, 4).length ? items.slice(0, 4) : fallbackProducts)
      })
      .catch(() => {
        if (!cancelled) setFeaturedProducts(fallbackProducts)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    businessService.getBusinesses({ page: 1, limit: BUSINESS_HOME_LIMIT })
      .then((result) => {
        if (!cancelled) setBusinesses(result.businesses)
      })
      .catch((requestError) => {
        if (!cancelled) setBusinessesError(requestError.message || 'Unable to load businesses.')
      })
      .finally(() => {
        if (!cancelled) setBusinessesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [businessRetryKey])

  useEffect(() => {
    let cancelled = false
    setDealsLoading(true)
    Promise.all([
      productService.getDealProducts(),
      productService.getFlashSales(),
    ])
      .then(([deals, flashSales]) => {
        if (cancelled) return
        const flashIds = new Set(flashSales.map((sale) => sale.productId || sale.$id))
        const endingSoon = deals.filter((deal) => deal.isExpiringSoon).length
        setDealCounts({
          flash: flashSales.length,
          deals: deals.filter((deal) => !deal.isFlash && !deal.premiumDeal && !flashIds.has(deal.productId || deal.$id)).length,
          endingSoon,
        })
      })
      .catch(() => {
        if (!cancelled) setDealCounts({ flash: 0, deals: 0, endingSoon: 0 })
      })
      .finally(() => {
        if (!cancelled) setDealsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const rail = categoryRailRef.current
    if (!rail || categories.length === 0) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    let animationFrame
    let resumeTimer
    let paused = false

    const pause = () => {
      paused = true
      window.clearTimeout(resumeTimer)
    }

    const resumeSoon = () => {
      window.clearTimeout(resumeTimer)
      resumeTimer = window.setTimeout(() => {
        paused = false
      }, 1800)
    }

    const scroll = () => {
      if (!paused && rail.scrollWidth > rail.clientWidth) {
        const maxScroll = rail.scrollWidth - rail.clientWidth
        rail.scrollLeft += 0.35
        if (rail.scrollLeft >= maxScroll - 1) rail.scrollLeft = 0
      }
      animationFrame = window.requestAnimationFrame(scroll)
    }

    rail.addEventListener('pointerenter', pause)
    rail.addEventListener('pointerleave', resumeSoon)
    rail.addEventListener('pointerdown', pause)
    rail.addEventListener('pointerup', resumeSoon)
    rail.addEventListener('wheel', pause, { passive: true })
    rail.addEventListener('touchstart', pause, { passive: true })
    rail.addEventListener('touchend', resumeSoon, { passive: true })
    rail.addEventListener('focusin', pause)
    rail.addEventListener('focusout', resumeSoon)
    animationFrame = window.requestAnimationFrame(scroll)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(resumeTimer)
      rail.removeEventListener('pointerenter', pause)
      rail.removeEventListener('pointerleave', resumeSoon)
      rail.removeEventListener('pointerdown', pause)
      rail.removeEventListener('pointerup', resumeSoon)
      rail.removeEventListener('wheel', pause)
      rail.removeEventListener('touchstart', pause)
      rail.removeEventListener('touchend', resumeSoon)
      rail.removeEventListener('focusin', pause)
      rail.removeEventListener('focusout', resumeSoon)
    }
  }, [categories])

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    categoryService.getCategories()
      .then((items) => {
        if (!cancelled) setCategories(Array.isArray(items) ? items : [])
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  // Use a direct fetch for banners (public endpoint) to avoid race conditions
  // with the httpClient not being ready yet on initial page load / refresh.
  useEffect(() => {
    let cancelled = false
    const API_BASE = 'https://nile-flow-backend-5dqm.onrender.com'

    const loadBanners = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/banners`, {
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          const data = Array.isArray(json?.data) ? json.data : []
          setBanners(data.length > 0 ? data : null)
        }
      } catch {
        if (!cancelled) setBanners(null)
      } finally {
        if (!cancelled) setBannersLoading(false)
      }
    }

    loadBanners()
    return () => { cancelled = true }
  }, [])

  return (
    <PageShell>
      <SeoHead title='Home - Shop Smarter' description='Discover everyday essentials, premium finds, and trusted local sellers on Nile Flow.' keywords={['home','shopping','featured']} />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {bannersLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] sm:h-64">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" aria-label="Loading banners" />
          </div>
        ) : (
          <BannerCarousel banners={banners} />
        )}
      </div>

      {categoriesLoading ? (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8" aria-label="Loading categories">
          <div className="mb-5 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--color-surface-muted)]" />
            <div className="h-7 w-56 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-40 w-36 shrink-0 animate-pulse rounded-2xl bg-[var(--color-surface-muted)] sm:w-40" />
            ))}
          </div>
        </section>
      ) : categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8" aria-labelledby="home-categories-heading">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Shop by category</p>
              <h2 id="home-categories-heading" className="mt-1 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
                Find what you need
              </h2>
            </div>
            <Link to="/products" className="shrink-0 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          </div>

          <div
            ref={categoryRailRef}
            className="-mx-4 mt-5 overflow-x-auto overflow-y-hidden scrollbar-none sm:mx-0"
            aria-label="Browse product categories"
          >
            <div className="flex w-max gap-3 px-4 pb-2 sm:w-auto sm:flex-wrap sm:px-0">
              {categories.map((category) => {
                const categoryName = category?.name || category?.category || category?.title || 'Category'
                const categoryId = category?.$id || category?.id || category?.categoryId || categoryName
                const rawImage = category?.img || category?.image || category?.imgUrl || category?.imageUrl || ''
                const imageValue = typeof rawImage === 'object'
                  ? rawImage.url || rawImage.imageUrl || rawImage.href || ''
                  : rawImage
                const categoryImage = imageValue && (
                  imageValue.includes('appwrite.io') || imageValue.includes('/v1/storage/') || imageValue.includes('/api/image-proxy?')
                )
                  ? imageProxyUrl(imageValue, 180, 75)
                  : imageValue
                const slug = category?.slug || categoryName.toLowerCase().trim().replace(/\s+/g, '-')

                return (
                  <Link
                    key={categoryId}
                    to={`/category/${slug}`}
                    className="group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[var(--shadow-md)] sm:w-40"
                  >
                    <div className="h-24 overflow-hidden bg-[var(--color-surface-muted)] sm:h-28">
                      <img
                        src={categoryImage || '/logo.png'}
                        alt={categoryName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(event) => { event.currentTarget.src = '/logo.png' }}
                      />
                    </div>
                    <span className="truncate px-3 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
                      {categoryName}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8" aria-labelledby="home-businesses-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Meet the local makers
            </p>
            <h2 id="home-businesses-heading" className="mt-1 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
              Discover local businesses
            </h2>
          </div>
          <Link to="/businesses" className="shrink-0 rounded-sm text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            See all businesses
          </Link>
        </div>

        {businessesLoading ? (
          <div aria-label="Loading businesses" className="mt-5 flex gap-4 overflow-hidden">
            {[0, 1, 2].map((item) => (
              <div key={item} className="w-[min(82vw,24rem)] shrink-0 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:w-[22rem]">
                <div className="aspect-video animate-pulse bg-[var(--color-surface-muted)]" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                  <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : businessesError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
            <p className="text-sm leading-6 text-red-800">{businessesError}</p>
            <button
              type="button"
              onClick={() => {
                setBusinessesError(null)
                setBusinessesLoading(true)
                setBusinessRetryKey((current) => current + 1)
              }}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : businesses.length > 0 ? (
          <div className="-mx-4 mt-5 overflow-x-auto overflow-y-hidden scrollbar-none sm:mx-0">
            <ul aria-label="Active businesses" className="flex w-max list-none gap-4 px-4 pb-3 sm:px-0">
              {businesses.slice(0, BUSINESS_HOME_LIMIT).map((business) => (
                <li key={business.id} className="w-[min(82vw,24rem)] shrink-0 sm:w-[22rem]">
                  <BusinessBanner business={business} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-[var(--color-surface-muted)] p-5 text-sm text-[var(--color-text-secondary)]">
            No active businesses are available yet.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8" aria-labelledby="home-deals-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">Save more today</p>
            <h2 id="home-deals-heading" className="mt-1 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
              Deals and special offers
            </h2>
          </div>
          <Link to="/deals" className="shrink-0 text-sm font-semibold text-red-600 hover:text-red-700">
            View all
          </Link>
        </div>

        <div className="-mx-4 mt-5 overflow-x-auto overflow-y-hidden scrollbar-none sm:mx-0" aria-label={dealsLoading ? 'Loading deals' : 'Browse deals'}>
          <div className="flex w-max gap-3 px-4 pb-2 sm:w-auto sm:flex-wrap sm:px-0">
            {dealsLoading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="h-20 w-44 shrink-0 animate-pulse rounded-2xl bg-[var(--color-surface-muted)] sm:w-52" />
              ))
            ) : (
              [
                { type: 'flash', label: 'Flash Sales', count: dealCounts.flash, icon: '⚡', tone: 'from-red-600 to-orange-500' },
                { type: 'product', label: 'Deals', count: dealCounts.deals, icon: '🏷️', tone: 'from-amber-500 to-orange-500' },
                { type: 'ending-soon', label: 'Ending Soon', count: dealCounts.endingSoon, icon: '⏱️', tone: 'from-rose-500 to-red-500' },
              ].map((offer) => (
                <Link
                  key={offer.type}
                  to={`/deals?type=${offer.type}`}
                  className={`flex w-44 shrink-0 items-center gap-3 rounded-2xl bg-gradient-to-r ${offer.tone} p-4 text-white shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)] sm:w-52`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl" aria-hidden="true">
                    {offer.icon}
                  </span>
                  <span className="min-w-0 font-semibold">
                    <span className="block">{offer.label}</span>
                    <span className="text-xs font-normal text-white/80">{offer.count} active</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Featured products</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Popular picks right now</h2>
          </div>
          <Link to="/featured-products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Explore all Featured products →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
                <div className="h-40 animate-pulse bg-[var(--color-surface-muted)] sm:h-48" />
                <div className="space-y-3 p-4 sm:p-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                </div>
              </div>
            ))
          ) : (
            featuredProducts.map((product) => {
              const productId = product?.productId || product?.$id || product?.id
              return (
                <ProductCard
                  key={productId}
                  product={product}
                  href={`/products/${productId}`}
                  compact
                />
              )
            })
          )}
        </div>
      </section>
    </PageShell>
  )
}

export default HomePage