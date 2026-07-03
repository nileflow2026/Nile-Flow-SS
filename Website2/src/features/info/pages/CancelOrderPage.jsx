import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import { useToast } from '@shared/ui/toast/ToastProvider'

const reasons = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery takes too long',
  'Item no longer needed',
  'Duplicate order',
  'Payment issue',
  'Other',
]

function CancelOrderPage() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ orderId: searchParams.get('orderId') || '', reason: '', details: '' })
  const [submitted, setSubmitted] = useState(false)
  const { push } = useToast()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.orderId || !form.reason) return
    push({ title: 'Cancellation requested', message: `Order ${form.orderId} has been submitted for cancellation.` })
    setSubmitted(true)
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Orders" title="Cancel an order" description="Submit a cancellation request. Eligible orders are processed within 24 hours." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <Alert
            title="Cancellation policy"
            description="Orders in Pending or Processing status can be cancelled within 24 hours of placement. Shipped orders must go through our standard return process."
            tone="info"
          />

          {submitted ? (
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
              <Alert title="Request submitted" description={`Your cancellation request for ${form.orderId} is being reviewed. We'll notify you within 24 hours.`} tone="success" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Order ID
                  <input value={form.orderId} onChange={(e) => setForm((cur) => ({ ...cur, orderId: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    placeholder="e.g. NF-2024-001" required />
                </label>

                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Reason for cancellation
                  <select value={form.reason} onChange={(e) => setForm((cur) => ({ ...cur, reason: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] cursor-pointer" required>
                    <option value="">Select a reason</option>
                    {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Additional details <span className="text-[var(--color-text-muted)]">(optional)</span>
                  <textarea value={form.details} onChange={(e) => setForm((cur) => ({ ...cur, details: e.target.value }))} rows={3}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] resize-none"
                    placeholder="Any extra context we should know..." />
                </label>
              </div>
              <PrimaryButton type="submit" className="mt-6 w-full justify-center">Submit cancellation request</PrimaryButton>
            </form>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default CancelOrderPage
