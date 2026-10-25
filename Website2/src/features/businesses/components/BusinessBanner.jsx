import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { imageProxyUrl } from '@api/config'
import { BUSINESS_IMAGE_FALLBACK } from '../data/businesses'

function BusinessBanner({ business }) {
  return (
    <Link
      to={`/businesses/${business.id}`}
      className="group relative block overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-4"
    >
      <div className="relative overflow-hidden bg-[var(--color-surface-muted)]">
        <img
          src={business.coverImagePath.startsWith('/')
            ? business.coverImagePath
            : imageProxyUrl(business.coverImagePath)}
          alt={business.coverImageAlt}
          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied) return
            event.currentTarget.dataset.fallbackApplied = 'true'
            event.currentTarget.src = BUSINESS_IMAGE_FALLBACK
          }}
        />
        <span
          aria-hidden="true"
          className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-[var(--shadow-sm)] sm:left-4 sm:top-4"
        >
          Active business
        </span>
      </div>
      <span className="block space-y-2 p-4 sm:p-5">
        {business.category && (
          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            {business.category}
          </span>
        )}
        <span className="flex items-start justify-between gap-3">
          <span className="text-lg font-bold text-[var(--color-text-primary)] sm:text-xl">
            {business.name}
          </span>
          <ArrowUpRight
            aria-hidden="true"
            className="mt-1 shrink-0 text-emerald-700 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            size={19}
          />
        </span>
        {business.location && (
          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">
            {business.location}
          </span>
        )}
        {business.description && (
          <span className="line-clamp-2 block text-sm leading-6 text-[var(--color-text-secondary)]">
            {business.description}
          </span>
        )}
        <span className="block pt-1 text-sm font-semibold text-emerald-700">
          Visit business
        </span>
      </span>
    </Link>
  )
}

export default BusinessBanner
