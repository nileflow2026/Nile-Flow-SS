import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Loader from '@shared/ui/loader/Loader'
import Input from '@shared/ui/input/Input'
import { searchService, categoryService } from '@api/services'
import { imageProxyUrl } from '@api/config'
import { usePostHog } from '@posthog/react'
import { SeoHead } from '@shared/seo/SeoHead'
import { useAuth } from '@auth/AuthContext'

const CATEGORY_COLORS = [
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-lime-400 to-green-500',
  'from-cyan-400 to-indigo-500',
  'from-fuchsia-400 to-pink-600',
]

function SearchPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const debounceTimer = useRef(null)
  const posthog = usePostHog()

  // Load categories and recent searches on mount
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {})
    if (!isAuthenticated) {
      setRecentSearches([])
      return
    }

    searchService.getRecentSearches()
      .then((searches) => {
        setRecentSearches(
          searches.map((s) => (typeof s === 'string' ? s : s.query || s.displayQuery || '')).filter(Boolean),
        )
      })
      .catch(() => {})
  }, [isAuthenticated])

  const doSearch = useCallback(
    async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([])
        setSearched(false)
        return
      }

      setSearched(true)
      setError(null)
      setLoading(true)

      try {
        const result = await searchService.search(searchQuery.trim())
        const normalizedQuery = searchQuery.trim().toLowerCase()
        const filteredProducts = result.products.filter((item) => {
          const searchableText = [
            item.productName,
            item.name,
            item.title,
            item.brand,
            item.description,
          ].filter(Boolean).join(' ').toLowerCase()
          return normalizedQuery.split(/\s+/).every((term) => searchableText.includes(term))
        })
        setResults(filteredProducts)
        posthog.capture('search_performed', {
          query: searchQuery.trim(),
          result_count: filteredProducts.length,
        })
        // Save recent search (fire-and-forget)
        if (isAuthenticated) searchService.saveRecentSearch(searchQuery.trim()).catch(() => {})
      } catch (err) {
        setError(err?.message || 'Search failed. Please try again.')
        setResults([])
        posthog.captureException(err, { context: 'search', query: searchQuery.trim() })
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated, posthog],
  )

  // Debounced search
  const handleSearchInput = useCallback(
    (e) => {
      const value = e.target.value
      setQuery(value)

      if (debounceTimer.current) clearTimeout(debounceTimer.current)

      if (!value.trim()) {
        setSearched(false)
        setResults([])
        return
      }

      debounceTimer.current = setTimeout(() => {
        doSearch(value)
      }, 300)
    },
    [doSearch],
  )

  const handleSubmit = useCallback(
    (event) => {
      event?.preventDefault()
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      doSearch(query)
    },
    [query, doSearch],
  )

  const handleRecentSearchClick = useCallback(
    (term) => {
      setQuery(term)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      doSearch(term)
    },
    [doSearch],
  )

  const handleCategoryClick = useCallback(
    (categoryName, categoryId) => {
      // Navigate to category page — slugify the name
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-')
      navigate(`/category/${slug}`)
    },
    [navigate],
  )

  const priceDisplay = (item) => {
    if (!item.price) return 'KSh —'
    if (typeof item.price === 'object' && item.price !== null) {
      return item.price.displayValue || `KSh ${Math.round(item.price.convertedPrice || item.price.raw).toLocaleString()}`
    }
    if (typeof item.price === 'number') return `KSh ${Math.round(item.price).toLocaleString()}`
    return String(item.price)
  }

  const isIdle = !searched && !loading && !query.trim()

  return (
    <PageShell>
      <SeoHead
        title="Search Products"
        description="Search across products, categories, and merchants on Nile Flow."
        keywords={['search', 'find products', 'African marketplace']}
      />
      <ResponsiveSection
        title="Find what you need"
        description="Search across products, categories, and merchants on Nile Flow."
        className="py-10 sm:py-14 lg:py-16"
      >
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              value={query}
              onChange={handleSearchInput}
              placeholder="Search products, categories…"
              aria-label="Search products"
            />
          </div>
          <PrimaryButton type="submit" className="shrink-0" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </PrimaryButton>
        </form>

        <div className="mt-8">
          {loading && <Loader label="Searching products…" />}

          {error && !loading && (
            <EmptyState
              title="Search error"
              description={error}
              icon="⚠️"
              action={<PrimaryButton onClick={handleSubmit}>Try again</PrimaryButton>}
            />
          )}

          {searched && !loading && !error && results.length === 0 && (
            <EmptyState
              title="No results found"
              description={`We couldn't find anything for "${query}". Try a different keyword or browse categories.`}
              action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>}
            />
          )}

          {searched && !loading && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                {results.length} result{results.length > 1 ? 's' : ''} found
              </p>
              {results.map((item) => {
                const id = item.$id || item.id
                const name = item.productName || item.name || item.title || 'Product'
                const categoryId = Array.isArray(item.category) ? item.category[0] : item.category
                const categoryName = categories.find(
                  (category) => (category.$id || category.id) === categoryId,
                )?.name || item.categoryName
                return (
                  <Link
                    key={id}
                    to={`/products/${id}`}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition hover:shadow-lg sm:p-5"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--color-surface-muted)] overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image.includes('appwrite.io') ? imageProxyUrl(item.image, 150, 60) : item.image}
                          alt={name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <img src="/logo.png" alt={name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="text-base font-semibold text-[var(--color-text-primary)] truncate">{name}</p>
                        {categoryName && <Badge variant="neutral">{categoryName}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-amber-600 font-semibold">{priceDisplay(item)}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 shrink-0">View →</span>
                  </Link>
                )
              })}
            </div>
          )}

          {isIdle && (
            <div className="space-y-8">
              {/* Categories grid */}
              {categories.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Browse Categories</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((cat, idx) => {
                      const catName = cat.name || cat
                      const catId = cat.$id || cat.id || catName
                      const categoryImageValue = cat.img || cat.image || cat.imgUrl || cat.imageUrl || ''
                      const rawCategoryImage = typeof categoryImageValue === 'object'
                        ? categoryImageValue.url || categoryImageValue.imageUrl || categoryImageValue.href || ''
                        : categoryImageValue
                      const categoryImage = rawCategoryImage && (
                        rawCategoryImage.includes('appwrite.io') || rawCategoryImage.includes('/api/image-proxy?')
                      )
                        ? imageProxyUrl(rawCategoryImage, 96, 60)
                        : rawCategoryImage
                      const slug = catName.toLowerCase().replace(/\s+/g, '-')
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                      return (
                        <Link
                          key={catId}
                          to={`/category/${slug}`}
                          className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${color} p-4 text-white shadow-md transition hover:shadow-lg hover:scale-[1.02]`}
                        >
                          {categoryImage ? (
                            <img
                              src={categoryImage}
                              alt={catName}
                              width="32"
                              height="32"
                              className="h-8 w-8 shrink-0 rounded-lg object-cover bg-white/20"
                              loading="eager"
                              onError={(event) => { event.currentTarget.src = '/logo.png' }}
                            />
                          ) : <span className="h-8 w-8 shrink-0 rounded-lg bg-white/20" aria-hidden="true" />}
                          <span className="font-semibold text-sm">{catName}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Recent Searches</h2>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={`${term}-${i}`}
                        onClick={() => handleRecentSearchClick(term)}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                      >
                        {term}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        searchService.clearRecentSearches().then(() => setRecentSearches([])).catch(() => {})
                      }}
                      className="rounded-full border border-transparent px-4 py-2 text-xs text-[var(--color-text-muted)] hover:text-red-500"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}

              {/* Fallback suggestions when no categories loaded */}
              {categories.length === 0 && recentSearches.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Try searching: Coffee · Baskets · Shea Butter · Beaded Jewelry
                </p>
              )}
            </div>
          )}

          {!searched && !loading && query.trim() && !loading && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              Press Enter or click Search to find &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default SearchPage
