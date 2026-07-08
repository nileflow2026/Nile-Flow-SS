import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'

const faqs = [
  {
    question: 'How do I track my order?',
    answer: 'Use the order tracker from your account or follow the live status from the checkout confirmation page.',
  },
  {
    question: 'Can I change my delivery address?',
    answer: 'Yes, if the order has not yet moved too far into fulfillment, we can help you update it quickly.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We support cards, mobile money, and wallet-based flows tailored for trusted local commerce.',
  },
]

function HelpCenterPage() {
  return (
    <PageShell>
      <section className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 dark:from-emerald-950/20 dark:to-amber-950/20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-10 lg:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Help Center</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Quick answers for shopping, delivery, and account support.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-400">
            Whether you need help with delivery, payments, or premium benefits, our support team keeps the experience simple and responsive.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton>Contact support</PrimaryButton>
            <a href="/track-order" className="inline-flex min-h-11 items-center justify-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-emerald-600 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-emerald-400 dark:hover:text-emerald-400">
              Track an order
            </a>
          </div>
        </div>
      </section>

      <ResponsiveSection eyebrow="Popular questions" title="Support topics that matter most" description="These are the common questions we hear from shoppers and merchants every day.">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-400">{item.answer}</p>
            </div>
          ))}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default HelpCenterPage