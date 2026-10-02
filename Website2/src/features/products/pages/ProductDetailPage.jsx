import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
import StarRating from '@shared/ui/star-rating/StarRating'
import { reviewService } from '@api/services'
import { usePostHog } from '@posthog/react'
import { SeoHead } from '@shared/seo/SeoHead'
import { createProductSchema, buildCanonicalUrl } from '@shared/seo/SchemaFactory'
import Breadcrumbs from '@shared/ui/breadcrumbs/Breadcrumbs'

const COLOR_SWATCHES = {
  black: '#111827',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#3B82F6',
  'light blue': '#ADD8E6',
  lightblue: '#ADD8E6',
  green: '#22C55E',
  yellow: '#FACC15',
  orange: '#F97316',
  purple: '#A855F7',
  pink: '#EC4899',
  brown: '#92400E',
  gold: '#D4AF37',
  goldbrown: '#B8860B',
  'gold brown': '#B8860B',
  grey: '#6B7280',
  gray: '#6B7280',
  silver: '#C0C0C0',
  beige: '#D6C6A5',
  cream: '#FFFDD0',
  navy: '#1E3A8A',
  maroon: '#7F1D1D',
}

function resolveColorSwatch(value) {
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, ' ')
  const compact = normalized.replace(/[\s_-]+/g, '')
  return COLOR_SWATCHES[normalized] || COLOR_SWATCHES[compact] || value
}

