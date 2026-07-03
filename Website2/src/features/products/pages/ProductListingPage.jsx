import { Link } from 'react-router-dom'
import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import ProductCard from '@shared/ui/product-card/ProductCard'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { useToast } from '@shared/ui/toast/ToastProvider'

const products = [
  { id: 1, title: 'Nile Premium Coffee', subtitle: 'Single-origin Ethiopian coffee with notes of jasmine and dark chocolate.', price: 'KES 1,200', premium: true, featured: true },
  { id: 2, title: 'Handwoven Basket Set', subtitle: 'Set of 3 artisan baskets handcrafted in rural Kenya.', price: 'KES 2,400' },
  { id: 3, title: 'Organic Shea Butter', subtitle: 'Pure, unrefined shea butter sourced from women cooperatives.', price: 'KES 850', premium: true },
  { id: 4, title: 'Maasai Beaded Bracelet', subtitle: 'Hand-beaded bracelet by Maasai artisans in the Rift Valley.', price: 'KES 450' },
  { id: 5, title: 'Kenyan Honey 500g', subtitle: 'Wild forest honey harvested from sustainable apiaries.', price: 'KES 800' },
  { id: 6, title: 'Ethiopian Yirgacheffe', subtitle: 'Light roast coffee with bright citrus and floral notes.', price: 'KES 1,800', premium: true },
]

function ProductListingPage() {
  const [showEmpty, setShowEmpty] = useState(false)
  const { push } = useToast()

  const handleAddToCart = () => {
    push({ title: 'Added to cart', message: 'Your selection is ready for checkout.' })
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Shop" title="Discover curated products" description="Browse our handpicked collection of authentic African products." className="py-10 sm:py-14 lg:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">{products.length} products</p>
          <div className="flex flex-wrap gap-2">
            {['All', 'Coffee', 'Home', 'Beauty', 'Accessories'].map((cat) => (
              <button key={cat} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                cat === 'All' ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}>{cat}</button>
            ))}
          </div>
        </div>

        {showEmpty ? (
          <EmptyState
            title="No products match your filter"
            description="Try adjusting your category selection to see more products."
            action={<PrimaryButton className="justify-center" onClick={() => setShowEmpty(false)}>Reset filters</PrimaryButton>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} href={`/products/${product.id}`} />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Can't find what you're looking for?</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Try searching our full catalog or browse by category.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/search"><Button variant="outline">Search</Button></Link>
            <PrimaryButton onClick={handleAddToCart}>Quick add</PrimaryButton>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProductListingPage
