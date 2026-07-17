import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'
import ProductCard from '@shared/ui/product-card/ProductCard'
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

const quickPillars = [
  { title: 'Secure checkout', description: 'Fast payments with trusted protection.' },
  { title: 'Fast delivery', description: 'Quick dispatch from local merchants.' },
  { title: 'Premium perks', description: 'Unlock deals and bonus rewards.' },
]

function HomePage() { 
  const [featuredProducts, setFeaturedProducts] = useState(fallbackProducts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const result = await productService.getFeaturedProducts()
        const items = result?.slice(0, 6) || []
        setFeaturedProducts(items.length ? items : fallbackProducts)
      } catch {
        setFeaturedProducts(fallbackProducts)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const heroProducts = useMemo(() => featuredProducts.slice(0, 3), [featuredProducts])

  return (
    <PageShell>
      <SeoHead title='Home - Shop Smarter' description='Discover everyday essentials, premium finds, and trusted local sellers on Nile Flow.' keywords={['home','shopping','featured']} />
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_46%),linear-gradient(135deg,_rgba(16,185,129,0.14)_0%,_var(--color-background)_45%,_rgba(245,158,11,0.14)_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full border border-emerald-200 bg-[var(--color-surface)]/80 px-3 py-1 text-sm font-semibold text-emerald-700 shadow-sm">
              Africa-ready shopping, reimagined
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Shop smarter with Nile Flow.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
              Discover everyday essentials, premium finds, and trusted local sellers in one calm, modern marketplace built for convenience.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/products" className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Browse products
              </Link>
              {/* <Link to="/deals" className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-emerald-300 hover:text-emerald-700">
                View deals
              </Link> */}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {quickPillars.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-emerald-100 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)]">
            <div className="rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100">This week</p>
              <h2 className="mt-3 text-2xl font-semibold">Fresh picks for your next order</h2>
              <p className="mt-3 text-sm text-emerald-50">
                Premium merchants, fast delivery, and dependable support all in one place.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {heroProducts.map((product) => (
                <div key={product.$id || product.id} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{product.productName || product.title || product.name}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{product.description || product.subtitle || 'Trusted Nile Flow choice'}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{product.price ? `KSh ${Number(product.price).toLocaleString()}` : 'Shop now'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Featured products</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Popular picks right now</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Explore all products →
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