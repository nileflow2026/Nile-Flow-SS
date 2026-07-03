import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'

const points = [
  {
    title: 'Your data stays protected',
    description: 'We use secure defaults, limited retention, and careful access controls for every account touchpoint.',
  },
  {
    title: 'You stay in control',
    description: 'You can review your preferences, update account details, and ask for data support whenever you need it.',
  },
  {
    title: 'We keep it transparent',
    description: 'We explain what we collect, why we collect it, and how it helps create a smoother shopping journey.',
  },
]

function PrivacyPage() {
  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)] sm:p-10 lg:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Privacy</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Your privacy matters as much as your checkout experience.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-text-secondary)]">
            Nile Flow uses your information to create a safer, more personal shopping experience while keeping your choices and account data protected.
          </p>
        </div>
      </section>

      <ResponsiveSection eyebrow="What we protect" title="A privacy-first commerce experience" description="We keep our practices straightforward and easy to understand, so it is clear how your data is used and protected.">
        <div className="grid gap-4 md:grid-cols-3">
          {points.map((item) => (
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

export default PrivacyPage