function ProductDetailPage() {
  const { productId } = useParams()
  const { isAuthenticated, user } = useAuth()
  const { push } = useToast()
  const posthog = usePostHog()
  const navigate = useNavigate()

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
        const directMatch = await productService.getProduct(productId)
        if (directMatch) {
          setProduct(directMatch)
          return
        }

        const allResult = await productService.getProducts()
        const found = allResult.products?.find(
          (p) => (p.productId || p.$id || p.id) === productId,
        )

        if (found) {
          setProduct(found)
          return
        }

        const featuredProducts = await productService.getFeaturedProducts(true)
        const featuredMatch = featuredProducts.find(
          (p) => (p.productId || p.$id || p.id) === productId,
        )

        if (featuredMatch) {
          setProduct(featuredMatch)
          return
        }

        const directFeaturedMatch = featuredProducts.find(
          (p) => String(p?.productId || p?.$id || p?.id || '').toLowerCase() === String(productId || '').toLowerCase(),
        )

        if (directFeaturedMatch) {
          setProduct(directFeaturedMatch)
          return
        }

        setError('Product not found.')
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

  const handleBuyNow = async () => {
    if (!product) return
    if (!isAuthenticated) {
      push({ title: 'Sign in required', message: 'Please sign in to buy this product.' })
      return
    }

    const missingVariant = Object.keys(variantOptions).find((key) => !selectedVariants[key])
    if (missingVariant) {
      push({ title: 'Select an option', message: `Please select a ${missingVariant} before buying this product.` })
      return
    }

    setAddingToCart(true)
    const item = {
      userId: user?.$id || user?.id,
      productId: product.$id || product.id,
      productName: product.productName || product.name || 'Product',
      price: typeof product.price === 'object'
        ? product.price.raw ?? product.price.convertedPrice ?? product.price.basePrice ?? 0
        : product.price || 0,
      image: product.image || product.imageUrl || product.images?.[0] || '',
      variantSelection: selectedVariants,
    }
    const result = await cartService.addToCart(item)
    setAddingToCart(false)

    if (!result.success) {
      push({ title: 'Failed to buy', message: result.error || 'Please try again.' })
      return
    }

    const price = Number(item.price) || 0
    navigate('/checkout', {
      state: {
        items: [{
          id: result.data?.item?.$id || result.data?.item?.id || item.productId,
          productId: item.productId,
          name: item.productName,
          price,
          quantity: 1,
          image: item.image,
          variantSelection: JSON.stringify(selectedVariants),
        }],
        subtotal: price,
        delivery: price >= 1000 ? 0 : 150,
        total: price + (price >= 1000 ? 0 : 150),
      },
    })
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
  const productRating = parseFloat(
    product?.rating ?? product?.avgRating ?? product?.averageRating ?? 0,
  ) || 0
  const productReviewCount = parseInt(
    product?.ratingsCount ?? product?.totalRatings ?? product?.reviewCount ?? product?.reviewsCount ?? reviews.length ?? 0,
    10,
  ) || reviews.length

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

      

      <ResponsiveSection  className="py-6 sm:py-10 lg:py-16">
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <div className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)] sm:rounded-3xl sm:p-6 lg:p-8">
            <ImageCarousel images={productImages} alt={name} />
            <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
              {inStock ? (
                <Badge variant="success">{stock ? `In stock (${stock})` : 'In stock'}</Badge>
              ) : (
                <Badge variant="danger">Out of stock</Badge>
              )}
              {premium && <Badge variant="warning">Premium eligible</Badge>}
              {vendorName && (
                <Badge variant="neutral" className="max-w-[180px] truncate">{vendorName}</Badge>
              )} 
              {/* 
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
               */}
              
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)] sm:rounded-3xl sm:p-6 lg:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)] sm:text-xs">
              {categoryName || 'Nile Flow'}
            </p>
            <h1 className="mt-2 line-clamp-2 break-words text-xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-2xl lg:text-3xl" title={name}>
              {name}
            </h1>
            <div className="mt-3">
              <StarRating rating={productRating} count={productReviewCount} size={18} />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600 sm:text-3xl">{priceStr}</p>

            {description && (
              <div className="mt-4 max-w-prose">
                <p className={`max-w-full [overflow-wrap:anywhere] whitespace-pre-line text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base ${
                  !showFullDescription ? 'max-h-32 overflow-hidden sm:max-h-40' : ''
                }`}>
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
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {options.map((option) => {
                    const isSelected = selectedVariants[key] === option

                    if (key.toLowerCase() === 'color') {
                      return (
                        <button
                          key={option}
                          type="button"
                          title={option}
                          aria-label={`Select color ${option}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedVariants((current) => ({ ...current, [key]: option }))}
                          className={`h-9 w-9 rounded-full border-2 p-0.5 transition hover:scale-110 ${
                            isSelected
                              ? 'border-emerald-600 ring-2 ring-emerald-200 ring-offset-2'
                              : 'border-[var(--color-border)]'
                          }`}
                        >
                          <span
                            className="block h-full w-full rounded-full border border-black/10"
                            style={{ backgroundColor: resolveColorSwatch(option) }}
                          />
                        </button>
                      )
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedVariants((current) => ({ ...current, [key]: option }))}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-500'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}

            <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
              <PrimaryButton
                className={`relative w-full justify-center overflow-hidden py-3 text-sm sm:flex-1 sm:py-3.5 ${
                  addingToCart ? '!bg-gray-300 !bg-none text-gray-700 shadow-none hover:scale-100' : ''
                }`}
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
              >
                {addingToCart ? (
                  <>
                    <span
                      className="cart-progress-fill absolute inset-y-0 left-0 bg-emerald-600"
                      aria-hidden="true"
                    />
                    <span className="relative z-10">Adding to cart…</span>
                  </>
                ) : inStock ? `Add to cart — ${priceStr}` : 'Out of stock'}
              </PrimaryButton>
              <Button
                variant="outline"
                className={`relative w-full justify-center overflow-hidden py-3 text-sm sm:w-auto sm:py-3.5 ${
                  addingToCart ? '!border-gray-300 !bg-gray-100 !text-gray-700 hover:scale-100' : ''
                }`}
                onClick={handleBuyNow}
                disabled={!inStock || addingToCart}
              >
                {addingToCart ? (
                  <>
                    <span
                      className="cart-checkout-progress absolute inset-y-0 left-0 bg-amber-500"
                      aria-hidden="true"
                    />
                    <span className="relative z-10">Preparing checkout…</span>
                  </>
                ) : 'Buy now'}
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-900/30 dark:bg-[var(--color-surface)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700" aria-hidden="true">
                  🔒
                </span>
                Secure checkout with
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
                <img
                  src="/paymentassets/visalogo.png"
                  alt="Visa"
                  className="h-8 w-auto rounded-md border border-slate-100 bg-white object-contain px-2 py-1 shadow-sm"
                />
                <img
                  src="/paymentassets/mastercardlogo.png"
                  alt="Mastercard"
                  className="h-8 w-auto rounded-md border border-slate-100 bg-white object-contain px-2 py-1 shadow-sm"
                />
                <img
                  src="/paymentassets/M-PESA.png"
                  alt="M-Pesa"
                  className="h-8 w-auto rounded-md border border-slate-100 bg-white object-contain px-2 py-1 shadow-sm"
                />
                <img
                  src="/paymentassets/pesapal.png"
                  alt="Pesapal"
                  className="h-8 w-auto rounded-md border border-orange-100 bg-white object-contain px-2 py-1 shadow-sm"
                />
              </div>
              <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                Your payment information is protected with encrypted processing.
              </p>
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
