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
import { productService } from '@api/services'
import { cartService } from '@api/services'
import { useAuth } from '@api/context/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'
import ImageCarousel from '@shared/ui/image-carousel/ImageCarousel'
import ReviewCard from '@shared/ui/review/ReviewCard'
import ReviewForm from '@shared/ui/review/ReviewForm'
import { reviewService } from '@api/services'

function ProductDetailPage() {
  const { productId } = useParams()
  const { isAuthenticated } = useAuth()
  const { push } = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // ── Load reviews ────────────────────────────────────────────────
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

  // ── Load product ────────────────────────────────────────────────
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

  const handleAddToCart = async () => {
    if (!product) return
    if (!isAuthenticated) {
      push({ title: 'Sign in required', message: 'Please sign in to add items to your cart.' })
      return
    }

    setAddingToCart(true)
    const result = await cartService.addToCart({
      productId: product.$id || product.id,
      productName: product.productName || product.name || 'Product',
      price: product.price || 0,
      image: product.image || '',
    })
    setAddingToCart(false)

    if (result.success) {
      push({ title: 'Added to cart', message: `${product.productName || product.name} added to your cart.` })
    } else {
      push({ title: 'Failed to add', message: result.error || 'Please try again.' })
    }
  }

  // ── Loading & error states ─────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <div className="responsive-shell flex min-h-[60vh] items-center justify-center py-14">
          <Loader label="Loading product details…" />
        </div>
      </PageShell>
    )
  }

  if (error && !product) {
    return (
      <PageShell>
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

  const name = product?.productName || product?.name || product?.title || 'Product'

  // Price: handle number, currency-enriched object, or string
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

  // Collect all product images from the images array + primary image
  const rawImages = product?.images || []
  const primaryImage = product?.image || product?.imageUrl || ''
  const productImages = primaryImage
    ? [primaryImage, ...rawImages.filter((img) => img !== primaryImage)]
    : (rawImages.length > 0 ? rawImages : [])
  const stock = product?.stock
  const inStock = stock === undefined || stock > 0
  const premium = Boolean(product?.premiumEligible)
  const category = product?.category || ''
  const vendorName = product?.vendorName || product?.brand || ''

  return (
    <PageShell>
      <ResponsiveSection eyebrow={category || 'Product'} title={name} description={description} className="py-6 sm:py-10 lg:py-16">
        {/* ── Main product layout ── */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* ── Image carousel card ── */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-md)] sm:rounded-[2rem] sm:p-6 lg:p-8">
            <ImageCarousel images={productImages} alt={name} />
            <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
              {inStock ? (
                <Badge variant="success">{stock ? `In stock (${stock})` : 'In stock'}</Badge>
              ) : (
                <Badge variant="danger">Out of stock</Badge>
              )}
              {premium && <Badge variant="warning">Premium eligible</Badge>}
              {vendorName && <Badge variant="neutral">{vendorName}</Badge>}
            </div>
          </div>

          {/* ── Product info card ── */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] sm:rounded-[2rem] sm:p-6 lg:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)] sm:text-xs">
              {category || 'Nile Flow'}
            </p>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-2xl lg:text-3xl">
              {name}
            </h1>
            <p className="mt-2 text-2xl font-bold text-[var(--color-accent)] sm:text-3xl">{priceStr}</p>

            {description && (
              <div className="mt-4 max-w-prose">
                <p className="text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
                  {description}
                </p>
              </div>
            )}

            {/* ── Action buttons ── */}
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
                  description={<Link to="/login" className="font-semibold text-[var(--color-primary)] hover:underline">Sign in</Link>}
                  tone="info"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews section ── */}
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

            {/* Review list */}
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

          {/* Review form */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:rounded-[2rem] sm:p-6 lg:p-8">
            <ReviewForm productId={productId} onReviewSubmitted={loadReviews} />
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProductDetailPage
