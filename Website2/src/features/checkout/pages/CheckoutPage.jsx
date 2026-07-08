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
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full name
                <input className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-0 focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Jane Doe" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery address
                <input className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-0 focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Nairobi, Kenya" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                  <input className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-0 focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="0712345678" />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment method
                  <select className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option>Card</option>
                    <option>M-Pesa</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Order summary</p>
            <div className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between"><span>Product</span><span className="font-semibold text-gray-900 dark:text-white">KES 1,250</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-semibold text-gray-900 dark:text-white">Free</span></div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-800 pt-3 text-base font-semibold text-gray-900 dark:text-white"><span>Total</span><span>KES 1,250</span></div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <PrimaryButton className="w-full justify-center">Place order</PrimaryButton>
              <button onClick={() => setIsHelpOpen(true)} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition hover:text-amber-600 dark:hover:text-amber-400">Need help with checkout?</button>
            </div>
          </div>
        </div>
      </ResponsiveSection>

      <Modal isOpen={isHelpOpen} title="Checkout support" description="Our team can help with payments, delivery, and order questions before you complete your purchase." onClose={() => setIsHelpOpen(false)} footer={[
        <button key="close" onClick={() => setIsHelpOpen(false)} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">Close</button>,
        <PrimaryButton key="confirm" className="justify-center">Contact support</PrimaryButton>,
      ]}>
        <p className="text-sm leading-7 text-gray-600 dark:text-gray-400">Choose card or M-Pesa at checkout, and we'll keep your order flow simple and transparent from start to finish.</p>
      </Modal>
    </PageShell>
  )
}

export default CheckoutPage