import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'
import ProductCard from '@shared/ui/product-card/ProductCard'
import BannerCarousel from '@shared/ui/banner-carousel/BannerCarousel'
import { productService } from '@api/services'

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
  const [loading, setLoading] = useState(true)

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
      }
    }

    loadBanners()
    return () => { cancelled = true }
  }, [])

  return (
    <PageShell>
      <SeoHead title='Home - Shop Smarter' description='Discover everyday essentials, premium finds, and trusted local sellers on Nile Flow.' keywords={['home','shopping','featured']} />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <BannerCarousel banners={banners} />
      </div>

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
            <div className="col-span-full flex items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-sm text-[var(--color-text-secondary)]">
              Loading featured products...
            </div>
          ) : (
            featuredProducts.map((product) => (
              <ProductCard
                key={product.$id || product.id}
                product={product}
                href={`/products/${product.$id || product.id}`}
                compact
              />
            ))
          )}
        </div>
      </section>
    </PageShell>
  )
}

export default HomePage