import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'

const policyPoints = [
  {
    title: 'Easy returns',
    description: 'Most eligible items can be returned within a short window after delivery for a full review.',
  },
  {
    title: 'Condition matters',
    description: 'Products should be returned in the same state they were received, including packaging and labels.',
  },
  {
    title: 'Fast support',
    description: 'If a delivery issue or quality issue appears, our team steps in quickly with clear next steps.',
  },
]

function ReturnPolicyPage() {
  return (
    <PageShell>
      <section className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 dark:from-emerald-950/20 dark:to-amber-950/20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-10 lg:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">Return policy</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            We make refunds and returns feel straightforward, not frustrating.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-400">
            If your order arrives damaged, incorrect, or not as expected, we will help you resolve it quickly and clearly.
          </p>
        </div>
      </section>

      <ResponsiveSection eyebrow="How it works" title="A support-first return experience" description="Returns are handled with clear expectations so there is less uncertainty and faster resolution.">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {policyPoints.map((item) => (
            <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ReturnPolicyPage