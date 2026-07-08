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

function CartPage() {
  const { isAuthenticated, user } = useAuth()
  const { push } = useToast()

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
      setItems([])
      push({ title: 'Cart cleared', message: 'All items removed.' })
    }
  }

  // Calculate totals from current items
  const subtotal = items.reduce((acc, item) => {
    const price = item?.price || 0
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
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            {loading ? (
              <Loader label="Loading cart…" />
            ) : error ? (
              <EmptyState title="Error loading cart" description={error} icon="⚠️" />
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <p className="text-base font-semibold text-gray-900 dark:text-white">Your cart is empty</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Add items from our product catalog to get started.</p>
                <Link to="/products" className="mt-4 inline-block">
                  <PrimaryButton>Browse products</PrimaryButton>
                </Link>
              </div>
            ) : (
              <>
                {items.map((item) => {
                  const itemId = item.$id || item.id
                  const name = item.productName || item.name || 'Product'
                  const price = item?.price || 0
                  const qty = item?.quantity || 1
                  const priceStr = `KSh ${Math.round(price * qty).toLocaleString()}`
                  const image = item?.image || ''

                  return (
                    <div key={itemId} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1rem] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        {image ? (
                          <img src={image} alt={name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-2xl">🛍️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Qty: {qty}</p>
                        <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">{priceStr}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="shrink-0"
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

          <div className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Summary</p>
            <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-gray-900 dark:text-white">KSh {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {subtotal >= 1000 ? 'Free' : 'KSh 150'}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-800 pt-3 text-base font-semibold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>KSh {(subtotal + (subtotal >= 1000 ? 0 : 150)).toLocaleString()}</span>
              </div>
            </div>
            <Link to="/checkout">
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
