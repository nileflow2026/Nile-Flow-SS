import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'
import { Banknote, CreditCard, Landmark, LockKeyhole, Smartphone, WalletCards } from 'lucide-react'

const methods = [
  {
    name: 'Payment on Delivery',
    label: 'Simple and familiar',
    description: 'Place your order online and pay when your delivery arrives. Availability may depend on your location, order value, and delivery conditions.',
    details: ['No card details required', 'Confirm your order at checkout', 'Pay the delivery team when your order arrives'],
    tone: 'border-emerald-200 bg-emerald-50/70',
    icon: Banknote,
    iconTone: 'bg-emerald-600 text-white',
  },
  {
    name: 'Pesapal',
    label: 'One secure checkout',
    description: 'Pesapal gives you a secure payment page with the methods available for your location and transaction.',
    details: ['M-Pesa and mobile money', 'Visa and Mastercard cards', 'Airtel Money and other supported methods'],
    tone: 'border-amber-200 bg-amber-50/70',
    icon: WalletCards,
    iconTone: 'bg-amber-500 text-white',
  },
]

const pesapalOptions = [
  { name: 'M-Pesa', icon: Smartphone, tone: 'text-emerald-600 bg-emerald-50' },
  { name: 'Visa', icon: CreditCard, tone: 'text-blue-700 bg-blue-50' },
  { name: 'Mastercard', icon: CreditCard, tone: 'text-orange-600 bg-orange-50' },
  { name: 'Airtel Money', icon: Smartphone, tone: 'text-red-600 bg-red-50' },
  { name: 'Bank payment', icon: Landmark, tone: 'text-slate-600 bg-slate-50' },
]

function PaymentMethodsPage() {
  return (
    <PageShell>
      <SeoHead
        title="Payment Methods | Nile Flow"
        description="Explore Nile Flow payment methods, including Payment on Delivery and secure Pesapal checkout with M-Pesa, cards, Airtel Money, and other supported options."
        keywords={['Nile Flow payment methods', 'Pesapal', 'M-Pesa', 'Airtel Money', 'card payments', 'payment on delivery']}
      />

      <section className="bg-gradient-to-br from-emerald-50/70 via-transparent to-amber-50/60 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="responsive-shell text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Secure checkout</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
            Payment methods that fit the way you shop.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
            Choose the option that works best for you. Payment availability is confirmed at checkout based on your location, order, and the payment providers available at that time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-2">
          {methods.map((method) => (
            <article key={method.name} className={`rounded-3xl border p-6 shadow-[var(--shadow-sm)] sm:p-8 ${method.tone}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${method.iconTone}`} aria-hidden="true">
                  <method.icon size={27} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{method.label}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">{method.name}</h2>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-[var(--color-text-secondary)]">{method.description}</p>
              <ul className="mt-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
                {method.details.map((detail) => <li key={detail} className="flex gap-3"><span className="font-bold text-emerald-600" aria-hidden="true">✓</span><span>{detail}</span></li>)}
              </ul>
            </article>
          ))}
        </div>

        <article className="mt-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">Inside Pesapal</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">More ways to complete one payment.</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                Select Pesapal at checkout and you will be redirected to its secure payment page. The payment methods shown there are the methods currently enabled for your transaction.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pesapalOptions.map((option) => <div key={option.name} className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] sm:text-sm"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${option.tone}`}><option.icon size={15} /></span><span className="truncate">{option.name}</span></div>)}
            </div>
          </div>
        </article>

        <div className="mt-8 flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm leading-7 text-[var(--color-text-secondary)] sm:p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><LockKeyhole size={19} /></span>
          <p><strong className="text-[var(--color-text-primary)]">Payment safety:</strong> Nile Flow does not store your full card number or mobile money PIN. Always complete payment on the secure provider page and never share your PIN with anyone.</p>
        </div>
      </section>
    </PageShell>
  )
}

export default PaymentMethodsPage
