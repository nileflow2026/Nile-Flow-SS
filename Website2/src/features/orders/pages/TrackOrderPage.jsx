import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import Alert from '@shared/ui/alert/Alert'
import Loader from '@shared/ui/loader/Loader'

const mockTrackData = {
  'NF-2024-001': {
    id: 'NF-2024-001',
    status: 'Delivered',
    estimated: '18 Jun 2024',
    carrier: 'Nile Flow Logistics',
    updates: [
      { date: '18 Jun 2024 · 14:30', label: 'Delivered', description: 'Package left at reception desk' },
      { date: '18 Jun 2024 · 09:15', label: 'Out for delivery', description: 'With rider in Nairobi CBD' },
      { date: '17 Jun 2024 · 16:00', label: 'Arrived at hub', description: 'Sorted at Nairobi sort center' },
      { date: '16 Jun 2024 · 22:10', label: 'In transit', description: 'Departed Mombasa sorting facility' },
      { date: '15 Jun 2024 · 18:45', label: 'Order confirmed', description: 'Payment verified and order processed' },
    ],
  },
}

function TrackOrderPage() {
  const { orderId } = useParams()
  const [tracking] = useState(mockTrackData[orderId] || null)

  if (!tracking) {
    return (
      <PageShell>
        <ResponsiveSection eyebrow="Tracking" title="Track your order" className="py-10 sm:py-14 lg:py-16">
          <Alert
            title="Order not found"
            description="No tracking information is available for this order ID. Please check and try again."
            tone="warning"
          />
        </ResponsiveSection>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <ResponsiveSection
        eyebrow="Tracking"
        title={`Order ${tracking.id}`}
        description={`Estimated delivery: ${tracking.estimated} via ${tracking.carrier}`}
        className="py-10 sm:py-14 lg:py-16"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-1">
            {tracking.updates.map((update, index) => (
              <div key={index} className="relative flex gap-4 pb-6 pl-8 last:pb-0">
                <div className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 ${
                  index === 0
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-muted)]'
                }`} />
                {index < tracking.updates.length - 1 && (
                  <div className="absolute left-[7px] top-7 h-full w-0.5 bg-[var(--color-border)]" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{update.label}</p>
                    {index === 0 && <Badge variant="success">Latest</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{update.description}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{update.date}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">Delivery details</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between"><span>Status</span><Badge variant="success">{tracking.status}</Badge></div>
              <div className="flex justify-between"><span>Carrier</span><span className="font-semibold text-[var(--color-text-primary)]">{tracking.carrier}</span></div>
              <div className="flex justify-between"><span>Estimated</span><span className="font-semibold text-[var(--color-text-primary)]">{tracking.estimated}</span></div>
            </div>
            <PrimaryButton className="mt-6 w-full justify-center">Get support</PrimaryButton>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default TrackOrderPage
