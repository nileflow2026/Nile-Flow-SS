import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'

const mockItems = [
  { name: 'Nile Premium Coffee', price: 'KES 1,200', qty: 1 },
  { name: 'Organic Shea Butter', price: 'KES 850', qty: 2 },
]

function CartPage() {
  const subtotal = mockItems.reduce((acc, item) => {
    const price = parseInt(item.price.replace(/[^0-9]/g, ''))
    return acc + price * item.qty
  }, 0)

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Cart" title="Shopping cart" description="Review your items and proceed to checkout." className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            {mockItems.length === 0 ? (
              <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
                <p className="text-base font-semibold text-[var(--color-text-primary)]">Your cart is empty</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Add items from our product catalog to get started.</p>
              </div>
            ) : (
              mockItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--color-surface-muted)] text-2xl">
                    {item.name.includes('Coffee') ? '☕' : '🧴'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{item.name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Qty: {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] whitespace-nowrap">{item.price}</p>
                </div>
              ))
            )}
            <Alert title="Free delivery" description="Orders over KES 1,000 qualify for free delivery within Nairobi." tone="info" />
          </div>

          <div className="h-fit rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">Summary</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-[var(--color-text-primary)]">KES {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-semibold text-[var(--color-text-primary)]">Free</span></div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-semibold text-[var(--color-text-primary)]"><span>Total</span><span>KES {subtotal.toLocaleString()}</span></div>
            </div>
            <PrimaryButton className="mt-6 w-full justify-center">Continue to checkout</PrimaryButton>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default CartPage
