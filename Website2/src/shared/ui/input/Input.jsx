function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(22,163,74,0.16)] ${className}`.trim()}
      {...props}
    />
  )
}

export default Input
