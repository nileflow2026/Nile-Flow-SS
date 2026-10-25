import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, MapPin, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { SeoHead } from '@shared/seo/SeoHead'
import { imageProxyUrl } from '@api/config'
import { businessService } from '@api/services'
import NotFoundPage from '@features/not-found/pages/NotFoundPage'
import { BUSINESS_IMAGE_FALLBACK } from '../data/businesses'

function BusinessProfilePage() {
  const { businessId } = useParams()
  const [profile, setProfile] = useState({
    businessId: null,
    business: null,
    loading: true,
    error: null,
    notFound: false,
  })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    businessService.getBusiness(businessId)
      .then((result) => {
        if (cancelled) return
        setProfile({
          businessId,
          business: result,
          loading: false,
          error: null,
          notFound: false,
        })
      })
      .catch((requestError) => {
        if (cancelled) return
        if (requestError.code === 'NOT_FOUND') {
          setProfile({
            businessId,
            business: null,
            loading: false,
            error: null,
            notFound: true,
          })
          return
        }
        setProfile({
          businessId,
          business: null,
          loading: false,
          error: requestError.message || 'Unable to load this business.',
          notFound: false,
        })
      })

    return () => {
      cancelled = true
    }
  }, [businessId, reloadKey])

  const profileMatchesRoute = profile.businessId === businessId
  const business = profileMatchesRoute ? profile.business : null
  const loading = !profileMatchesRoute || profile.loading
  const error = profileMatchesRoute ? profile.error : null
  const notFound = profileMatchesRoute && profile.notFound

  if (notFound) return <NotFoundPage />

  const retry = () => {
    setProfile((current) => ({
      ...current,
      loading: true,
      error: null,
      notFound: false,
    }))
    setReloadKey((current) => current + 1)
  }

  return (
    <PageShell>
      {business && (
        <SeoHead
          title={business.name}
          description={`${business.description || `${business.category || 'Local'} business`}${business.location ? ` in ${business.location}` : ''} on Nile Flow.`}
          canonical={`${window.location.origin}/businesses/${business.id}`}
          ogImage={business.coverImagePath}
          robots="noindex,follow"
        />
      )}

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 sm:pt-10 lg:px-8">
        <Link
          to="/businesses"
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          All businesses
        </Link>

        {loading ? (
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]" aria-label="Loading business profile">
            <div className="aspect-video animate-pulse bg-[var(--color-surface-muted)]" />
            <div className="space-y-4 p-6 sm:p-9">
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-muted)]" />
              <div className="h-9 w-2/3 animate-pulse rounded bg-[var(--color-surface-muted)]" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--color-surface-muted)]" />
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8" role="alert">
            <h1 className="text-xl font-bold text-red-900">Business could not load</h1>
            <p className="mt-2 text-sm leading-6 text-red-800">{error}</p>
            <PrimaryButton className="mt-5" onClick={retry}>
              Try again
            </PrimaryButton>
          </div>
        ) : business ? (
          <article className="mt-6 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
            <div className="relative border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <img
                src={business.coverImagePath.startsWith('/')
                  ? business.coverImagePath
                  : imageProxyUrl(business.coverImagePath)}
                alt={business.coverImageAlt}
                className="aspect-video w-full object-cover"
                fetchPriority="high"
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied) return
                  event.currentTarget.dataset.fallbackApplied = 'true'
                  event.currentTarget.src = BUSINESS_IMAGE_FALLBACK
                }}
              />
              <span
                aria-hidden="true"
                className="absolute left-4 top-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/70 bg-white/95 px-4 text-sm font-semibold text-emerald-800 shadow-[var(--shadow-sm)] sm:left-6 sm:top-6"
              >
                <Store aria-hidden="true" size={16} />
                Active business
              </span>
            </div>

            <div className="flex flex-col gap-7 p-6 sm:p-9 lg:flex-row lg:items-end lg:justify-between lg:p-10">
              <div className="max-w-2xl">
                {business.category && (
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    {business.category}
                  </p>
                )}
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
                  {business.name}
                </h1>
                {business.location && (
                  <p className="mt-3 inline-flex items-center gap-2 text-base text-[var(--color-text-secondary)]">
                    <MapPin aria-hidden="true" size={18} />
                    {business.location}
                  </p>
                )}
                {business.description && (
                  <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                    {business.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Link
                  to={`/store/${business.vendorId}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-4"
                >
                  Visit store
                  <ArrowUpRight aria-hidden="true" size={18} />
                </Link>
                <Link
                  to="/businesses"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--color-border)] px-6 font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-4"
                >
                  Explore businesses
                </Link>
              </div>
            </div>
          </article>
        ) : null}
      </main>
    </PageShell>
  )
}

export default BusinessProfilePage
