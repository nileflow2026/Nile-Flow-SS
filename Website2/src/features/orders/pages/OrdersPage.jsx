import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Alert from '@shared/ui/alert/Alert'

const mockOrders = [
  { id: 'NF-2024-001', date: '15 Jun 2024', total: 'KES 2,400', status: 'Delivered', items: 3 },
  { id: 'NF-2024-002', date: '22 Jun 2024', total: 'KES 1,150', status: 'Processing', items: 1 },
  { id: 'NF-2024-003', date: '30 Jun 2024', total: 'KES 4,800', status: 'Shipped', items: 5 },
]

const statusColors = {
  Delivered: 'success',
  Processing: 'default',
  Shipped: 'primary',
  Cancelled: 'warning',
}

function OrdersPage() {
  const [orders] = useState(mockOrders)

  return (
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
          <Link to="/cancel-order" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
            Cancel an order
          </Link>
        </Alert>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When you place your first order, it will appear here for tracking and management."
            icon="🛒"
            action={<Link to="/products"><PrimaryButton>Start shopping</PrimaryButton></Link>}
          />
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{order.id}</p>
                      <Badge variant={statusColors[order.status] || 'default'}>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{order.date} · {order.items} item{order.items > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold text-[var(--color-accent)]">{order.total}</p>
                    <Link
                      to={`/track-order/${order.id}`}
                      className="rounded-full bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                    >
                      Track
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default OrdersPage
