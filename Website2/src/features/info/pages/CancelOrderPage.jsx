import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { orderService } from '@api/services'

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
  const { user } = useAuth()
  const [form, setForm] = useState({ orderId: searchParams.get('orderId') || '', reason: '', details: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState(null)
  const { push } = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.orderId || !form.reason) return

    setSubmitting(true)
    setServerError(null)

    const result = await orderService.cancelOrder({
      orderId: form.orderId,
      reason: form.reason,
      additionalDetails: form.details,
      customerEmail: user?.email,
      customerName: user?.name || user?.username,
    })

    setSubmitting(false)

    if (result.success) {
      push({ title: 'Cancellation requested', message: `Order ${form.orderId} has been submitted for cancellation.` })
      setSubmitted(true)
    } else {
      setServerError(result.error || 'Failed to submit cancellation request.')
    }
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Orders" title="Cancel an order" description="Submit a cancellation request. Eligible orders are processed within 24 hours." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-5 shadow-sm sm:p-6">
            <Alert
              title="Cancellation policy"
              description="Orders in Pending or Processing status can be cancelled within 24 hours of placement. Shipped orders must go through our standard return process."
              tone="info"
            />
          </div>

          {submitted ? (
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
              <Alert title="Request submitted" description={`Your cancellation request for ${form.orderId} is being reviewed. We'll notify you within 24 hours.`} tone="success" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
              <div className="space-y-5">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Order ID
                  <input value={form.orderId} onChange={(e) => setForm((cur) => ({ ...cur, orderId: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-emerald-500 focus:bg-white"
                    placeholder="e.g. NF-2024-001" required />
                </label>

                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Reason for cancellation
                  <select value={form.reason} onChange={(e) => setForm((cur) => ({ ...cur, reason: e.target.value }))}
                    className="mt-2 w-full cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-emerald-500 focus:bg-white" required>
                    <option value="">Select a reason</option>
                    {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Additional details <span className="text-[var(--color-text-muted)]">(optional)</span>
                  <textarea value={form.details} onChange={(e) => setForm((cur) => ({ ...cur, details: e.target.value }))} rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-emerald-500 focus:bg-white"
                    placeholder="Any extra context we should know..." />
                </label>
              </div>
              <PrimaryButton type="submit" className="mt-6 w-full justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Submit cancellation request</PrimaryButton>
            </form>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default CancelOrderPage
