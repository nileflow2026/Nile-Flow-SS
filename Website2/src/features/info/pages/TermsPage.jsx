import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'

const sections = [
  { title: '1. Acceptance of Terms', content: 'Welcome to Nile Flow. These Terms of Service govern your access to and use of all products, services, applications, websites, platforms, software, and technologies operated by Nile Flow Store Limited.' },
  { title: '2. Definitions', content: 'For clarity, Account means a registered user profile; Customer means any person purchasing goods or services through the Nile Flow ecosystem; Merchant means any supplier or service provider offering products through Nile Flow.' },
  { title: '3. Eligibility', content: 'To access or use the Services, you must be at least 18 years old or of legal majority in your jurisdiction, provide accurate onboarding information, and protect your account credentials.' },
  { title: '4. Account Registration', content: 'Certain features require a verified Account. You agree to provide accurate, current, and complete information.' },
  { title: '5. Marketplace Services', content: 'Nile Flow operates a marketplace that connects customers, merchants, logistics partners, and service providers.' },
  { title: '6. Orders', content: 'Orders are subject to real-time availability, payment authorization, anti-fraud screening, and compliance checks.' },
  { title: '7. Pricing', content: 'Prices are dynamic and may vary based on taxes, delivery charges, service fees, and currency conversion adjustments.' },
  { title: '8. Payments', content: 'Payment transactions may be processed via PayPal, Stripe, NIPS, banking networks, or Nile Pay.' },
  { title: '9. Refunds and Returns', content: 'Returns and refunds are governed by market regulations, merchant policies, and Nile Flow internal assessment frameworks.' },
  { title: '10. Delivery Services', content: 'Delivery times are estimates only and may be affected by merchant preparation times, weather, traffic, and force majeure events.' },
  { title: '11. Nile Miles Loyalty Program', content: 'Users earn benefits through the Nile Miles system. Nile Flow may alter earning rates, point values, reward eligibility, or suspend rewards for suspected abuse or fraud.' },
  { title: '12. AI Services', content: 'Nile Flow uses AI and machine learning tools to support discovery, commerce, and assistance. AI outputs are probabilistic and may be inaccurate.' },
  { title: '13. Prohibited Activities', content: 'You may not engage in fraud, identity theft, system circumvention, malware distribution, or intellectual property infringement.' },
  { title: '14. Intellectual Property', content: 'All proprietary source code, interfaces, branding, data models, and digital assets are owned by Nile Flow Store Limited.' },
  { title: '15. Limitation of Liability', content: 'Nile Flow and its affiliates shall not be liable for indirect, consequential, special, punitive, or incidental damages.' },
  { title: '16. Governing Law', content: 'These Terms are governed by the laws of the Republic of Kenya.' },
  { title: '17. Contact Information', content: 'For support, legal questions, or privacy concerns, contact support@nileflowafrica.com or call +254 713 637 104.' },
]

function TermsPage() {
  return (
    <PageShell>
      <SeoHead
        title="Terms of Service"
        description="Nile Flow Terms of Service — rules and guidelines for using our platform. Please read these terms carefully."
        keywords={['terms', 'legal', 'conditions', 'terms of service', 'African ecommerce']}
      />
      <section className="bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-accent)]/5 px-4 py-14 text-center sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Legal</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Terms of Service</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Please read these Terms of Service carefully before accessing or using the Nile Flow platform.
        </p>
      </section>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
        <hr className="my-10 border-[var(--color-border)]" />
        <p className="text-center text-xs text-[var(--color-text-muted)]">Last updated: 10 July 2026 · Version 2.1</p>
      </div>
    </PageShell>
  )
}

export default TermsPage
