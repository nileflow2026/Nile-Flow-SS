function Loader({ label = 'Loading Nile Flow…' }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-600/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-600" />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
      </div>
    </div>
  )
}

export default Loader
