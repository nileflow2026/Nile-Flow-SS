import { useEffect, useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { SeoHead } from '@shared/seo/SeoHead'
import { createAboutPageSchema } from '@shared/seo/SchemaFactory'
import { teamMemberService } from '@api/services'

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

function TeamMemberCard({ member }) {
  const [imageFailed, setImageFailed] = useState(false)
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 shadow-[var(--shadow-sm)] sm:p-5 lg:p-6">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-emerald-100">
        {!imageFailed && member.image ? (
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-700 sm:text-4xl">
            {initials}
          </div>
        )}
      </div>
      <h3 className="mt-3 break-words text-sm font-semibold leading-tight text-[var(--color-text-primary)] sm:mt-4 sm:text-lg">{member.name}</h3>
      <p className="mt-1 break-words text-xs font-medium leading-tight text-emerald-600 sm:text-sm">{member.role}</p>
      <p className="mt-2 line-clamp-4 break-words text-xs leading-5 text-[var(--color-text-secondary)] sm:mt-3 sm:text-sm sm:leading-7">{member.bio}</p>
      <div className="mt-3 space-y-1 text-[11px] leading-4 text-[var(--color-text-secondary)] sm:mt-4 sm:space-y-2 sm:text-sm">
        {member.email && <p className="break-all"><span className="font-medium text-[var(--color-text-primary)]">Email:</span> {member.email}</p>}
        {member.phone && <p className="break-words"><span className="font-medium text-[var(--color-text-primary)]">Phone:</span> {member.phone}</p>}
      </div>
      {member.socials?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
        {member.socials.map((social) => (
          <a
            key={`${social.label}-${social.href}`}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="max-w-full truncate rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)] transition hover:border-emerald-600 hover:text-emerald-600 sm:px-3 sm:text-xs"
          >
            {social.label}
          </a>
        ))}
      </div>}
    </article>
  )
}

function AboutPage() {
  const [teamMembers, setTeamMembers] = useState([])
  const [teamLoading, setTeamLoading] = useState(true)

  useEffect(() => {
    let active = true
    teamMemberService.getTeamMembers()
      .then((members) => {
        if (active) setTeamMembers(members)
      })
      .catch(() => {
        if (active) setTeamMembers([])
      })
      .finally(() => {
        if (active) setTeamLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <PageShell>
      <SeoHead
        title="About Nile Flow"
        description="Learn about Nile Flow, our mission, team, and values. We are building a more confident way to discover and buy across Africa."
        keywords={['about', 'company', 'mission', 'team', 'African commerce']}
        schema={createAboutPageSchema(teamMembers)}
      />
      <section className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-lg)] sm:p-10 lg:p-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">About Nile Flow</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              We are building a more confident way to discover and buy across Africa.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">
              Nile Flow is an AI-powered hyperlocal commerce ecosystem designed for emerging markets. We bring together trusted merchants, secure payments, and elegant shopping experiences in one destination built for everyday life, low-bandwidth environments, and real economic growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton>Explore products</PrimaryButton>
              <a href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-emerald-600 hover:text-emerald-600">
                Contact us
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Our mission</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
                A platform shaped by trust, inclusion, and everyday convenience.
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--color-text-secondary)]">
                We design every touchpoint to feel calm, clear, and dependable for shoppers, merchants, and delivery teams. Our ecosystem combines commerce, AI, fintech, and loyalty into a seamless experience that supports growth across communities and cities.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">What we focus on</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                <li>• Secure, mobile-first shopping journeys</li>
                <li>• Local merchant enablement and logistics support</li>
                <li>• Reliable payments, loyalty, and retention tools</li>
                <li>• A trustworthy experience for emerging-market users</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pillars.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-lg">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Leadership team</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
                Meet the people building Nile Flow.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
              Our leadership and operations team are focused on building dependable infrastructure, customer trust, and long-term growth across the region.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {teamLoading && <p className="col-span-full text-sm text-[var(--color-text-secondary)]">Loading leadership team...</p>}
            {!teamLoading && teamMembers.length === 0 && <p className="col-span-full text-sm text-[var(--color-text-secondary)]">Leadership information is currently unavailable.</p>}
            {!teamLoading && teamMembers.map((member) => <TeamMemberCard key={member.id || member.name} member={member} />)}
          </div>
        </div>
      </section>
    </PageShell>
  )
}

export default AboutPage
