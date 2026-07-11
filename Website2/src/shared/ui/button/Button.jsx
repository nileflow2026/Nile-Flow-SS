import { tokens } from '@shared/theme/tokens'

const variants = {
  primary: {
    base: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus-visible:ring-[var(--color-primary)]',
  },
  secondary: {
    base: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:bg-[#FDE68A] focus-visible:ring-[var(--color-accent)]',
  },
  outline: {
    base: 'border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  },
  ghost: {
    base: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]',
  },
}

function Button({ children, variant = 'primary', className = '', disabled = false, loading = false, ...props }) {
  const variantClass = variants[variant] ?? variants.primary

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass.base} ${className}`.trim()}
      disabled={disabled || loading}
      style={{
        fontFamily: tokens.typography.fontFamily,
        borderRadius: tokens.radius['2xl'],
      }}
      {...props}
    >
      {loading ? 'Loading…' : children}
    </button>
  )
}

export default Button
