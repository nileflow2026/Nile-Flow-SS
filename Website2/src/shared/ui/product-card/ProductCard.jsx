import { Link } from 'react-router-dom'
import Badge from '../badge/Badge'

function ProductCard({ product, href = '#', compact = false }) {
  const title = product?.title || product?.name || 'Nile Flow product'
  const image = product?.image || product?.imageUrl || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
  const price = product?.price || product?.displayPrice || 'KSh 1,200'
  const subtitle = product?.subtitle || product?.description || 'Trusted by local merchants'
  const premium = Boolean(product?.premium || product?.isPremium)
  const featured = Boolean(product?.featured || product?.isFeatured)

  return (
    <Link to={href} className="group block overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {premium && <Badge variant="warning">Premium</Badge>}
          {featured && <Badge variant="success">Featured</Badge>}
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">Nile Flow</p>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[var(--color-accent)]">{price}</p>
            {!compact && <p className="text-xs text-[var(--color-text-secondary)]">Fast delivery • Trusted pickup</p>}
          </div>
          <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">View</span>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
