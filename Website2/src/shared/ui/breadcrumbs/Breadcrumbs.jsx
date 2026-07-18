import { Link } from 'react-router-dom'

/**
 * Breadcrumbs — visible navigation component for product detail and category pages.
 * Schema.org structured data for breadcrumbs is already injected via SeoHead.
 * This component provides the visual UI.
 *
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Category Name', href: '/category/slug' },
 *     { label: 'Current Page' },  // no href = last item (current page)
 *   ]} />
 */
function Breadcrumbs({ items = [], className = '' }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={`mb-4 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
        <li>
          <Link to="/" className="transition hover:text-emerald-600" aria-label="Home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.label + index} className="flex items-center gap-1.5">
              <span className="text-[var(--color-text-muted)]">/</span>
              {isLast || !item.href ? (
                <span
                  className={isLast ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="transition hover:text-emerald-600">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
