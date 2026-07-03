import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'

const pillars = [
  {
    title: 'Trusted sourcing',
    description: 'We hand-pick products and partners with a focus on quality, authenticity, and long-term trust.',
  },
  {
    title: 'Built for Africa',
    description: 'Every experience is shaped for local realities, mobile-first journeys, and dependable delivery.',
  },
  {
    title: 'Commerce + fintech',
    description: 'Nile Flow connects shopping, payments, and loyalty into a single fluid experience for modern users.',
  },
]

function AboutPage() {
  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)] sm:p-10 lg:p-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">About Nile Flow</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              We are building a more confident way to discover and buy across Africa.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
              Nile Flow brings together trusted merchants, secure payments, and elegant commerce experiences in one destination designed for daily life.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton>Explore products</PrimaryButton>
              <a href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                Contact us
              </a>
            </div>
          </div>
        </div>
      </section>

      <ResponsiveSection eyebrow="What drives us" title="A platform shaped by trust, inclusion, and everyday convenience" description="We design every touchpoint to feel calm, clear, and dependable for shoppers, merchants, and delivery teams.">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{item.description}</p>
            </div>
          ))}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default AboutPage
