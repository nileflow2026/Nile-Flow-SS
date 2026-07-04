import { useState, useEffect } from 'react'
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
import { imageProxyUrl } from '@api/config'

function ProductDetailPage() {
  const { productId } = useParams()
  const { isAuthenticated } = useAuth()
  const { push } = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (!productId) return

    const loadProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        // Try fetching from all products first, then find by ID
        const result = await productService.getProducts({ limit: 1 })
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

  if (loading) {
    return (
      <PageShell>
        <div className="responsive-shell py-14">
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

  // Route Appwrite storage images through the backend proxy (works in dev & production)
  const rawImage = product?.image || product?.imageUrl || ''
  const FALLBACK_IMAGE = '/logo.png'
  let imageUrl
  if (rawImage && rawImage.includes('appwrite.io')) {
    imageUrl = imageProxyUrl(rawImage, 800, 75)
  } else if (rawImage) {
    imageUrl = rawImage
  } else {
    imageUrl = FALLBACK_IMAGE
  }
  const stock = product?.stock
  const inStock = stock === undefined || stock > 0
  const premium = Boolean(product?.premiumEligible)
  const category = product?.category || ''

  return (
    <PageShell>
      <ResponsiveSection eyebrow={category || 'Product'} title={name} description={description} className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="aspect-[4/3] rounded-[1.5rem] bg-[var(--color-surface-muted)] overflow-hidden">
              <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {inStock ? (
                <Badge variant="success">{stock ? `In stock (${stock})` : 'In stock'}</Badge>
              ) : (
                <Badge variant="danger">Out of stock</Badge>
              )}
              {premium && <Badge variant="warning">Premium eligible</Badge>}
              <Badge variant="neutral">Free delivery</Badge>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              {category || 'Nile Flow'}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl">{name}</h1>
            <p className="mt-2 text-3xl font-bold text-[var(--color-accent)]">{priceStr}</p>

            {description && (
              <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">{description}</p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton
                className="w-full justify-center sm:w-auto sm:flex-1"
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
              >
                {addingToCart ? 'Adding…' : inStock ? `Add to cart — ${priceStr}` : 'Out of stock'}
              </PrimaryButton>
              <Button variant="outline" className="w-full justify-center sm:w-auto">Save</Button>
            </div>

            {!isAuthenticated && (
              <div className="mt-4">
                <Alert
                  title="Sign in to purchase"
                  description={<Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline">Sign in</Link>}
                  tone="info"
                />
              </div>
            )}
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProductDetailPage
