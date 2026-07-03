import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Alert from '@shared/ui/alert/Alert'

function CartPage() {
  return (
    <PageShell>
      <ResponsiveSection eyebrow="Cart" title="Your cart" description="A responsive cart layout that stays clear and usable whether the user is browsing on a phone or reviewing a full basket on a larger display." className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Alert title="Delivery note" description="Your basket is optimized for a smooth checkout flow with clear pricing and simple next steps." tone="info" />
            {[1, 2].map((item) => (
              <div key={item} className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:p-5">
                <div className="h-24 w-full rounded-[1rem] bg-gradient-to-br from-emerald-100 to-white sm:w-24" />
                <div className="flex-1">
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">Basket item {item}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Compact content and clear spacing keep the experience comfortable on smaller screens.</p>
                </div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">KES 850</div>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">Summary</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-[var(--color-text-primary)]">KES 1,700</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-semibold text-[var(--color-text-primary)]">Free</span></div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-semibold text-[var(--color-text-primary)]"><span>Total</span><span>KES 1,700</span></div>
            </div>
            <PrimaryButton className="mt-6 w-full justify-center">Continue to checkout</PrimaryButton>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default CartPage
