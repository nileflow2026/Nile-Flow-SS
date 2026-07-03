import PageShell from '@shared/ui/layout/PageShell'

const sections = [
  { title: 'Introduction', content: 'Welcome to Nile Flow. By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.' },
  { title: 'Account Terms', content: 'You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to create an account. You agree to provide accurate and complete information.' },
  { title: 'Payment Terms', content: 'All prices are listed in Kenyan Shillings (KES) unless otherwise stated. Payments are processed securely through third-party providers. Orders are confirmed only after payment is verified.' },
  { title: 'Shipping & Delivery', content: 'Delivery times are estimates and not guaranteed. Nile Flow partners with logistics providers to fulfill orders. You are responsible for providing accurate delivery addresses.' },
  { title: 'Returns & Refunds', content: 'Items may be returned within 14 days of delivery if unused and in original packaging. Refunds are processed within 5–7 business days after we receive returned items.' },
  { title: 'Limitation of Liability', content: 'Nile Flow shall not be liable for indirect, incidental, or consequential damages arising from the use of our platform, including but not limited to delivery delays or product availability.' },
  { title: 'Governing Law', content: 'These terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved through arbitration in Nairobi, Kenya.' },
  { title: 'Changes to Terms', content: 'We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.' },
]

function TermsPage() {
  return (
    <PageShell>
      <section className="bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-accent)]/5 px-4 py-14 text-center sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Legal</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Terms of Service</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">
          These terms govern your use of the Nile Flow platform. Please read them carefully.
        </p>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{section.content}</p>
            </div>
          ))}
        </div>

        <hr className="my-10 border-[var(--color-border)]" />
        <p className="text-center text-xs text-[var(--color-text-muted)]">Last updated: 1 July 2024 · Version 2.0</p>
      </div>
    </PageShell>
  )
}

export default TermsPage
