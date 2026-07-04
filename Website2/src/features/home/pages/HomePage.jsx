import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import InfoCard from '@shared/ui/card/InfoCard'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import ProductCard from '@shared/ui/product-card/ProductCard'
import Loader from '@shared/ui/loader/Loader'
import { productService } from '@api/services'
import { useAuth } from '@api/context/AuthContext'

const highlights = [
  {
    title: 'Curated African marketplace',
    description: 'Authentic products sourced directly from artisans and producers across the continent.',
    badge: 'Trusted',
  },
  {
    title: 'Secure payments',
    description: 'Pay with card or M-Pesa through our encrypted checkout flow.',
    badge: 'Safe',
  },
  {
    title: 'Fast delivery network',
    description: 'Reliable last-mile delivery across East Africa with real-time tracking.',
    badge: 'Reliable',
  },
]

function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true)
      try {
        const result = await productService.getProducts()
        // Show up to 6 products, prefer featuring first few
        setFeaturedProducts(result.products?.slice(0, 6) || [])
      } catch {
        setFeaturedProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadFeatured()
  }, [])

  return (
    <PageShell>
      <section className="py-10 sm:py-14 lg:py-20">
        <div className="responsive-shell grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">
              {isAuthenticated ? `Welcome, ${user?.name || user?.username || user?.email?.split('@')[0] || 'back'}!` : 'Nile Flow'}
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              African commerce, trusted and delivered.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base sm:leading-8">
              Discover authentic products, secure payments, and dependable delivery designed for modern everyday shopping across Africa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/products"><PrimaryButton className="w-full justify-center sm:w-auto">Shop products</PrimaryButton></Link>
              <Link to="/deals"><Button variant="outline" className="w-full justify-center sm:w-auto">View deals</Button></Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 sm:p-8">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Real-time tracking</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">Know where your order is, every step of the way.</p>
            </div>
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Premium members save more</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Exclusive deals, early access, and free delivery.</p>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">Premium</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <ResponsiveSection eyebrow="Featured" title="Trending products" description="Popular products our customers love right now.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full"><Loader label="Loading products…" /></div>
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
          <div className="mt-6 text-center">
            <Link to="/products"><Button variant="outline">View all products →</Button></Link>
          </div>
        </ResponsiveSection>
      )}

      <ResponsiveSection eyebrow="Why Nile Flow" title="Built for African commerce" description="Every detail is designed for trust, speed, and clarity.">
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <InfoCard key={item.title} title={item.title} description={item.description} badge={item.badge} />
          ))}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default HomePage
