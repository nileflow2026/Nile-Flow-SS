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
                className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition sm:p-6 ${
                  selected === m.id ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-gray-200 bg-white hover:border-emerald-500/50 dark:border-gray-800 dark:bg-gray-900'
                }`}>
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] text-2xl ${
                  selected === m.id ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'
                }`}>{m.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{m.title}</p>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selected === m.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selected === m.id && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{m.desc}</p>
                </div>
              </button>
            ))}

            {selected === 'card' && (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                {['Card number', 'Name on card', 'Expiry', 'CVC'].map((f) => (
                  <label key={f} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {f}
                    <input className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder={f} />
                  </label>
                ))}
              </div>
            )}

            {selected === 'mpesa' && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  M-Pesa phone number
                  <input className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="+254 7XX XXX XXX" />
                </label>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">You will receive an STK push prompt on your phone to complete payment.</p>
              </div>
            )}

            <PrimaryButton className="w-full justify-center" loading={submitting} onClick={handlePay}>
              Pay {orderSummary.total}
            </PrimaryButton>
          </div>

          <div className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Order summary</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Items ({orderSummary.items})</span><span>{orderSummary.subtotal}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Delivery</span><span>{orderSummary.delivery}</span></div>
              <hr className="border-gray-200 dark:border-gray-800" />
              <div className="flex justify-between font-semibold text-gray-900 dark:text-white"><span>Total</span><span className="text-amber-600 dark:text-amber-400">{orderSummary.total}</span></div>
            </div>
            <Alert title="Secure checkout" description="All transactions are encrypted and processed securely." tone="info" className="mt-4" />
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default PaymentPage
