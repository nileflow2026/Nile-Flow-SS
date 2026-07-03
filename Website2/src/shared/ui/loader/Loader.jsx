function Loader({ label = 'Loading Nile Flow…' }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-[var(--color-primary)]/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--color-primary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
      </div>
    </div>
  )
}

export default Loader
