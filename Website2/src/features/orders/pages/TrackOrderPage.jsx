import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'
import { orderService } from '@api/services'
import { useAuth } from '@auth/AuthContext'

function TrackOrderPage() {
  const { orderId } = useParams()
  const { isAuthenticated } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !orderId) {
      setLoading(false)
      return
    }

    const loadOrder = async () => {
      setLoading(true)
      setError(null)
      try {
        // Try the consolidated endpoint first, then fallbacks
        const result = await orderService.getOrder(orderId)
        if (result) {
          setOrder(result)
        } else {
          setError('Order not found')
        }
      } catch (err) {
        setError(err?.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, isAuthenticated])

  // Parse items from the order (stored as JSON string or array in DB)
  let parsedItems = []
  if (order) {
    if (Array.isArray(order.items)) {
      parsedItems = order.items
    } else if (typeof order.items === 'string') {
      try { parsedItems = JSON.parse(order.items) } catch { parsedItems = [] }
    }
  }

  const status = order?.orderStatus || order?.status || ''
  const orderNumber = order?.orderNumber || orderId
  const displayName = orderNumber.startsWith('NF-') ? orderNumber : orderNumber?.substring(0, 13) || 'Order'
  const date = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const total = order?.amount || order?.totalAmount || order?.total || 0
  const totalStr = typeof total === 'number' ? `KSh ${Math.round(total).toLocaleString()}` : total || '—'
  const paymentMethod = order?.paymentMethod || '—'
  const deliveryAddress = order?.deliveryAddress || ''
  const customerPhone = order?.customerPhone || order?.mpesaPhone || ''

  if (loading) {
    return (
      <PageShell>
        <ResponsiveSection eyebrow="Tracking" title="Track your order" className="py-10 sm:py-14 lg:py-16">
          <div className="mx-auto flex max-w-2xl justify-center rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
            <Loader label="Loading order details…" />
          </div>
        </ResponsiveSection>
      </PageShell>
    )
  }

  if (error || !order) {
    return (
      <PageShell>
        <ResponsiveSection eyebrow="Tracking" title="Track your order" className="py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-6 shadow-sm sm:p-8">
            <Alert
              title="Order not found"
              description={error || 'No tracking information is available for this order ID. Please check and try again.'}
              tone="warning"
            />
          </div>
        </ResponsiveSection>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <ResponsiveSection
        eyebrow="Tracking"
        title={`Order ${displayName}`}
        description={`Placed on ${date} · ${parsedItems.length} item${parsedItems.length !== 1 ? 's' : ''}`}
        className="py-10 sm:py-14 lg:py-16"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Items</p>
              <div className="mt-4 space-y-3">
                {parsedItems.map((item, idx) => (
                  <div key={item.productId || idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.productName || item.name || 'Product'}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)]">
                      KSh {Math.round((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status timeline — build from order status history if available */}
            <div className="rounded-[2rem] border border-gray-200 bg-gradient-to-br from-white to-emerald-50/60 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Timeline</p>
              <div className="mt-4 space-y-1">
                <div className="relative flex gap-4 pb-6 pl-8 last:pb-0">
                  <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-emerald-600 bg-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Current status</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {orderService.getStatusLabel(status) || status || 'Pending'}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{date}</p>
                  </div>
                </div>
                <div className="relative flex gap-4 pb-6 pl-8 last:pb-0">
                  <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface-muted)]" />
                  {true && <div className="absolute left-[7px] top-7 h-full w-0.5 bg-[var(--color-border)]" />}
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-text-muted)]">Order placed</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{date}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Order details</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between">
                <span>Order</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{displayName}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <Badge variant={orderService.getStatusColor(status)}>{orderService.getStatusLabel(status) || status || 'Pending'}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{totalStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{paymentMethod}</span>
              </div>
              {deliveryAddress && (
                <div className="flex justify-between">
                  <span>Deliver to</span>
                  <span className="font-semibold text-[var(--color-text-primary)] text-right max-w-[60%]">{deliveryAddress}</span>
                </div>
              )}
              {customerPhone && (
                <div className="flex justify-between">
                  <span>Phone</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{customerPhone}</span>
                </div>
              )}
            </div>
            <PrimaryButton className="mt-6 w-full justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Get support</PrimaryButton>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}
export default TrackOrderPage
