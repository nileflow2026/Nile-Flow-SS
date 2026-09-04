import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Badge from '@shared/ui/badge/Badge'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Alert from '@shared/ui/alert/Alert'
import { productService, categoryService } from '@api/services'
import { cartService } from '@api/services'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'
import ImageCarousel from '@shared/ui/image-carousel/ImageCarousel'
import ReviewCard from '@shared/ui/review/ReviewCard'
import ReviewForm from '@shared/ui/review/ReviewForm'
import { reviewService } from '@api/services'
import { usePostHog } from '@posthog/react'
import { SeoHead } from '@shared/seo/SeoHead'
import { createProductSchema, buildCanonicalUrl } from '@shared/seo/SchemaFactory'
import Breadcrumbs from '@shared/ui/breadcrumbs/Breadcrumbs'

function ProductDetailPage() {
  const { productId } = useParams()
  const { isAuthenticated, user } = useAuth()
  const { push } = useToast()
  const posthog = usePostHog()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState({})
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [categories, setCategories] = useState([])

  const loadReviews = useCallback(async () => {
    if (!productId) return
    setReviewsLoading(true)
    const data = await reviewService.getReviews(productId)
    setReviews(Array.isArray(data) ? data : [])
    setReviewsLoading(false)
  }, [productId])

  useEffect(() => {
    if (!productId) return
    loadReviews()
  }, [productId, loadReviews])

  useEffect(() => {
    if (!productId) return

    const loadProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const allResult = await productService.getProducts()
        const found = allResult.products?.find(
          (p) => (p.$id || p.id) === productId,
        )
        if (found) {
          setProduct(found)
        } else {
          setError('Product not found.')
        }
      } catch (err) {
        setError(err?.message || 'Failed to load product details.')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const handleAddToCart = async () => {
    if (!product) return
    if (!isAuthenticated) {
      push({ title: 'Sign in required', message: 'Please sign in to add items to your cart.' })
      return
    }

    const userId = user?.$id || user?.id

    const missingVariant = Object.keys(variantOptions).find((key) => !selectedVariants[key])
    if (missingVariant) {
      push({ title: 'Select an option', message: `Please select a ${missingVariant} before adding this product.` })
      return
    }

    setAddingToCart(true)
    const productImage = product.image || product.imageUrl || product.images?.[0] || ''

    const result = await cartService.addToCart({
      userId,
      productId: product.$id || product.id,
      productName: product.productName || product.name || 'Product',
      price: product.price || 0,
      image: productImage,
      variantSelection: selectedVariants,
    })
    setAddingToCart(false)

    if (result.success) {
      posthog.capture('add_to_cart', {
        product_id: product.$id || product.id,
        product_name: product.productName || product.name,
        price: product.price || 0,
        category: product.category || '',
      })
      push({ title: 'Added to cart', message: `${product.productName || product.name} added to your cart.` })
    } else {
      posthog.captureException(new Error(result.error || 'Add to cart failed'), {
        product_id: product.$id || product.id,
      })
      push({ title: 'Failed to add', message: result.error || 'Please try again.' })
    }
  }

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <SeoHead title="Loading Product..." robots="noindex,follow" />
        <div className="responsive-shell flex min-h-[60vh] items-center justify-center py-14">
          <Loader label="Loading product details…" />
        </div>
      </PageShell>
    )
  }

  // ── Error state ───────────────────────────────────────────────
  if (error && !product) {
    return (
      <PageShell>
        <SeoHead title="Product Not Found" robots="noindex,follow" />
        <ResponsiveSection eyebrow="Product" title="Product not found" className="py-10 sm:py-14 lg:py-16">
          <EmptyState
            title="Product not found"
            description={error}
            icon="🔍"
            action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>}
          />
        </ResponsiveSection>
      </PageShell>
    )
  }

  // ── Product data ──────────────────────────────────────────────
  const name = product?.productName || product?.name || product?.title || 'Product'

  const rawPrice = product?.price
  const displayPrice = product?.displayPrice
  let priceStr
  if (displayPrice) {
    priceStr = displayPrice
  } else if (typeof rawPrice === 'number') {
    priceStr = `KSh ${Math.round(rawPrice).toLocaleString()}`
  } else if (typeof rawPrice === 'object' && rawPrice?.displayValue) {
    priceStr = rawPrice.displayValue
  } else if (typeof rawPrice === 'string') {
    priceStr = rawPrice
  } else {
    priceStr = '—'
  }

  const description = product?.description || ''
  const descriptionLimit = 220
  const hasLongDescription = description.length > descriptionLimit
  const displayedDescription = showFullDescription || !hasLongDescription
    ? description
    : `${description.slice(0, descriptionLimit).trimEnd()}...`
  const rawImages = product?.images || []
  const primaryImage = product?.image || product?.imageUrl || ''
  const productImages = primaryImage
    ? [primaryImage, ...rawImages.filter((img) => img !== primaryImage)]
    : (rawImages.length > 0 ? rawImages : [])
  const attributes = typeof product?.attributes === 'string'
    ? (() => {
        try { return JSON.parse(product.attributes) } catch { return {} }
      })()
    : (product?.attributes || {})
  const variantOptions = Object.entries(attributes)
    .filter(([key, value]) => ['color', 'size'].includes(key) && value)
    .reduce((options, [key, value]) => ({
      ...options,
      [key]: String(value).split(',').map((item) => item.trim()).filter(Boolean),
    }), {})
  const stock = product?.stock
  const inStock = stock === undefined || stock > 0
  const premium = Boolean(product?.premiumEligible)
  const category = product?.category || ''
  const categoryId = Array.isArray(category) ? category[0] : category
  const categoryName = categories.find(
    (item) => (item.$id || item.id) === categoryId,
  )?.name || product?.categoryName || categoryId
  const vendorId = product?.vendorId || product?.vendor?.$id || ''
  const vendorName = product?.vendorName || product?.brand || ''
  const storeLink = vendorId ? `/store/${vendorId}` : ''

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Products', href: '/products' },
    { label: name },
  ]

  // Product schema for SEO
  const productSchema = createProductSchema({
    name,
    description,
    price: product?.price || 0,
    currency: product?.currency || 'KES',
    image: product?.image || product?.images?.[0],
    url: buildCanonicalUrl(`/products/${productId}`),
    brandName: vendorName || 'Nile Flow',
    sku: product?.sku,
    reviewCount: reviews.length,
    ratingValue: product?.avgRating || 0,
    category,
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  })

  return (
    <PageShell>
      <SeoHead
        title={name}
        description={displayedDescription || `Buy ${name} on Nile Flow`}
        keywords={[category, vendorName, 'buy online', 'African marketplace'].filter(Boolean)}
        breadcrumbs={breadcrumbItems}
        ogImage={product?.image || product?.images?.[0] || undefined}
        schema={productSchema}
      />

      <div className="responsive-shell pt-4 sm:pt-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <ResponsiveSection eyebrow={categoryName || 'Product'} title={name} className="py-6 sm:py-10 lg:py-16">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)] sm:rounded-3xl sm:p-6 lg:p-8">
            <ImageCarousel images={productImages} alt={name} />
            <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
              {inStock ? (
                <Badge variant="success">{stock ? `In stock (${stock})` : 'In stock'}</Badge>
              ) : (
                <Badge variant="danger">Out of stock</Badge>
              )}
              {premium && <Badge variant="warning">Premium eligible</Badge>}
              {vendorName && (
                <Badge variant="neutral">{vendorName}</Badge>
              )}
              {vendorId && storeLink && (
                <Link
                  to={storeLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700 transition hover:bg-emerald-100 hover:shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Visit Store
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)] sm:rounded-3xl sm:p-6 lg:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)] sm:text-xs">
              {category || 'Nile Flow'}
            </p>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-2xl lg:text-3xl">
              {name}
            </h1>
            <p className="mt-2 text-2xl font-bold text-amber-600 sm:text-3xl">{priceStr}</p>

            {description && (
              <div className="mt-4 max-w-prose">
                <p className="text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
                  {displayedDescription}
                </p>
                {hasLongDescription && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((current) => !current)}
                    className="mt-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    {showFullDescription ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {Object.entries(variantOptions).map(([key, options]) => (
              <fieldset key={key} className="mt-5">
                <legend className="text-sm font-semibold capitalize text-[var(--color-text-primary)]">
                  Select {key}
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedVariants((current) => ({ ...current, [key]: option }))}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selectedVariants[key] === option
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}

            <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
              <PrimaryButton
                className="w-full justify-center py-3 text-sm sm:flex-1 sm:py-3.5"
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
              >
                {addingToCart ? 'Adding…' : inStock ? `Add to cart — ${priceStr}` : 'Out of stock'}
              </PrimaryButton>
              <Button variant="outline" className="w-full justify-center py-3 text-sm sm:w-auto sm:py-3.5">
                Save
              </Button>
            </div>

            {!isAuthenticated && (
              <div className="mt-4">
                <Alert
                  title="Sign in to purchase"
                  description={<Link to="/login" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">Sign in</Link>}
                  tone="info"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 space-y-6 sm:mt-12 sm:space-y-8">
          <div className="border-t border-[var(--color-border)] pt-6 sm:pt-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">
                  Customer reviews
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] sm:text-sm">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              {reviewsLoading ? (
                <Loader label="Loading reviews…" />
              ) : reviews.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id || review.$id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center sm:p-8">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No reviews yet. Be the first to share your experience!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:rounded-3xl sm:p-6 lg:p-8">
            <ReviewForm productId={productId} onReviewSubmitted={loadReviews} />
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProductDetailPage
