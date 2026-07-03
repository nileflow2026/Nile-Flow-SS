import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'

const methods = [
  { id: 'card', icon: '💳', title: 'Credit / Debit Card', desc: 'Visa, Mastercard, or American Express' },
  { id: 'mpesa', icon: '📱', title: 'M-Pesa', desc: 'Pay with your mobile money wallet' },
]

const orderSummary = { items: 3, subtotal: 'KES 4,150', delivery: 'KES 250', total: 'KES 4,400' }

function PaymentPage() {
  const [selected, setSelected] = useState('card')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handlePay = () => {
    setSubmitting(true)
    setTimeout(() => {
      navigate(selected === 'card' ? '/payment/success' : '/payment/success')
    }, 1500)
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Checkout" title="Payment method" description="Choose how to pay for your order." className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            {methods.map((m) => (
              <button key={m.id} onClick={() => setSelected(m.id)}
                className={`flex w-full items-start gap-4 rounded-[1.5rem] border-2 p-5 text-left transition sm:p-6 ${
                  selected === m.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/[0.03]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50'
                }`}>
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] text-2xl ${
                  selected === m.id ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-surface-muted)]'
                }`}>{m.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold text-[var(--color-text-primary)]">{m.title}</p>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selected === m.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-border)]'
                    }`}>
                      {selected === m.id && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{m.desc}</p>
                </div>
              </button>
            ))}

            {selected === 'card' && (
              <div className="space-y-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
                {['Card number', 'Name on card', 'Expiry', 'CVC'].map((f) => (
                  <label key={f} className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    {f}
                    <input className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder={f} />
                  </label>
                ))}
              </div>
            )}

            {selected === 'mpesa' && (
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  M-Pesa phone number
                  <input className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="+254 7XX XXX XXX" />
                </label>
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">You will receive an STK push prompt on your phone to complete payment.</p>
              </div>
            )}

            <PrimaryButton className="w-full justify-center" loading={submitting} onClick={handlePay}>
              Pay {orderSummary.total}
            </PrimaryButton>
          </div>

          <div className="h-fit rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">Order summary</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-[var(--color-text-secondary)]"><span>Items ({orderSummary.items})</span><span>{orderSummary.subtotal}</span></div>
              <div className="flex justify-between text-[var(--color-text-secondary)]"><span>Delivery</span><span>{orderSummary.delivery}</span></div>
              <hr className="border-[var(--color-border)]" />
              <div className="flex justify-between font-semibold text-[var(--color-text-primary)]"><span>Total</span><span className="text-[var(--color-accent)]">{orderSummary.total}</span></div>
            </div>
            <Alert title="Secure checkout" description="All transactions are encrypted and processed securely." tone="info" className="mt-4" />
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default PaymentPage
