import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import ProductCard from '@shared/ui/product-card/ProductCard'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Loader from '@shared/ui/loader/Loader'
import { productService, categoryService } from '@api/services'
import { useToast } from '@shared/ui/toast/ToastProvider'

function ProductListingPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState(['All'])
  const [activeFilter, setActiveFilter] = useState('All')
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const { push } = useToast()

  // Fetch categories from the API on mount
  useEffect(() => {
    let cancelled = false
    categoryService.getCategories().then((cats) => {
      if (cancelled) return
      const names = cats
        .map((c) => c.name || c.category || '')
        .filter(Boolean)
      const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b))
      setCategories(['All', ...unique])
    }).catch(() => {
      // fallback — categories will just show "All"
    })
    return () => { cancelled = true }
  }, [])

  const fetchProducts = useCallback(async (filter, cursor = null) => {
    try {
      const result = await productService.getProducts({
        category: filter === 'All' ? undefined : filter,
        cursor,
      })
      return result
    } catch (err) {
      setError(err?.message || 'Failed to load products')
      return { products: [], nextCursor: null }
    }
  }, [])

  const loadProducts = useCallback(async (filter) => {
    setLoading(true)
    setError(null)
    const result = await fetchProducts(filter)
    setProducts(result.products)
    setNextCursor(result.nextCursor)
    setLoading(false)
  }, [fetchProducts])

  const loadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return
    setLoadingMore(true)
    const result = await fetchProducts(activeFilter, nextCursor)
    setProducts((prev) => [...prev, ...result.products])
    setNextCursor(result.nextCursor)
    setLoadingMore(false)
  }, [activeFilter, nextCursor, loadingMore, fetchProducts])

  useEffect(() => {
    loadProducts(activeFilter)
  }, [activeFilter, loadProducts])

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Shop" title="Discover curated products" description="Browse our handpicked collection of authentic African products." className="py-10 sm:py-14 lg:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {loading ? 'Loading…' : `${products.length} products`}
          </p>
          <div className="-mx-4 overflow-x-auto overflow-y-hidden scrollbar-none sm:mx-0 sm:overflow-visible">
            <div className="flex w-max gap-2 px-4 sm:w-auto sm:flex-wrap sm:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleFilterChange(cat)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer touch-manipulation ${
                    cat === activeFilter
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <Loader label="Loading products…" />
        ) : error ? (
          <EmptyState
            title="Failed to load products"
            description={error}
            icon="⚠️"
            action={<PrimaryButton className="justify-center" onClick={() => loadProducts(activeFilter)}>Try again</PrimaryButton>}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products available"
            description="This category is being stocked. Check back soon or browse another category."
            action={<PrimaryButton className="justify-center" onClick={() => setActiveFilter('All')}>View all products</PrimaryButton>}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.$id || product.id}
                  product={product}
                  href={`/products/${product.$id || product.id}`}
                />
              ))}
            </div>

            {nextCursor && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="justify-center"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading more…' : 'Load more products'}
                </Button>
              </div>
            )}
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Can't find what you're looking for?</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Try searching our full catalog or browse by category.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/search"><Button variant="outline">Search</Button></Link>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProductListingPage
