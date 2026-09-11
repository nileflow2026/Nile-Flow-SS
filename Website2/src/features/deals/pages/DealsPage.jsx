import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import Badge from '@shared/ui/badge/Badge'
import { productService } from '@api/services'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { SeoHead } from '@shared/seo/SeoHead'

const DealsPage = () => {
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('type') || 'all'
  const [filter, setFilter] = useState(initialFilter)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [flashSales, setFlashSales] = useState([])
  const { push } = useToast()

  const categories = [
    { value: 'all', label: 'All Deals' },
    { value: 'product', label: 'Product Deals' },
    { value: 'flash', label: 'Flash Sales' },
    { value: 'premium', label: 'Premium Deals' },
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      const deals = await productService.getDealProducts()
      const flash = await productService.getFlashSales()
      setProducts(deals)
      setFlashSales(flash)
    } catch (error) {
      console.error('Failed to fetch deals:', error)
      push({ title: 'Error', message: 'Could not load deals. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredProducts = products.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'flash') return flashSales.some((f) => f.productId === p.productId)
    if (filter === 'premium') return p.isPremium || p.premiumDeal
    return true
  })

  const getBadgeVariant = (discount) => {
    if (discount >= 50) return 'warning'
    if (discount >= 30) return 'success'
    return 'secondary'
  }

  const getTimeDisplay = (timeLeft) => {
    if (!timeLeft || timeLeft.totalHours < 0) return 'No time limit'
    if (timeLeft.totalHours < 1) {
      return `${Math.floor(timeLeft.minutes)}m ${Math.floor(timeLeft.seconds)}s`
    }
    return `${Math.floor(timeLeft.totalHours)}h ${Math.floor(timeLeft.minutes % 60)}m`
  }

  return (
    <PageShell>
      <SeoHead
        title="Deals & Flash Sales"
        description="Exclusive discounts and limited-time offers on Nile Flow products."
        keywords={['deals', 'flash sale', 'discount', 'premium', 'shopping']}
      />
      <div
        className="relative overflow-hidden bg-gradient-to-br from-emerald-50/50 via-amber-50/30 to-orange-50/50 px-4 py-8 sm:py-10 text-center"
        style={{
          backgroundImage: 'url(/DealImage.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-white/50" />
        <div className="relative z-10">
        <Badge variant="danger" className="mb-4">🔥 Hot Deals</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
          Limited-Time Savings
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Up to 50% off on handpicked African products. These deals won't last — grab yours before they're gone.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/products?featured=true" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-emerald-500 hover:text-emerald-600">
            Browse all products
          </Link>
          <Link to="/featured-products" className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95">
            Shop featured
          </Link>
        </div>
        </div>
      </div>

      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                cat.value === filter
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-500 hover:text-emerald-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-emerald-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <Badge variant="secondary" className="mb-4">No active deals</Badge>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">All deals sold out</h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Check back later or browse our featured products for new arrivals.
            </p>
            <Link to="/featured-products" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Shop featured
            </Link>
          </div>
        ) : (
          <>
            {filter === 'all' && flashSales.length > 0 && (
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-50/30 to-orange-50/30 p-5 shadow-[var(--shadow-sm)] dark:from-red-950/20 dark:to-orange-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="danger" className="mb-2">⚡ Flash Sale</Badge>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Lightning deals ending soon</p>
                  </div>
                  <Badge variant="danger" className="text-xs">Limited stock</Badge>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.$id}
                  className="group relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:p-6"
                >
                  {(product.isPremium || product.premiumDeal) && (
                    <div className="absolute right-3 top-3 z-10">
                      <Badge variant="primary" className="text-xs font-bold">PREMIUM</Badge>
                    </div>
                  )}

                  {flashSales.some((f) => f.productId === product.productId) && (
                    <div className="absolute left-3 top-3 z-10">
                      <Badge variant="danger" className="text-xs font-bold">⚡ FLASH</Badge>
                    </div>
                  )}

                  <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--color-surface-muted)] text-2xl">
                    {product.image}
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">{product.category}</p>
                  <p className="mt-1 text-base font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-600">
                    {product.productName}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-amber-600">{product.dealPrice}</span>
                      <span className="text-sm text-[var(--color-text-muted)] line-through">{product.price}</span>
                    </div>
                    <Badge variant={getBadgeVariant(product.discount)} className="text-xs font-bold">
                      {product.discount}% OFF
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8v4l3 3" />
                    </svg>
                    <span>{getTimeDisplay(product.timeLeft)}</span>
                    {product.isExpiringSoon && (
                      <Badge variant="danger" className="text-xs">Ending soon</Badge>
                    )}
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
          </>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default DealsPage
