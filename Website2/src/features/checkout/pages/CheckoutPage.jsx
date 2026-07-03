import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Modal from '@shared/ui/modal/Modal'

function CheckoutPage() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Checkout" title="Complete your order" description="A responsive checkout experience that keeps inputs, summary details, and primary actions clear on any device." className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Full name
                <input className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-primary)]" placeholder="Jane Doe" />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Delivery address
                <input className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-primary)]" placeholder="Nairobi, Kenya" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Phone
                  <input className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-primary)]" placeholder="0712345678" />
                </label>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Payment method
                  <select className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option>Card</option>
                    <option>M-Pesa</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">Order summary</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between"><span>Product</span><span className="font-semibold text-[var(--color-text-primary)]">KES 1,250</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-semibold text-[var(--color-text-primary)]">Free</span></div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-semibold text-[var(--color-text-primary)]"><span>Total</span><span>KES 1,250</span></div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <PrimaryButton className="w-full justify-center">Place order</PrimaryButton>
              <button onClick={() => setIsHelpOpen(true)} className="text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-accent)]">Need help with checkout?</button>
            </div>
          </div>
        </div>
      </ResponsiveSection>

      <Modal isOpen={isHelpOpen} title="Checkout support" description="Our team can help with payments, delivery, and order questions before you complete your purchase." onClose={() => setIsHelpOpen(false)} footer={[
        <button key="close" onClick={() => setIsHelpOpen(false)} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]">Close</button>,
        <PrimaryButton key="confirm" className="justify-center">Contact support</PrimaryButton>,
      ]}>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)]">Choose card or M-Pesa at checkout, and we’ll keep your order flow simple and transparent from start to finish.</p>
      </Modal>
    </PageShell>
  )
}

export default CheckoutPage
