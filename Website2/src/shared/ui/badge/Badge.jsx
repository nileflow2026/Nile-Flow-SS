const variants = {
  default: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  warning: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]',
}

function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${variants[variant] ?? variants.default} ${className}`.trim()}>
      {children}
    </span>
  )
}

export default Badge
