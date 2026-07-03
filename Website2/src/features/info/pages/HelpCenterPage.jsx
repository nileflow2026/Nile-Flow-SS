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
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)] sm:p-10 lg:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Help Center</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Quick answers for shopping, delivery, and account support.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-text-secondary)]">
            Whether you need help with delivery, payments, or premium benefits, our support team keeps the experience simple and responsive.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton>Contact support</PrimaryButton>
            <a href="/track-order" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              Track an order
            </a>
          </div>
        </div>
      </section>

      <ResponsiveSection eyebrow="Popular questions" title="Support topics that matter most" description="These are the common questions we hear from shoppers and merchants every day.">
        <div className="space-y-4">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{item.answer}</p>
            </div>
          ))}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default HelpCenterPage
