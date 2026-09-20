import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import { httpClient } from '@api/services'

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) {
      setError('We could not identify this order.')
      return undefined
    }

    let cancelled = false
    let timer
    const poll = async () => {
      try {
        const response = await httpClient.get(`/api/payments/pesapal/status/${encodeURIComponent(orderId)}`)
        const data = response.data || response
        if (cancelled) return
        setPayment(data)
        if (data.paymentStatus === 'pending') timer = window.setTimeout(poll, 2500)
      } catch (requestError) {
        if (!cancelled) setError(requestError?.response?.data?.message || requestError.message || 'Unable to verify payment.')
      }
    }
    poll()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [orderId])

  const isPending = payment?.paymentStatus === 'pending' || (!payment && !error)
  const isSuccessful = payment?.paymentStatus === 'succeeded'
  const title = isPending ? 'Confirming your payment…' : isSuccessful ? 'Payment successful!' : 'Payment could not be confirmed'

  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 sm:h-28 sm:w-28">
            <svg className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {isPending ? 'Pesapal is processing your payment. This page will update automatically.' : error || (isSuccessful ? `Your order ${payment.orderNumber} has been placed and payment is confirmed.` : 'Please retry the payment or contact support.')}
          </p>

          {isSuccessful && <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <p className="text-xs text-[var(--color-text-muted)]">Order number</p>
            <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{payment.orderNumber}</p>
          </div>}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={isSuccessful ? '/orders' : '/cart'}><PrimaryButton className="w-full justify-center sm:w-auto">{isSuccessful ? 'View order' : 'Return to cart'}</PrimaryButton></Link>
            <Link to="/products"><Button variant="outline" className="w-full justify-center sm:w-auto">Continue shopping</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

export default PaymentSuccessPage
