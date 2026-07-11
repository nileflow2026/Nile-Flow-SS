import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'

const sections = [
  { title: '1. Introduction', content: 'Welcome to Nile Flow. This Privacy Policy explains how Nile Flow Store Limited collects, uses, processes, stores, protects, transfers, and discloses information when you use our services.' },
  { title: '2. Data Controller', content: 'For purposes of applicable data protection laws, the Data Controller is Nile Flow Store Limited. Contact: privacy@nileflowafrica.com.' },
  { title: '3. Definitions', content: 'Personal Data means any information that identifies or can reasonably identify an individual.' },
  { title: '4. Information We Collect', content: 'We collect information directly from users, automatically through technology, and from trusted third-party sources.' },
  { title: '5. How We Use Your Information', content: 'We may use collected information to create and manage accounts, process transactions, deliver products and services, provide customer support, improve user experience, and prevent fraud.' },
  { title: '6. Legal Basis for Processing', content: 'We process information based on contractual necessity, user consent where required, legal obligations, legitimate interests, and fraud prevention.' },
  { title: '7. Information Sharing', content: 'We may share information with service providers, payment providers, delivery partners, merchants, professional advisors, government authorities, or in connection with corporate transactions.' },
  { title: '8. Cookies and Tracking Technologies', content: 'We may use cookies, pixels, SDKs, analytics tools, and related technologies to authenticate users, improve performance, measure usage, and personalize experiences.' },
  { title: '9. AI, Automation & Recommendations', content: 'Nile Flow may use algorithms and artificial intelligence to recommend products, improve search results, detect fraud, personalize content, and improve customer experiences.' },
  { title: '10. Data Retention', content: 'We retain information only for as long as necessary. Typical retention periods include account records for the duration of the account plus legal requirements.' },
  { title: '11. Data Security', content: 'We implement safeguards including encryption, access controls, multi-factor authentication, monitoring systems, secure infrastructure, vulnerability management, and security audits.' },
  { title: '12. International Data Transfers', content: 'Your information may be processed in countries outside your country of residence. Where international transfers occur, we implement appropriate safeguards.' },
  { title: '13. User Rights', content: 'Subject to applicable laws, users may have rights to access, correct, delete, restrict, port, object, or withdraw consent.' },
  { title: '14. Account Deletion', content: 'Users may request account deletion through account settings, customer support, or privacy@nileflowafrica.com.' },
  { title: '15. Children\'s Privacy', content: 'Our Services are not intended for children under 18 unless permitted by applicable law and with appropriate parental or guardian consent.' },
  { title: '16. Data Breach Notification', content: 'If a security incident affects personal information, Nile Flow may notify affected users and relevant authorities where required by law.' },
  { title: '17. Future Nile Pay Services', content: 'When Nile Pay launches, additional information may be collected to comply with financial regulations and anti-money laundering requirements.' },
  { title: '18. Third-Party Links', content: 'Our Services may contain links to third-party websites or services. We are not responsible for the privacy practices of third parties.' },
  { title: '19. Changes to This Policy', content: 'We may update this Privacy Policy periodically. Material changes may be communicated through website notices or email communications.' },
  { title: '20. Contact Us', content: 'For privacy-related questions, requests, or complaints, contact Nile Flow Store Limited at privacy@nileflowafrica.com or +254 713 637 104.' },
]

function PrivacyPage() {
  return (
    <PageShell>
      <SeoHead
        title="Privacy Policy"
        description="Nile Flow Privacy Policy — how we collect, use, and protect your personal data in compliance with applicable data protection laws."
        keywords={['privacy', 'data protection', 'privacy policy', 'GDPR', 'African ecommerce']}
      />
      <section className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="responsive-shell rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-lg)] sm:p-10 lg:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Privacy</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Your privacy matters as much as your checkout experience.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-text-secondary)]">
            Nile Flow uses your information to create a safer, more personal shopping experience.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
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
      </section>
    </PageShell>
  )
}

export default PrivacyPage
