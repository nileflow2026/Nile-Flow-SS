function EmptyState({ title, description, action, icon = '✦' }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]/70 p-8 text-center shadow-[var(--shadow-sm)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-2xl text-[var(--color-primary)]">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--color-text-secondary)]">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

export default EmptyState
