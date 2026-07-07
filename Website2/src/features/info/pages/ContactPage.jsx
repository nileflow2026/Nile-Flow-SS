import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { useToast } from '@shared/ui/toast/ToastProvider'

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const { push } = useToast()

  const handleSubmit = (event) => {
    event.preventDefault()
    push({ title: 'Thanks for reaching out', message: 'We will reply shortly with the next best step.' })
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <PageShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Contact Nile Flow</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
              We’re here when you need support, partnerships, or product help.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--color-text-secondary)]">
              Reach out for order questions, merchant support, press enquiries, or general product guidance.
            </p>
            <div className="mt-8 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <p>hello@nileflow.com</p>
              <p>+254 700 000 000</p>
              <p>Nairobi, Kenya</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)] sm:p-10">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Name
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-primary)]" placeholder="Your name" required />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Email
                <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-primary)]" placeholder="you@example.com" required />
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                How can we help?
                <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows="5" className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none ring-0 focus:border-[var(--color-primary)]" placeholder="Share what you need" required />
              </label>
              <PrimaryButton className="w-full justify-center">Send message</PrimaryButton>
            </form>
          </div>
        </div>
      </section>

      <ResponsiveSection eyebrow="Quick answers" title="Most common questions" description="Support, delivery, and merchant inquiries are handled through the same fast, human-friendly workflow.">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Orders</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">Track progress or ask for shipping help in a few taps.</p>
          </div>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Merchant support</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">We can help onboard, verify, or optimize your storefront.</p>
          </div>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Partnerships</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">Share your brand idea and we will help shape the next step.</p>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ContactPage
