import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Badge from '@shared/ui/badge/Badge'

function ProductDetailPage() {
  return (
    <PageShell>
      <ResponsiveSection eyebrow="Product" title="Product details" description="View complete product information, pricing, and availability." className="py-10 sm:py-14 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="aspect-[4/3] rounded-[1.5rem] bg-[var(--color-surface-muted)]" />
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="success">In stock</Badge>
              <Badge variant="neutral">Free delivery</Badge>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Nile Flow Essentials</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl">Premium coffee bundle</h1>
            <p className="mt-2 text-3xl font-bold text-[var(--color-accent)]">KES 1,250</p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">
              Freshly roasted single-origin coffee sourced directly from Ethiopian highlands. Notes of jasmine, stone fruit, and dark chocolate.
            </p>
            <div className="mt-6 space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2"><span>Origin</span><span className="font-semibold text-[var(--color-text-primary)]">Ethiopia</span></div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2"><span>Roast</span><span className="font-semibold text-[var(--color-text-primary)]">Medium</span></div>
              <div className="flex justify-between"><span>Weight</span><span className="font-semibold text-[var(--color-text-primary)]">500g</span></div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton className="w-full justify-center sm:w-auto sm:flex-1">Add to cart — KES 1,250</PrimaryButton>
              <Button variant="outline" className="w-full justify-center sm:w-auto">Save</Button>
            </div>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProductDetailPage
