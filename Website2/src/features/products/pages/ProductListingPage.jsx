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
  // categories stored as [{ name, id }] — id is the Appwrite doc ID for API filtering
  const [categories, setCategories] = useState([{ name: 'All', id: null }])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [activeFilterId, setActiveFilterId] = useState(null) // null = All
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const { push } = useToast()

  // Fetch categories from the API on mount, preserve the Appwrite doc ID
  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    categoryService.getCategories().then((cats) => {
      if (cancelled) return
      // Map API response to { name } pairs — the backend filters by category name
      // (Query.contains on categoryId field which stores the category name string)
      const entries = []
      const seen = new Set()
      for (const c of cats) {
        const name = c.name || c.category || ''
        if (name && !seen.has(name)) {
          seen.add(name)
          entries.push({ name })
        }
      }
      entries.sort((a, b) => a.name.localeCompare(b.name))
      setCategories([{ name: 'All' }, ...entries])
      setCategoriesLoading(false)
    }).catch(() => {
      if (cancelled) return
      setCategories([{ name: 'All', id: null }])
      setCategoriesLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const fetchProducts = useCallback(async (categoryId, cursor = null) => {
    try {
      const result = await productService.getProducts({
        category: categoryId, // send the Appwrite doc ID, not the display name
        cursor,
      })
      return result
    } catch (err) {
      setError(err?.message || 'Failed to load products')
      return { products: [], nextCursor: null }
    }
  }, [])

  const loadProducts = useCallback(async (categoryId) => {
    setLoading(true)
    setError(null)
    const result = await fetchProducts(categoryId)
    setProducts(result.products)
    setNextCursor(result.nextCursor)
    setLoading(false)
  }, [fetchProducts])

  const loadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return
    setLoadingMore(true)
    const result = await fetchProducts(activeFilterId, nextCursor)
    setProducts((prev) => [...prev, ...result.products])
    setNextCursor(result.nextCursor)
    setLoadingMore(false)
  }, [activeFilterId, nextCursor, loadingMore, fetchProducts])

  useEffect(() => {
    loadProducts(activeFilterId)
  }, [activeFilterId, loadProducts])

  const handleFilterChange = (catId) => {
    setActiveFilterId(catId)
  }

  // Find currently active category name for the button highlight
  const activeName = categories.find((c) => c.id === activeFilterId)?.name || 'All'

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Shop" title="Discover curated products" description="Browse our handpicked collection of authentic African products." className="py-10 sm:py-14 lg:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {loading ? 'Loading…' : `${products.length} products`}
          </p>
          <div className="flex flex-wrap gap-2">
            {categoriesLoading
              ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className="h-8 w-20 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
                  ))}
                </div>
              )
              : categories.map((cat) => (
                <button
                  key={cat.id || 'all'}
                  onClick={() => handleFilterChange(cat.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                    cat.id === activeFilterId
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </div>

        {loading ? (
          <Loader label="Loading products…" />
        ) : error ? (
          <EmptyState
            title="Failed to load products"
            description={error}
            icon="⚠️"
            action={<PrimaryButton className="justify-center" onClick={() => loadProducts(activeFilterId)}>Try again</PrimaryButton>}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products available"
            description="This category is being stocked. Check back soon or browse another category."
            action={<PrimaryButton className="justify-center" onClick={() => handleFilterChange(null)}>View all products</PrimaryButton>}
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
