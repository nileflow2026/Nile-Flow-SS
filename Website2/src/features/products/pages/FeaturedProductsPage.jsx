import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import ProductCard from '@shared/ui/product-card/ProductCard'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Loader from '@shared/ui/loader/Loader'
import { productService } from '@api/services'
import { SeoHead } from '@shared/seo/SeoHead'

function FeaturedProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    productService.getFeaturedProducts(true)
      .then((items) => {
        if (!cancelled) setProducts(items)
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <PageShell>
      <SeoHead
        title="Featured Products"
        description="Browse our handpicked selection of featured products on Nile Flow."
        keywords={['featured', 'products', 'shop online', 'African marketplace']}
      />
      <ResponsiveSection
        eyebrow="Curated Picks"
        title="Featured products"
        description="Our best selections, updated regularly. Discover quality products handpicked for you."
        className="py-10 sm:py-14 lg:py-16"
      >
        <div className="mb-8">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {loading ? 'Loading…' : `${products.length} featured product${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader label="Loading featured products…" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No featured products yet"
            description="We're curating our best picks. Check back soon!"
            icon="⭐"
            action={
              <Link to="/products">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md active:scale-95">
                  Browse all products
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </span>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const productId = product.productId || product.$id || product.id
              return (
                <ProductCard
                  key={productId}
                  product={product}
                  href={`/products/${productId}`}
                />
              )
            })}
          </div>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default FeaturedProductsPage
