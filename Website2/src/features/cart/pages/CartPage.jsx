import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { cartService } from '@api/services'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { imageProxyUrl } from '@api/config'
import { usePostHog } from '@posthog/react'

function CartPage() {
  const { isAuthenticated, user } = useAuth()
  const { push } = useToast()
  const posthog = usePostHog()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState(null)

  const userId = user?.$id || user?.id

  const loadCart = useCallback(async () => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const cartItems = await cartService.getCart(userId)
      setItems(cartItems)
    } catch {
      setError('Failed to load cart.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const handleRemoveItem = async (itemId) => {
    setUpdatingId(itemId)
    const removed = await cartService.removeFromCart(itemId)
    if (removed) {
      const removedItem = items.find((item) => (item.$id || item.id) === itemId)
      posthog.capture('remove_from_cart', {
        product_id: removedItem?.productId,
        product_name: removedItem?.productName || removedItem?.name,
        price: getItemPrice(removedItem),
      })
      setItems((prev) => prev.filter((item) => (item.$id || item.id) !== itemId))
      push({ title: 'Removed', message: 'Item removed from cart.' })
    } else {
      push({ title: 'Failed', message: 'Could not remove item.' })
    }
    setUpdatingId(null)
  }

  const handleClearCart = async () => {
    if (!userId) return
    const cleared = await cartService.clearCart(userId)
    if (cleared) {
      posthog.capture('cart_cleared', { item_count: items.length })
      setItems([])
      push({ title: 'Cart cleared', message: 'All items removed.' })
    }
  }

  // Helper: extract numeric price from item (handles both raw numbers and
  // enriched { basePrice, convertedPrice, displayValue } objects from backend)
  function getItemPrice(item) {
    if (!item) return 0
    // Backend enrichment wraps price in an object
    if (typeof item.price === 'object' && item.price !== null) {
      return item.price.convertedPrice ?? item.price.basePrice ?? item.price.raw ?? 0
    }
    // Direct numeric price
    if (typeof item.price === 'number') return item.price
    return 0
  }

  // Helper: get item image from any field name, route Appwrite URLs through proxy
  function getItemImage(item) {
    const raw = item?.image || item?.productImage || item?.images?.[0] || ''
    if (raw && raw.includes('appwrite.io')) {
      return imageProxyUrl(raw, 120, 70)
    }
    return raw
  }

  // Calculate totals from current items
  const subtotal = items.reduce((acc, item) => {
    const price = getItemPrice(item)
    const qty = item?.quantity || 1
    return acc + price * qty
  }, 0)

  if (!isAuthenticated) {
    return (
      <PageShell>
        <ResponsiveSection eyebrow="Cart" title="Shopping cart" description="Sign in to view your cart items." className="py-10 sm:py-14 lg:py-16">
          <EmptyState
            title="Sign in required"
            description="Please sign in to view your shopping cart and saved items."
            icon="🔒"
            action={<Link to="/login"><PrimaryButton>Sign in</PrimaryButton></Link>}
          />
        </ResponsiveSection>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Cart" title="Shopping cart" description="Review your items and proceed to checkout." className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              <Loader label="Loading cart…" />
            ) : error ? (
              <EmptyState title="Error loading cart" description={error} icon="⚠️" />
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-lg)] sm:p-8">
                <p className="text-base font-semibold text-[var(--color-text-primary)]">Your cart is empty</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Add items from our product catalog to get started.</p>
                <Link to="/products" className="mt-4 inline-block">
                  <PrimaryButton>Browse products</PrimaryButton>
                </Link>
              </div>
            ) : (
              <>
                {items.map((item) => {
                  const itemId = item.$id || item.id
                  const name = item.productName || item.name || 'Product'
                  const itemPrice = getItemPrice(item)
                  const qty = item?.quantity || 1
                  const lineTotal = Math.round(itemPrice * qty)
                  const priceStr = `KSh ${lineTotal.toLocaleString()}`
                  const image = getItemImage(item)

                  return (
                    <div key={itemId} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-[var(--color-surface-muted)] sm:h-20 sm:w-20">
                        {image ? (
                          <img src={image} alt={name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-2xl">🛍️</span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Qty: {qty}</p>
                        <p className="text-sm font-semibold text-amber-600">{priceStr}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto sm:shrink-0"
                        onClick={() => handleRemoveItem(itemId)}
                        disabled={updatingId === itemId}
                      >
                        {updatingId === itemId ? '…' : 'Remove'}
                      </Button>
                    </div>
                  )
                })}
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={handleClearCart}>Clear cart</Button>
                </div>
              </>
            )}

            {items.length > 0 && (
              <Alert title="Free delivery" description="Orders over KES 1,000 qualify for free delivery within Nairobi." tone="info" />
            )}
          </div>

          <div className="h-fit rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8 xl:sticky xl:top-24">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Summary</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-[var(--color-text-primary)]">KSh {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {subtotal >= 1000 ? 'Free' : 'KSh 150'}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-3 text-base font-semibold text-[var(--color-text-primary)] sm:flex-row sm:items-center sm:justify-between">
                <span>Total</span>
                <span>KSh {(subtotal + (subtotal >= 1000 ? 0 : 150)).toLocaleString()}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              onClick={() => posthog.capture('checkout_started', {
                item_count: items.length,
                subtotal,
                total: subtotal + (subtotal >= 1000 ? 0 : 150),
              })}
              state={{
                items: items.map((item) => ({
                  id: item.$id || item.id,
                  productId: item.productId,
                  name: item.productName || item.name || 'Product',
                  price: getItemPrice(item),
                  unitDisplay: item?.price?.displayValue || `KSh ${Math.round(getItemPrice(item)).toLocaleString()}`,
                  quantity: item.quantity || 1,
                  image: getItemImage(item),
                })),
                subtotal,
                delivery: subtotal >= 1000 ? 0 : 150,
                total: subtotal + (subtotal >= 1000 ? 0 : 150),
              }}
            >
              <PrimaryButton className="mt-6 w-full justify-center" disabled={items.length === 0}>
                Continue to checkout
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default CartPage
