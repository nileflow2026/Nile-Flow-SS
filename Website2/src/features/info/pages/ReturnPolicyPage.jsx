import PageShell from '@shared/ui/layout/PageShell'

const sections = [
  {
    title: '1. Introduction',
    content:
      'At Nile Flow, customer trust is fundamental to our mission. This Refund & Return Policy explains the conditions under which products and services purchased through the Nile Flow platform may be returned, exchanged, refunded, or otherwise resolved. This Policy applies to all transactions conducted across the Nile Flow mobile applications, official website, integrated merchant marketplace, vendor operations portal, and future Nile Pay ecosystem transactions where applicable.',
  },
  {
    title: '2. Marketplace Disclosure',
    content:
      'Nile Flow operates a technology marketplace connecting retail customers and enterprise merchants. Products sold through the platform may be supplied, fulfilled, and shipped by verified independent merchants. As a result, return eligibility windows and parameters may vary depending on the product category. Certain merchant-specific conditions may apply as disclosed at point-of-sale. Nile Flow reserves the final authority to make determinations regarding cross-party disputes. Where independent merchant policies conflict with this document, Nile Flow may apply the policy that provides the greater level of consumer protection required by applicable regulations.',
  },
  {
    title: '3. Eligible Return Period',
    content:
      'Unless explicitly stated otherwise on the product detail interface at the time of purchase, customers must submit a formal return request within seven (7) calendar days following confirmed delivery status. For certain high-value, corporate, or infrastructure-related categories, extended return periods may be offered and displayed during checkout.',
  },
  {
    title: '4. Conditions for Returns',
    content:
      'To qualify for a return approval, products must generally be completely unused and un-worn, unaltered, kept in original retail condition, enclosed in original packaging, accompanied by tags, labels, manuals, and verified with authentic proof of purchase. Nile Flow reserves the right to perform physical or digital inspection before issuing formal authorization for refunds.',
  },
  {
    title: '5. Eligible for Return',
    content:
      'Eligible items include defective products, damaged products, incorrect products, and products missing components or accessories.',
  },
  {
    title: '6. Non-Returnable Items',
    content:
      'Unless required by regional legislation, non-returnable items include perishable goods, opened personal care items, digital artifacts such as app licenses or gift cards, customized or made-to-order goods, and final sale items.',
  },
  {
    title: '7. Damaged or Defective Items',
    content:
      'If a product arrives damaged or defective, the customer should report the issue within forty-eight (48) hours of confirmed receipt, provide high-resolution photographs or video evidence, and retain all packaging layers for inspection. Nile Flow will then coordinate a resolution including replacement, repair, store credit, or refund depending on severity.',
  },
  {
    title: '8. Incorrect Items',
    content:
      'If an incorrect item is dispatched, Nile Flow will coordinate reverse logistics and collection where possible. The option between replacement dispatch or full refund will be provided, and auxiliary logistical costs associated with the resolution will not be borne by the customer.',
  },
  {
    title: '9. Return Request Process',
    content:
      'Customers can initiate returns through Orders → Order Details → Request Return. They must select the relevant reason, upload any required proof media, and submit the claim for review and merchant notification.',
  },
  {
    title: '10. Return Approval',
    content:
      'Every submission undergoes algorithmic and human review for eligibility, fraud prevention, original product matching, merchant verification, and delivery history. Nile Flow maintains final authority over approval execution.',
  },
  {
    title: '11. Refund Methods',
    content:
      'Approved refunds may be issued through the original payment method, Nile Flow Wallet or Nile Pay Wallet, or alternative channels as evaluated by Nile Flow.',
  },
  {
    title: '12. Refund Processing Times',
    content:
      'Processing times vary by channel. Nile Flow Wallet or Nile Pay Wallet credits typically process within 1–3 business days, mobile money within 3–7 business days, direct bank transfers within 5–10 business days, international cards within 5–15 business days, and PayPal or other global gateways subject to external settlement timelines.',
  },
  {
    title: '13. Partial Refunds',
    content:
      'Partial refunds may be approved where products are received with minor user-inflicted damage, missing components, signs of active deployment, or where only part of a multi-item package is returned.',
  },
  {
    title: '14. Shipping Costs',
    content:
      'Customer-initiated returns due to preference changes are generally at the customer’s cost. Where the return is due to merchant mismatch, damage, or delivery failure, Nile Flow or the relevant vendor will absorb the logistics cost.',
  },
  {
    title: '15. Failed Deliveries',
    content:
      'Orders that fail delivery due to customer absence, incorrect address details, or unauthorized refusal may be cancelled and may incur standard reverse-processing fees deducted from the final account balance.',
  },
  {
    title: '16. Fraud Prevention',
    content:
      'Nile Flow uses automated fraud analysis systems. Return privileges may be denied and accounts suspended where manipulated evidence, falsified tracking data, deliberate abuse, or exploitation is detected.',
  },
  {
    title: '17. Disputed Transactions',
    content:
      'Disputes involving users, delivery operators, or marketplace sellers are handled through Nile Flow’s internal dispute mechanism, with fair outcomes consistent with applicable regional regulations.',
  },
  {
    title: '18. Promotional Frameworks and Future Fintech Pipelines',
    content:
      'Items claimed through Nile Miles rewards, corporate loyalty systems, or promotional campaigns may be subject to alternative policy terms. As Nile Pay scales, additional specialized payment reversal protocols may be introduced.',
  },
  {
    title: '19. Consumer Rights and Policy Adjustments',
    content:
      'Nothing in this Policy limits statutory consumer rights. Where local legal protections exceed these guidelines, local law governs. Nile Flow may adjust this framework and will communicate material changes through the app, website, or email.',
  },
  {
    title: '20. Contact Information',
    content:
      'For support, escalation, or regulatory inquiries, contact Nile Flow Store Limited at support@nileflowafrica.com, legal@nileflowafrica.com, or +254 713 637 104. Registered office: Riara University Campus, Nairobi, Republic of Kenya.',
  },
]

function ReturnPolicyPage() {
  return (
    <PageShell>
      <section className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24 dark:from-emerald-950/20 dark:to-amber-950/20">
        <div className="responsive-shell rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-lg)] sm:p-10 lg:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Return policy</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            We make refunds and returns feel straightforward, not frustrating.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-text-secondary)]">
            If your order arrives damaged, incorrect, or not as expected, we will help you resolve it quickly and clearly.
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

export default ReturnPolicyPage
