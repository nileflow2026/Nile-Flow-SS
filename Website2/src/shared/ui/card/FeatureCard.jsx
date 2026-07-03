function FeatureCard({ title, description }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 shadow-[var(--shadow-sm)]">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>
    </article>
  )
}

export default FeatureCard
