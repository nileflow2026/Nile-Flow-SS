import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import ImageCarousel from '@shared/ui/image-carousel/ImageCarousel'
import { productService, cartService } from '@api/services'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { SeoHead } from '@shared/seo/SeoHead'
import { Zap, Flame, Clock, ArrowLeft } from 'lucide-react'

function DealProductPage() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { push } = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productService.getDealProducts()
      .then((deals) => {
        if (!cancelled) {
          const found = deals.find((d) => (d.$id || d.id) === dealId)
          if (found) {
            setProduct(found)
          } else {
            setError('Deal not found.')
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load deal.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [dealId])

  const handleAddToCart = async () => {
    if (!product) return
    if (!isAuthenticated) {
      push({ title: 'Sign in required', message: 'Please sign in to add items to your cart.' })
      return
    }

    const userId = user?.$id || user?.id
    const dealPrice = product.dealPrice || product.price || 0
    const productImage = product.image || product.images?.[0] || ''

    setAddingToCart(true)
    const result = await cartService.addToCart({
      userId,
      productId: product.productId || product.$id,
      productName: product.productName || product.name || 'Product',
      price: dealPrice,
      image: productImage,
      quantity,
      dealId: product.$id,
      originalPrice: product.price || 0,
      discount: product.discount || 0,
    })
    setAddingToCart(false)

    if (result.success) {
      push({ title: 'Added to cart', message: `${product.productName || product.name} added to your cart at deal price!` })
    } else {
      push({ title: 'Failed to add', message: result.error || 'Please try again.' })
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    if (!isAuthenticated) {
      push({ title: 'Sign in required', message: 'Please sign in to buy this product.' })
      return
    }

    const userId = user?.$id || user?.id
    const dealPrice = product.dealPrice || product.price || 0
    const productImage = product.image || product.images?.[0] || ''

    setAddingToCart(true)
    const result = await cartService.addToCart({
      userId,
      productId: product.productId || product.$id,
      productName: product.productName || product.name || 'Product',
      price: dealPrice,
      image: productImage,
      quantity,
      dealId: product.$id,
      originalPrice: product.price || 0,
      discount: product.discount || 0,
    })
    setAddingToCart(false)

    if (!result.success) {
      push({ title: 'Failed to buy', message: result.error || 'Please try again.' })
      return
    }

    navigate('/checkout', {
      state: {
        items: [{
          id: result.data?.item?.$id || result.data?.item?.id,
          productId: product.productId || product.$id,
          name: product.productName || product.name || 'Product',
          price: dealPrice,
          quantity,
          image: productImage,
          dealId: product.$id,
          originalPrice: product.price || 0,
          discount: product.discount || 0,
        }],
        subtotal: dealPrice * quantity,
        delivery: (dealPrice * quantity) >= 1000 ? 0 : 150,
        total: (dealPrice * quantity) + ((dealPrice * quantity) >= 1000 ? 0 : 150),
      },
    })
  }

  if (loading) {
    return (
      <PageShell>
        <SeoHead title="Loading Deal..." robots="noindex,follow" />
        <div className="flex min-h-[60vh] items-center justify-center py-14">
          <Loader label="Loading deal details…" />
        </div>
      </PageShell>
    )
  }

  if (error && !product) {
    return (
      <PageShell>
        <SeoHead title="Deal Not Found" robots="noindex,follow" />
        <ResponsiveSection eyebrow="Deal" title="Deal not found" className="py-10 sm:py-14 lg:py-16">
          <EmptyState
            title="Deal not found"
            description={error}
            icon="🔍"
            action={<Link to="/deals"><PrimaryButton>Back to Deals</PrimaryButton></Link>}
          />
        </ResponsiveSection>
      </PageShell>
    )
  }

  const name = product?.productName || product?.name || 'Product'
  const dealPrice = product?.dealPrice || 0
  const originalPrice = product?.price || 0
  const discount = product?.discount || 0
  const images = product?.images || []
  const primaryImage = product?.image || ''
  const productImages = primaryImage ? [primaryImage, ...images.filter((img) => img !== primaryImage)] : images
  const description = product?.description || ''

  return (
    <PageShell>
      <SeoHead
        title={`${name} — Deal Price`}
        description={`Get ${name} at a special deal price of KES ${dealPrice.toLocaleString()} (was KES ${originalPrice.toLocaleString()})`}
        keywords={['deal', 'discount', 'flash sale', 'offer']}
      />

      <ResponsiveSection className="py-8 sm:py-12 lg:py-16">
        {/* Back Link */}
        <Link
          to="/deals"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-red-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Carousel */}
          <div className="space-y-4">
            <ImageCarousel images={productImages} productName={name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {discount >= 50 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500 text-white text-xs font-black animate-pulse">
                  BEST VALUE
                </span>
              )}
              {product?.isFlash && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
                  <Zap className="w-3 h-3" /> FLASH SALE
                </span>
              )}
              {product?.isPremium && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">
                  <Flame className="w-3 h-3" /> PREMIUM
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
              {name}
            </h1>

            {/* Category */}
            {product?.category && (
              <p className="text-sm text-[var(--color-text-muted)]">
                Category: {product.category}
              </p>
            )}

            {/* Price Section */}
            <div className="bg-[var(--color-surface-muted)] rounded-xl p-6 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-red-600">
                  KES {dealPrice.toLocaleString()}
                </span>
                <span className="text-lg text-[var(--color-text-muted)] line-through">
                  KES {originalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                  Save {discount}%
                </span>
                {product?.isExpiringSoon && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium animate-pulse">
                    <Clock className="w-3 h-3" /> Ending Soon
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Quantity:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-[var(--color-text-primary)]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)] hover:border-red-400 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
              >
                {addingToCart ? 'Adding…' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={addingToCart}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
              >
                {addingToCart ? 'Processing…' : 'Buy Now'}
              </button>
            </div>

            {/* Deal Info */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Deal Special Price</p>
                  <p className="text-xs text-red-600 mt-1">
                    You're seeing the discounted deal price. This deal will expire soon — don't miss out!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Deals */}
        <RelatedDeals currentDealId={dealId} />
      </ResponsiveSection>
    </PageShell>
  )
}

// ── Related Deals Component ──────────────────────────────────────────────────
function RelatedDeals({ currentDealId }) {
  const [deals, setDeals] = useState([])

  useEffect(() => {
    productService.getDealProducts().then(setDeals).catch(() => setDeals([]))
  }, [])

  const related = deals
    .filter((d) => d.$id !== currentDealId)
    .slice(0, 4)

  if (related.length === 0) return null

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Related Deals</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((deal) => (
          <Link
            key={deal.$id}
            to={`/deal/${deal.$id}`}
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              src={deal.image || '/logo.png'}
              alt={deal.productName}
              className="w-full h-32 object-cover"
              onError={(e) => { e.target.src = '/logo.png' }}
            />
            <div className="p-3">
              <p className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-2 min-h-[2.5rem] group-hover:text-red-600 transition-colors">
                {deal.productName}
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm font-bold text-red-600">
                  KES {deal.dealPrice?.toLocaleString?.()}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] line-through">
                  KES {deal.price?.toLocaleString?.()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DealProductPage
