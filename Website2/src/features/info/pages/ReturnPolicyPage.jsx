import PageShell from '@shared/ui/layout/PageShell'
import { SeoHead } from '@shared/seo/SeoHead'

const sections = [
  { title: '1. Introduction', content: 'At Nile Flow, customer trust is fundamental to our mission. This Refund & Return Policy explains the conditions under which products and services purchased through the Nile Flow platform may be returned, exchanged, refunded, or otherwise resolved.' },
  { title: '2. Marketplace Disclosure', content: 'Nile Flow operates a technology marketplace connecting retail customers and enterprise merchants. Products sold through the platform may be supplied, fulfilled, and shipped by verified independent merchants.' },
  { title: '3. Eligible Return Period', content: 'Unless explicitly stated otherwise, customers must submit a formal return request within seven (7) calendar days following confirmed delivery status.' },
  { title: '4. Conditions for Returns', content: 'To qualify for a return approval, products must generally be completely unused, unaltered, kept in original retail condition, enclosed in original packaging, and verified with authentic proof of purchase.' },
  { title: '5. Eligible for Return', content: 'Eligible items include defective products, damaged products, incorrect products, and products missing components.' },
  { title: '6. Non-Returnable Items', content: 'Non-returnable items include perishable goods, opened personal care items, digital artifacts, customized or made-to-order goods, and final sale items.' },
  { title: '7. Damaged or Defective Items', content: 'If a product arrives damaged or defective, report within 48 hours with photographic evidence. Nile Flow will coordinate replacement, repair, store credit, or refund.' },
  { title: '8. Return Request Process', content: 'Customers can initiate returns through Orders, select the relevant reason, upload proof, and submit for review.' },
  { title: '9. Refund Methods', content: 'Approved refunds may be issued through the original payment method, Nile Flow Wallet, or alternative channels.' },
  { title: '10. Contact Information', content: 'For support, contact support@nileflowafrica.com or call +254 713 637 104. Registered office: Riara University Campus, Nairobi, Republic of Kenya.' },
]

function ReturnPolicyPage() {
  return (
    <PageShell>
      <SeoHead
        title="Return Policy"
        description="Nile Flow return and refund policy — learn how to return products, conditions for eligibility, and how refunds are processed."
        keywords={['returns', 'refunds', 'return policy', 'exchange', 'customer service']}
      />
      <section className="bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
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
