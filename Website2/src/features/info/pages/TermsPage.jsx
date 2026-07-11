import PageShell from '@shared/ui/layout/PageShell'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content:
      'Welcome to Nile Flow. These Terms of Service ("Terms") govern your access to and use of all products, services, applications, websites, platforms, software, and technologies operated by Nile Flow Store Limited ("Nile Flow", "Company", "we", "us", or "our"). By accessing or using our Services, you agree to be bound by these Terms in their entirety, our Privacy Policy, and all applicable sub-policies incorporated by reference. If you do not agree, you must cease all use of the Services.',
  },
  {
    title: '2. Definitions',
    content:
      'For clarity, "Account" means a registered user profile; "Customer" means any person purchasing goods or services through the Nile Flow ecosystem; "Merchant" means any supplier or service provider offering products through Nile Flow; "User" means any person or automated program accessing the Services; "Services" means all current and future software, mobile applications, marketplace platforms, AI tools, payment rails, and loyalty systems operated by the Company; "Nile Miles" means the loyalty program; and "Nile Pay" means the fintech layer and payment infrastructure offered by Nile Flow.',
  },
  {
    title: '3. Eligibility',
    content:
      'To access or use the Services, you must be at least 18 years old or of legal majority in your jurisdiction, provide accurate onboarding information, and protect your account credentials and authentication systems. Nile Flow may refuse, suspend, or terminate access at its discretion.',
  },
  {
    title: '4. Account Registration',
    content:
      'Certain features require a verified Account. You agree to provide accurate, current, and complete information, keep credentials updated, notify us immediately of any suspected breach, and remain solely responsible for all actions taken through your account.',
  },
  {
    title: '5. Marketplace Services',
    content:
      'Nile Flow operates a marketplace that connects customers, merchants, logistics partners, and service providers. Unless otherwise agreed in writing, Nile Flow is not the manufacturer or ultimate seller of third-party products and assumes no liability for merchant statements, descriptions, or compliance representations. Nile Flow may remove items, merchants, or categories at any time.',
  },
  {
    title: '6. Orders',
    content:
      'Orders are subject to real-time availability, payment authorization, anti-fraud screening, and compliance checks. Nile Flow may reject, cancel, place on hold, or adjust orders, and may limit purchase quantities or request additional verification before release.',
  },
  {
    title: '7. Pricing',
    content:
      'Prices are dynamic and may vary based on taxes, delivery charges, service fees, and currency conversion adjustments. Nile Flow may correct pricing errors, recalculate invoices, or void affected transactions.',
  },
  {
    title: '8. Payments',
    content:
      'Payment transactions may be processed via PayPal, Stripe, NIPS, banking networks, or Nile Pay. By providing payment details, you authorize Nile Flow and its payment intermediaries to process charges. Nile Flow does not guarantee uninterrupted payment gateway availability.',
  },
  {
    title: '9. Refunds and Returns',
    content:
      'Returns and refunds are governed by market regulations, merchant policies, and Nile Flow internal assessment frameworks. Eligibility depends on product condition, timing, verification, and fraud checks. Certain customized, consumable, or digital items may be non-refundable.',
  },
  {
    title: '10. Delivery Services',
    content:
      'Delivery times are estimates only and may be affected by merchant preparation times, weather, traffic, blockages, and force majeure events. Nile Flow disclaims liability for losses caused by delays.',
  },
  {
    title: '11. Nile Miles Loyalty Program',
    content:
      'Users earn benefits through the Nile Miles system. Nile Flow may alter earning rates, point values, reward eligibility, or suspend rewards for suspected abuse or fraud. Nile Miles have no external cash value and cannot be transferred outside the official Nile Flow network.',
  },
  {
    title: '12. AI Services',
    content:
      'Nile Flow uses AI and machine learning tools to support discovery, commerce, and assistance. AI outputs are probabilistic and may be inaccurate. Users must independently verify important information before acting, and AI outputs are not legal, financial, medical, or professional advice.',
  },
  {
    title: '13. Future Nile Pay Services',
    content:
      'As Nile Pay and related financial services expand, users may be required to accept additional terms and complete identity verification, KYC, and AML checks before access.',
  },
  {
    title: '14. Prohibited Activities',
    content:
      'You may not engage in fraud, identity theft, system circumvention, malware distribution, referral or reward abuse, intellectual property infringement, or financial crime, including money laundering or terrorism financing.',
  },
  {
    title: '15. User Content',
    content:
      'By submitting reviews, images, feedback, or other content, you retain ownership but grant Nile Flow a worldwide, irrevocable, royalty-free, sublicensable license to use, host, reproduce, modify, distribute, and display that content to operate and promote the platform.',
  },
  {
    title: '16. Intellectual Property',
    content:
      'All proprietary source code, interfaces, branding, data models, and digital assets related to Nile Flow, Nile Pay, Nile Miles, and Nile Learn are owned by Nile Flow Store Limited. No ownership rights are transferred to users or merchants by these Terms.',
  },
  {
    title: '17. Third-Party Services',
    content:
      'Nile Flow may integrate with third-party services, APIs, mapping tools, or financial networks. Nile Flow is not responsible for their performance, storage practices, or availability.',
  },
  {
    title: '18. Privacy',
    content:
      'Your personal data is handled according to our Privacy Policy. Continued use of the Services signifies your consent to our data processing practices.',
  },
  {
    title: '19. Service Availability',
    content:
      'The Services are provided on an “as available” basis. Nile Flow does not guarantee uninterrupted access, zero downtime, or flawless operation and may perform maintenance or discontinue features without liability.',
  },
  {
    title: '20. Disclaimer of Warranties',
    content:
      'To the maximum extent permitted by law, the Services are provided “as is” and “as available” without any express or implied warranties, including merchantability, fitness for a particular purpose, title, non-infringement, or uninterrupted performance.',
  },
  {
    title: '21. Limitation of Liability',
    content:
      'Nile Flow and its affiliates shall not be liable for indirect, consequential, special, punitive, or incidental damages, including lost profits, reputational harm, or data loss. Where applicable law limits exclusion of liability, Nile Flow’s aggregate liability shall not exceed the total amount you paid to Nile Flow in the 12 months preceding the claim.',
  },
  {
    title: '22. Indemnification',
    content:
      'You agree to defend, indemnify, and hold harmless Nile Flow and its personnel from claims, losses, damages, and legal costs arising from your use of the Services, your content, or your violation of these Terms or applicable law.',
  },
  {
    title: '23. Force Majeure',
    content:
      'Nile Flow is not liable for failure to perform due to events beyond its reasonable control, including natural disasters, war, civil unrest, internet outages, cyber incidents, governmental actions, or pandemics.',
  },
  {
    title: '24. Termination',
    content:
      'Nile Flow may suspend or terminate your Account or access immediately if it suspects a breach of these Terms, payment fraud, security risk, or legal requirement.',
  },
  {
    title: '25. Governing Law',
    content:
      'These Terms are governed by the laws of the Republic of Kenya.',
  },
  {
    title: '26. Dispute Resolution',
    content:
      'Disputes should first be submitted for good-faith negotiation with company leadership. If unresolved after 30 business days, they may be escalated to mediation, binding arbitration, or the competent courts of Kenya.',
  },
  {
    title: '27. Changes to Terms',
    content:
      'Nile Flow may update these Terms at any time. Material changes will be communicated via prominent placement, mobile alerts, or email, and continued use indicates acceptance of the updated Terms.',
  },
  {
    title: '28. Contact Information',
    content:
      'For support, legal questions, or privacy concerns, contact support@nileflowafrica.com, legal@nileflowafrica.com, privacy@nileflowafrica.com, or call +254 713 637 104. Our registered office is Riara University, Republic of Kenya.',
  },
]

function TermsPage() {
  return (
    <PageShell>
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
