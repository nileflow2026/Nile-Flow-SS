import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Loader from '@shared/ui/loader/Loader'
import Input from '@shared/ui/input/Input'
import { searchService } from '@api/services'
import { imageProxyUrl } from '@api/config'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = useCallback(async (event) => {
    event?.preventDefault()
    setSearched(true)
    setError(null)

    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const result = await searchService.search(query.trim())
      setResults(result.products)
    } catch (err) {
      setError(err?.message || 'Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  return (
    <PageShell>
      <ResponsiveSection
        eyebrow="Search"
        title="Find what you need"
        description="Search across products, categories, and merchants on Nile Flow."
        className="py-10 sm:py-14 lg:py-16"
      >
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
              action={<PrimaryButton onClick={handleSearch}>Try again</PrimaryButton>}
            />
          )}

          {searched && !loading && !error && results.length === 0 && (
            <EmptyState
              title="No results found"
              description={`We couldn't find anything for "${query}". Try a different keyword or browse categories.`}
              action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>}
            />
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {results.length} result{results.length > 1 ? 's' : ''} found
              </p>
              {results.map((item) => {
                const id = item.$id || item.id
                const name = item.productName || item.name || 'Product'
                const price = item.price
                  ? (typeof item.price === 'number' ? `KSh ${Math.round(item.price).toLocaleString()}` : item.price)
                  : 'KSh —'
                return (
                  <Link
                    key={id}
                    to={`/products/${id}`}
                    className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-5"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] bg-gray-100 overflow-hidden dark:bg-gray-800">
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
                        <p className="text-base font-semibold text-gray-900 truncate dark:text-white">{name}</p>
                        {item.category && <Badge variant="neutral">{item.category}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-amber-600 font-semibold dark:text-amber-400">{price}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 shrink-0 dark:text-emerald-400">View →</span>
                  </Link>
                )
              })}
            </div>
          )}

          {!searched && !loading && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try searching: Coffee · Baskets · Shea Butter · Beaded Jewelry
              </p>
            </div>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default SearchPage
