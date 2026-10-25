import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { SeoHead } from '@shared/seo/SeoHead'
import { businessService } from '@api/services'
import BusinessBanner from '../components/BusinessBanner'
import BusinessCategorySelect from '../components/BusinessCategorySelect'
import { BUSINESS_PAGE_SIZE } from '../data/businesses'

const DIRECTORY_DESCRIPTION =
  'Browse active local businesses and visit their stores on Nile Flow.'

function BusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [loadingMoreError, setLoadingMoreError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const category = selectedCategory === 'All' ? undefined : selectedCategory

    businessService.getBusinesses({ page: 1, limit: BUSINESS_PAGE_SIZE, category })
      .then((result) => {
        if (cancelled) return
        setBusinesses(result.businesses)
        setCategories(result.categories)
        setTotal(result.pagination.total)
        setTotalPages(result.pagination.totalPages)
        setPage(1)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'Unable to load businesses.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedCategory, reloadKey])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setBusinesses([])
    setTotal(0)
    setTotalPages(0)
    setPage(1)
    setError(null)
    setLoadingMoreError(null)
    setLoading(true)
  }

  const retryInitialLoad = () => {
    setBusinesses([])
    setError(null)
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  const loadMoreBusinesses = async () => {
    if (loadingMore || loading || page >= totalPages) return

    setLoadingMore(true)
    setLoadingMoreError(null)
    try {
      const category = selectedCategory === 'All' ? undefined : selectedCategory
      const result = await businessService.getBusinesses({
        page: page + 1,
        limit: BUSINESS_PAGE_SIZE,
        category,
      })
      setBusinesses((current) => {
        const knownIds = new Set(current.map((business) => business.id))
        return [...current, ...result.businesses.filter((business) => !knownIds.has(business.id))]
      })
      setCategories(result.categories)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
      setPage(result.pagination.page)
    } catch (requestError) {
      setLoadingMoreError(requestError.message || 'Unable to load more businesses.')
    } finally {
      setLoadingMore(false)
    }
  }

  const hasMore = page < totalPages

  return (
    <PageShell>
      <SeoHead
        title="Businesses"
        description={DIRECTORY_DESCRIPTION}
        robots="noindex,follow"
      />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-[var(--shadow-sm)] sm:p-10 lg:p-12">
          <img
            src="/Businessdirectoryimage.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/15"
          />
          <div className="relative max-w-3xl">
            <p className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 bg-white/90 px-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
              Business directory
            </p>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              Meet the businesses behind your next great find
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
              Explore active local businesses, discover what they offer, and visit their stores.
            </p>

            <div className="mt-7 flex flex-wrap gap-3" aria-label="Directory overview">
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
                <span className="text-emerald-700">{total}</span>
                active businesses
              </span>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
                <span className="text-emerald-700">{categories.length}</span>
                categories
              </span>
            </div>
          </div>
        </header>

        <section className="mt-10" aria-labelledby="business-directory-heading">
          <div className="flex flex-col gap-5 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Find your next favorite
              </p>
              <h2 id="business-directory-heading" className="mt-2 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                Browse active businesses
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]" role="status" aria-live="polite">
                {loading ? 'Loading businesses' : `Showing ${businesses.length} of ${total} businesses`}
              </p>
            </div>
            <BusinessCategorySelect
              value={selectedCategory}
              categories={categories}
              onChange={handleCategoryChange}
              disabled={loading}
            />
          </div>

          {loading ? (
            <ul aria-label="Loading businesses" className="mt-7 grid list-none grid-cols-2 gap-3 p-0 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="aspect-video animate-pulse bg-[var(--color-surface-muted)]" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                    <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-muted)]" />
                  </div>
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="mt-7 rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8" role="alert">
              <h3 className="text-lg font-bold text-red-900">Businesses could not load</h3>
              <p className="mt-2 text-sm leading-6 text-red-800">{error}</p>
              <PrimaryButton className="mt-5" onClick={retryInitialLoad}>
                Try again
              </PrimaryButton>
            </div>
          ) : businesses.length > 0 ? (
            <>
              <ul className="mt-7 grid list-none grid-cols-2 gap-3 p-0 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => (
                  <li key={business.id}>
                    <BusinessBanner business={business} />
                  </li>
                ))}
              </ul>
              {loadingMoreError && (
                <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
                  <p className="text-sm leading-6 text-red-800">{loadingMoreError}</p>
                  <PrimaryButton className="mt-4" onClick={loadMoreBusinesses}>
                    Retry loading more
                  </PrimaryButton>
                </div>
              )}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <PrimaryButton onClick={loadMoreBusinesses} disabled={loadingMore}>
                    {loadingMore ? 'Loading more businesses…' : 'Load more businesses'}
                  </PrimaryButton>
                </div>
              )}
            </>
          ) : selectedCategory !== 'All' ? (
            <div className="mt-7 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                No businesses in this category yet
              </p>
              <PrimaryButton className="mt-5" onClick={() => handleCategoryChange('All')}>
                Show all businesses
              </PrimaryButton>
            </div>
          ) : (
            <div className="mt-7 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                No active businesses are available yet
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Please check back soon, or browse products in the marketplace.
              </p>
              <Link
                to="/products"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 font-semibold text-white transition hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-4"
              >
                Browse products
              </Link>
            </div>
          )}
        </section>
      </main>
    </PageShell>
  )
}

export default BusinessesPage
