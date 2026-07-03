import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'

const categories = {
  beverages: { name: 'Beverages', desc: 'Premium coffees, teas, and traditional African drinks.', icon: '☕' },
  'home-living': { name: 'Home & Living', desc: 'Handwoven baskets, decor, and artisan home goods.', icon: '🧺' },
  beauty: { name: 'Beauty', desc: 'Natural shea butter, oils, and organic skincare products.', icon: '🧴' },
  accessories: { name: 'Accessories', desc: 'Beaded jewelry, bags, and handcrafted fashion.', icon: '📿' },
  groceries: { name: 'Groceries', desc: 'Honey, grains, spices, and pantry essentials.', icon: '🍯' },
}

const categoryProducts = {
  beverages: [
    { id: 1, name: 'Nile Premium Coffee', price: 'KES 1,200', rating: 4.8, orders: 340 },
    { id: 2, name: 'Ethiopian Yirgacheffe', price: 'KES 1,800', rating: 4.9, orders: 210 },
    { id: 3, name: 'Kenyan Purple Tea', price: 'KES 650', rating: 4.6, orders: 180 },
  ],
  'home-living': [
    { id: 4, name: 'Handwoven Basket Set', price: 'KES 2,400', rating: 4.7, orders: 150 },
    { id: 5, name: 'Kente Cloth Throw', price: 'KES 3,200', rating: 4.8, orders: 95 },
  ],
  beauty: [
    { id: 6, name: 'Organic Shea Butter', price: 'KES 850', rating: 4.9, orders: 420 },
    { id: 7, name: 'Baobab Oil Serum', price: 'KES 1,400', rating: 4.7, orders: 230 },
  ],
  accessories: [
    { id: 8, name: 'Maasai Beaded Bracelet', price: 'KES 450', rating: 4.5, orders: 560 },
    { id: 9, name: 'Mudcloth Tote Bag', price: 'KES 2,800', rating: 4.6, orders: 120 },
  ],
  groceries: [
    { id: 10, name: 'Kenyan Honey 500g', price: 'KES 800', rating: 4.8, orders: 290 },
    { id: 11, name: 'Mixed Spice Set', price: 'KES 600', rating: 4.4, orders: 170 },
  ],
}

function CategoryPage() {
  const { categorySlug } = useParams()
  const category = categories[categorySlug]
  const products = categoryProducts[categorySlug] || []

  if (!category) {
    return (
      <PageShell>
        <ResponsiveSection eyebrow="Category" title="Category not found" className="py-10 sm:py-14 lg:py-16">
          <EmptyState title="This category doesn't exist" description="The category you're looking for may have been renamed or removed." action={<Link to="/products"><PrimaryButton>Browse all products</PrimaryButton></Link>} />
        </ResponsiveSection>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-accent)]/5 px-4 py-14 text-center sm:px-6 sm:py-20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-3xl sm:h-20 sm:w-20">{category.icon}</div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">{category.name}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--color-text-secondary)]">{category.desc}</p>
      </div>

      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        {products.length === 0 ? (
          <EmptyState title="No products yet" description="This category is being stocked. Check back soon." icon="📦" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="group rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] sm:p-6">
                <p className="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">{p.name}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-lg font-bold text-[var(--color-accent)]">{p.price}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">★ {p.rating}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{p.orders} orders</p>
              </Link>
            ))}
          </div>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default CategoryPage
