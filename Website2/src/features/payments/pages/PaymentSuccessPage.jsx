import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'

const mockData = { orderId: 'NF-2024-003', amount: 'KES 4,400', delivery: '5–7 business days' }

function PaymentSuccessPage() {
  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 sm:h-28 sm:w-28 dark:bg-emerald-900/30">
            <svg className="h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Payment successful!</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Your order <span className="font-semibold text-gray-900 dark:text-white">{mockData.orderId}</span> has been placed and payment of{' '}
            <span className="font-semibold text-amber-600 dark:text-amber-400">{mockData.amount}</span> is confirmed.
          </p>

          <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div><p className="text-xs text-gray-500 dark:text-gray-500">Amount paid</p><p className="mt-1 font-semibold text-gray-900 dark:text-white">{mockData.amount}</p></div>
            <div><p className="text-xs text-gray-500 dark:text-gray-500">Estimated delivery</p><p className="mt-1 font-semibold text-gray-900 dark:text-white">{mockData.delivery}</p></div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/orders"><PrimaryButton className="w-full justify-center sm:w-auto">View order</PrimaryButton></Link>
            <Link to="/products"><Button variant="outline" className="w-full justify-center sm:w-auto">Continue shopping</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

export default PaymentSuccessPage
