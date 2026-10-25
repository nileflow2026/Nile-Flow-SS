import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import ProductCard from '@shared/ui/product-card/ProductCard'
import Button from '@shared/ui/button/Button'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import StarRating from '@shared/ui/star-rating/StarRating'
import Input from '@shared/ui/input/Input'
import { productService, vendorService } from '@api/services'
import { imageProxyUrl } from '@api/config'
import { SeoHead } from '@shared/seo/SeoHead'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
]

function getStoreImageSource(image, width, quality) {
  if (!image) return ''
  return /^https?:\/\//i.test(image) ? imageProxyUrl(image, width, quality) : image
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
    })
  } catch {
    return ''
  }
}

function StorePage() {
  const { vendorId } = useParams()

  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // ── Fetch vendor info + products ────────────────────────────
  useEffect(() => {
    if (!vendorId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch vendor info and products in parallel
        const [vendorData, productResult] = await Promise.all([
          vendorService.getVendorInfo(vendorId),
          productService.getProducts({ vendorId, limit: 100 }),
        ])

        if (cancelled) return

        if (!vendorData) {
          setError('Vendor not found.')
          setVendor(null)
          setProducts([])
        } else {
          setVendor(vendorData)
          setProducts(productResult.products || [])
        }
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'Failed to load store information.')
        setVendor(null)
        setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [vendorId])

  // ── Search (client-side) ────────────────────────────────────
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  // ── Sort ────────────────────────────────────────────────────
  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value)
  }, [])

  // ── Filtered + sorted products ──────────────────────────────
  const visibleProducts = useMemo(() => {
    let filtered = [...products]

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(
        (p) =>
          (p.productName || p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q),
      )
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
        break
      default: // newest
        filtered.sort((a, b) => {
          const aDate = a.createdAt || a.$createdAt || ''
          const bDate = b.createdAt || b.$createdAt || ''
          return bDate.localeCompare(aDate)
        })
    }

    return filtered
  }, [products, searchQuery, sortBy])

  // ── Derived vendor fields ───────────────────────────────────
  const storeName = vendor?.storeName || vendor?.name || 'Vendor Store'
  const storeDescription = vendor?.storeDescription || vendor?.description || ''
  const storeLogo = vendor?.profileImage || vendor?.avatar || vendor?.logo || ''
  const storeCover = vendor?.coverImage || vendor?.cover || ''
  const storeLogoSource = getStoreImageSource(storeLogo, 192, 80)
  const storeCoverSource = getStoreImageSource(storeCover, 1400, 78)
  const vendorRating = vendor?.storeStats?.rating || vendor?.rating || 0
  const vendorRatingCount = vendor?.storeStats?.totalRatings || vendor?.ratingsCount || 0
  const joinedDate = formatDate(vendor?.createdAt || vendor?.joinedAt)
  const phone = vendor?.phone || ''
  const whatsapp = vendor?.whatsapp || vendor?.socialLinks?.whatsapp || ''
  const email = vendor?.email || ''
  const address = vendor?.address || vendor?.location || ''

  const hasContactInfo = phone || whatsapp || email || address
  const hasDescription = !!storeDescription

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <SeoHead title="Loading Store…" robots="noindex,follow" />
        <div className="responsive-shell flex min-h-[60vh] items-center justify-center py-14">
          <Loader label="Loading store…" />
        </div>
      </PageShell>
    )
  }

  // ── Error state ─────────────────────────────────────────────
  if (error && !vendor) {
    return (
      <PageShell>
        <SeoHead title="Store Not Found" robots="noindex,follow" />
        <ResponsiveSection eyebrow="Store" title="Store not found" className="py-10 sm:py-14 lg:py-16">
          <EmptyState
            title="Store not found"
            description={error}
            icon="🏪"
            action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>}
          />
        </ResponsiveSection>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <SeoHead
        title={storeName}
        description={storeDescription || `Browse products from ${storeName} on Nile Flow`}
        keywords={[storeName, 'vendor store', 'shop', 'African marketplace']}
      />

      {/* ── Store Header ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_50%),linear-gradient(135deg,rgba(16,185,129,0.10)_0%,var(--color-background)_45%,rgba(245,158,11,0.10)_100%)]">
        {storeCover && (
          <img
            src={storeCoverSource}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden'
            }}
          />
        )}
        <div className="responsive-shell py-10 sm:py-14 lg:py-16">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            {/* Store Logo */}
            <div className="shrink-0">
              {storeLogo ? (
                <img
                  src={storeLogoSource}
                  alt={`${storeName} logo`}
                  className="h-24 w-24 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] object-cover shadow-[var(--shadow-md)] sm:h-28 sm:w-28"
                  onError={(event) => {
                    if (event.currentTarget.dataset.fallbackApplied) return
                    event.currentTarget.dataset.fallbackApplied = 'true'
                    event.currentTarget.src = '/logo.png'
                  }}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-primary)] text-3xl font-bold text-white shadow-[var(--shadow-md)] sm:h-28 sm:w-28">
                  {(storeName.charAt(0) || 'S').toUpperCase()}
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl">
                {storeName}
              </h1>

              {vendorRating > 0 && (
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                  <StarRating rating={vendorRating} count={vendorRatingCount} size={18} />
                </div>
              )}

              {joinedDate && (
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Joined {joinedDate}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="responsive-shell">
        {/* ── Contact Information ───────────────────────────────── */}
        {/* {hasContactInfo && (
          <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:mt-8 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              Contact
            </h2>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 transition hover:border-emerald-400 hover:text-emerald-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {phone}
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 transition hover:border-emerald-400 hover:text-emerald-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 transition hover:border-emerald-400 hover:text-emerald-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13 2 4" />
                  </svg>
                  {email}
                </a>
              )}
              {address && (
                <span className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {address}
                </span>
              )}
            </div>
          </div>
        )} */}

        {/* ── Products Section ──────────────────────────────────── */}
        <section className="mt-8 sm:mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">
                Products
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {products.length} {products.length === 1 ? 'product' : 'products'}
                {searchQuery.trim() && ` (${visibleProducts.length} matching)`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search within store…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="min-w-[200px] pl-10"
                />
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="6" />
                  <path d="m20 20-4.2-4.2" />
                </svg>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(22,163,74,0.16)]"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="mt-6">
            {visibleProducts.length === 0 ? (
              <EmptyState
                title={searchQuery.trim() ? 'No matching products' : 'No products yet'}
                description={
                  searchQuery.trim()
                    ? `No products matching "${searchQuery.trim()}" in this store.`
                    : 'This vendor has not added any products yet.'
                }
                icon="📦"
                action={
                  searchQuery.trim() ? (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear search
                    </Button>
                  ) : (
                    <Link to="/products">
                      <Button variant="outline">Browse all products</Button>
                    </Link>
                  )
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => {
                  const productId = product?.productId || product?.$id || product?.id
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
          </div>
        </section>

        {/* ── About Store ──────────────────────────────────────── */}
        {hasDescription && (
          <section className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:mt-12 sm:p-6 lg:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              About this store
            </h2>
            <div className="mt-3 max-w-prose">
              <p className="whitespace-pre-line text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
                {storeDescription}
              </p>
            </div>
          </section>
        )}

        {/* ── Contact Seller CTA ────────────────────────────────── */}
{/*         <section className="mt-10 mb-16 sm:mt-12 sm:mb-20">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-md)] sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">
              Interested in this store?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {whatsapp
                ? 'Reach out via WhatsApp to inquire about products and orders.'
                : email
                  ? 'Send an email to the seller for inquiries.'
                  : 'Contact this seller for more information.'}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <PrimaryButton className="w-full justify-center sm:w-auto">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2 inline-block">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Contact via WhatsApp
                  </PrimaryButton>
                </a>
              ) : email ? (
                <a href={`mailto:${email}`}>
                  <PrimaryButton className="w-full justify-center sm:w-auto">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 4L12 13 2 4" />
                    </svg>
                    Send email
                  </PrimaryButton>
                </a>
              ) : null}
              <Link to="/contact">
                <Button variant="outline" className="w-full justify-center sm:w-auto">
                  Contact support
                </Button>
              </Link>
            </div>
          </div>
        </section>
 */}      </div>
    </PageShell>
  )
}

export default StorePage
