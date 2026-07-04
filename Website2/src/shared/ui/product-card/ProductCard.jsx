import { Link } from 'react-router-dom'
import Badge from '../badge/Badge'

function ProductCard({ product, href = '#', compact = false }) {
  // Normalize backend product shape ($id, productName, price, image, images)
  // and mock/demo shape (id, title, name, price, image)
  const id = product?.$id || product?.id
  const title = product?.productName || product?.title || product?.name || 'Nile Flow product'
  const imageUrl = product?.image || product?.imageUrl || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'

  // Price handling: string display or numeric
  const rawPrice = product?.price
  const displayPrice = product?.displayPrice
  const priceStr = displayPrice || (typeof rawPrice === 'number' ? `KSh ${rawPrice.toLocaleString()}` : rawPrice) || 'KSh —'

  const description = product?.description || product?.subtitle || ''
  const premium = Boolean(product?.premiumEligible || product?.premium || product?.isPremium)
  const featured = Boolean(product?.featured || product?.isFeatured)
  const stock = product?.stock !== undefined ? product.stock : null
  const outOfStock = stock === 0

  const linkHref = href !== '#' ? href : `/products/${id}`

  return (
    <Link
      to={linkHref}
      className={`group block overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] ${outOfStock ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {(premium || featured || outOfStock) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {outOfStock && <Badge variant="danger">Out of stock</Badge>}
            {premium && !outOfStock && <Badge variant="warning">Premium</Badge>}
            {featured && !outOfStock && <Badge variant="success">Featured</Badge>}
          </div>
        )}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">Nile Flow</p>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] line-clamp-2">{title}</h3>
          {description && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{description}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[var(--color-accent)]">{priceStr}</p>
            {!compact && stock !== null && (
              <p className="text-xs text-[var(--color-text-muted)]">{stock > 0 ? `${stock} in stock` : 'Out of stock'}</p>
            )}
            {!compact && stock === null && (
              <p className="text-xs text-[var(--color-text-secondary)]">Fast delivery • Trusted pickup</p>
            )}
          </div>
          <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">View</span>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
