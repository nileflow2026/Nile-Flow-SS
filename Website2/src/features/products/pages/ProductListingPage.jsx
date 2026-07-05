import { useState, useEffect, useCallback, useRef } from 'react'
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
  // categories: array of { id: docId (filter value), name: display label }
  const [categoryFilters, setCategoryFilters] = useState([{ id: null, name: 'All' }])
  const [activeFilterId, setActiveFilterId] = useState(null) // null = All
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const { push } = useToast()

  // Fetch categories API → build { id: name } lookup map
  // Then fetch initial products
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      categoryService.getCategories(),
      productService.getProducts(),
    ]).then(([cats, result]) => {
      if (cancelled) return

      // Build docId → displayName map
      const nameMap = {}
      for (const c of (cats || [])) {
        const cid = c.$id || c.id
        const cname = c.name || c.category
        if (cid && cname) nameMap[cid] = cname
      }

      // Extract unique category doc IDs from product data
      const ids = new Set()
      for (const p of (result.products || [])) {
        const raw = p.category || p.categoryId || p.categoryName
        if (!raw) continue
        if (Array.isArray(raw)) {
          raw.forEach((r) => { if (r && typeof r === 'string') ids.add(r.trim()) })
        } else if (typeof raw === 'string') {
          ids.add(raw.trim())
        }
      }

      // Build filter buttons: use doc ID as filter key, name from API map
      const filters = [{ id: null, name: 'All' }]
      for (const id of [...ids].sort()) {
        filters.push({ id, name: nameMap[id] || id })
      }

      setProducts(result.products)
      setNextCursor(result.nextCursor)
      setCategoryFilters(filters)
      setLoading(false)
    }).catch((err) => {
      if (cancelled) return
      setError(err?.message || 'Failed to load data')
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  // Load products when filter changes
  const loadProducts = useCallback(async (filterId, cursor) => {
    setLoading(true)
    setError(null)
    const params = {}
    if (filterId) params.category = filterId
    if (cursor) params.cursor = cursor
    try {
      const result = await productService.getProducts(params)
      setProducts(result.products)
      setNextCursor(result.nextCursor)
    } catch (err) {
      setError(err?.message || 'Failed to load products')
      setProducts([])
      setNextCursor(null)
    }
    setLoading(false)
  }, [])

  // Trigger reload on filter change (skip the initial mount)
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (initialLoadDone.current) {
      loadProducts(activeFilterId)
    }
    initialLoadDone.current = true
  }, [activeFilterId, loadProducts])

  const handleFilterChange = (filterId) => {
    setActiveFilterId(filterId)
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return
    setLoadingMore(true)
    const params = {}
    if (activeFilterId) params.category = activeFilterId
    params.cursor = nextCursor
    const result = await productService.getProducts(params)
    setProducts((prev) => [...prev, ...result.products])
    setNextCursor(result.nextCursor)
    setLoadingMore(false)
  }, [activeFilterId, nextCursor, loadingMore])

  const activeName = categoryFilters.find((c) => c.id === activeFilterId)?.name || 'All'

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Shop" title="Discover curated products" description="Browse our handpicked collection of authentic African products." className="py-10 sm:py-14 lg:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {loading ? 'Loading…' : `${products.length} products`}
          </p>
          <div className="-mx-4 overflow-x-auto overflow-y-hidden scrollbar-none sm:mx-0 sm:overflow-visible">
            <div className="flex w-max gap-2 px-4 sm:w-auto sm:flex-wrap sm:px-0">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id || 'all'}
                  type="button"
                  onClick={() => handleFilterChange(cat.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer touch-manipulation ${
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
