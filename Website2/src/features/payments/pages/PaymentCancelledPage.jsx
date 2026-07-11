import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Alert from '@shared/ui/alert/Alert'

function PaymentCancelledPage() {
  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 sm:h-28 sm:w-28">
            <span className="text-5xl text-amber-600">⚠</span>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Payment cancelled</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Your payment was not processed. No charges have been made to your account.
          </p>

          <div className="mt-6 text-left">
            <Alert
              title="Why was my payment cancelled?"
              description={
                'Payments can be cancelled if you closed the payment window, entered incorrect details, or your bank declined the transaction. You can retry or use a different method.'
              }
              tone="info"
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/payment"><PrimaryButton className="w-full justify-center sm:w-auto">Try again</PrimaryButton></Link>
            <Link to="/contact"><Button variant="outline" className="w-full justify-center sm:w-auto">Contact support</Button></Link>
            <Link to="/cart"><Button variant="ghost" className="w-full justify-center sm:w-auto">Back to cart</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

export default PaymentCancelledPage
