import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import { SeoHead } from '@shared/seo/SeoHead'

const openPositions = [
  { title: 'Senior React Engineer', location: 'Nairobi, Kenya', type: 'Full-time', description: 'Build the next generation of our e-commerce platform with React and modern web technologies.' },
  { title: 'Product Designer', location: 'Nairobi, Kenya', type: 'Full-time', description: 'Design intuitive, delightful experiences for millions of shoppers across Africa.' },
  { title: 'Logistics Coordinator', location: 'Mombasa, Kenya', type: 'Full-time', description: 'Manage delivery operations and optimize our last-mile logistics network.' },
  { title: 'Customer Experience Lead', location: 'Remote', type: 'Full-time', description: 'Drive customer satisfaction and build systems that delight our users.' },
]

const culture = [
  { title: 'Remote-first', description: 'Work from anywhere in East Africa. We trust our team to deliver.' },
  { title: 'Growth mindset', description: 'Learning stipends, mentorship, and clear career progression paths.' },
  { title: 'Diverse team', description: '10+ nationalities building for a continent of 1.4 billion people.' },
  { title: 'Impact-driven', description: 'Every feature ships to millions — your work matters.' },
]

function CareersPage() {
  return (
    <PageShell>
      <SeoHead
        title="Careers at Nile Flow"
        description="Join the Nile Flow team and help build the digital commerce backbone for Africa. View open positions and learn about our culture."
        keywords={['careers', 'jobs', 'hiring', 'Nile Flow careers', 'tech jobs Africa']}
      />
      <section className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 px-4 py-14 text-center sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Careers</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Join the Nile Flow team</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">
          We're building the digital commerce backbone for Africa. Come shape the future with us.
        </p>
        <PrimaryButton className="mt-6">View open positions</PrimaryButton>
      </section>

      <ResponsiveSection eyebrow="Open positions" title="Join our team" description="We're looking for passionate people to help us transform African commerce." className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {openPositions.map((job, i) => (
            <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{job.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="neutral">{job.location}</Badge>
                    <Badge variant="primary">{job.type}</Badge>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{job.description}</p>
              <button className="mt-4 min-h-11 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]">
                Apply now
              </button>
            </div>
          ))}
        </div>
      </ResponsiveSection>

      <div className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Culture</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">How we work</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {culture.map((item, i) => (
              <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] text-center">
                <p className="font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export default CareersPage
