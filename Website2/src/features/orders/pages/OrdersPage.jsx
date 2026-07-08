import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Loader from '@shared/ui/loader/Loader'
import Alert from '@shared/ui/alert/Alert'
import { useAuth } from '@auth/AuthContext'
import { ProtectedRoute } from '@auth/routeGuards'
import { orderService } from '@api/services'

// Status colors are now managed in orderService.getStatusColor()
// Removed hardcoded statusColors map — using the service for consistency

function OrdersPage() {
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    const loadOrders = async () => {
      setLoading(true)
      try {
        let result = await orderService.getOrders()
        if (result.length === 0) {
          result = await orderService.getCustomerOrders()
        }
        setOrders(result)
      } catch (err) {
        setError(err?.message || 'Failed to load orders.')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [isAuthenticated])

  return (
    <ProtectedRoute requireAuth>
      <PageShell>
        <ResponsiveSection
          eyebrow="Orders"
          title="Your order history"
          description="Track, review, and manage all your Nile Flow purchases in one place."
          className="py-10 sm:py-14 lg:py-16"
        >
          <Alert
            title="Need to cancel an order?"
            description="You can request a cancellation within 24 hours for orders in Pending or Processing status."
            tone="info"
          >
            <Link to="/cancel-order" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-emerald-400">
              Cancel an order
            </Link>
          </Alert>

          {loading ? (
            <div className="mt-8">
              <Loader label="Loading your orders…" />
            </div>
          ) : error ? (
            <div className="mt-8">
              <EmptyState title="Failed to load orders" description={error} icon="⚠️" />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="When you place your first order, it will appear here for tracking and management."
              icon="🛒"
              action={<Link to="/products"><PrimaryButton>Start shopping</PrimaryButton></Link>}
            />
          ) : (
            <div className="mt-8 space-y-4">
              {orders.map((order) => {
                const orderId = order.$id || order.id || order.orderId
                const status = order.status || 'Pending'
                const date = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                  : order.date || '—'
                const total = order.totalAmount || order.total || 0
                const totalStr = typeof total === 'number'
                  ? `KSh ${Math.round(total).toLocaleString()}`
                  : total || '—'
                const itemsCount = order.items?.length || order.itemCount || 0

                return (
                  <div key={orderId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {orderId?.substring(0, 13) || 'Order'}
                          </p>
                          <Badge variant={orderService.getStatusColor(status)}>{orderService.getStatusLabel(status)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {date}{itemsCount ? ` · ${itemsCount} item${itemsCount > 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{totalStr}</p>
                        <Link
                          to={`/track-order/${orderId}`}
                          className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                        >
                          Track
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ResponsiveSection>
      </PageShell>
    </ProtectedRoute>
  )
}

export default OrdersPage
