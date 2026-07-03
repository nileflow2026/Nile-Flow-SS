import { Link } from 'react-router-dom'
import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import ProductCard from '@shared/ui/product-card/ProductCard'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { useToast } from '@shared/ui/toast/ToastProvider'

const products = [
  {
    title: 'Featured home starter',
    subtitle: 'A premium commerce card with adaptable spacing and clear calls to action for mobile and desktop.',
    price: 'KSh 2,400',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    premium: true,
    featured: true,
  },
  {
    title: 'Daily essentials bundle',
    subtitle: 'Supports quick browsing, flexible ordering, and dense content without wrapping awkwardly.',
    price: 'KSh 1,150',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Premium pick',
    subtitle: 'Designed for large screens with elegant stacking on smaller devices and a stronger conversion focus.',
    price: 'KSh 3,200',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    premium: true,
  },
]

function ProductListingPage() {
  const [showEmpty, setShowEmpty] = useState(false)
  const { push } = useToast()

  const handlePreviewToast = () => {
    push({ title: 'Added to basket', message: 'Your selection is ready for checkout.' })
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Products" title="Discover curated products" description="Build product discovery with a layout that scales naturally across viewport sizes and content density." className="py-10 sm:py-14 lg:py-16">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-4 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-8">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Responsive catalog experience</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Flexible filters, cards, and supporting copy all align cleanly on every viewport.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton className="w-full justify-center sm:w-auto" onClick={handlePreviewToast}>View collection</PrimaryButton>
            <button onClick={() => setShowEmpty((value) => !value)} className="flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              {showEmpty ? 'Hide empty state' : 'Show empty state'}
            </button>
            <Link to="/products/1" className="flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              Open detail
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Loader label="Loading curated products..." />
          {showEmpty ? (
            <EmptyState
              title="No products right now"
              description="This empty state pattern keeps the experience calm and helpful while content is being prepared or filtered out."
              action={<PrimaryButton className="justify-center">Refresh feed</PrimaryButton>}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.title} product={product} href="/products/1" />
              ))}
            </div>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProductListingPage
