function InfoCard({ title, description, badge, action, children }) {
  return (
    <article className="flex h-full flex-col rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-7">
      {badge ? (
        <span className="mb-4 inline-flex w-fit rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">
          {badge}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-gray-950">{title}</h3>
      {description ? <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p> : null}
      {children ? <div className="mt-5 flex-1">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </article>
  )
}

export default InfoCard
