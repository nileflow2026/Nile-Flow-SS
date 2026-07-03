function Alert({ title, description, tone = 'info', children }) {
  const tones = {
    info: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]',
    success: 'border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
    warning: 'border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  }

  return (
    <div className={`rounded-[20px] border p-4 shadow-[var(--shadow-sm)] ${tones[tone] ?? tones.info}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export default Alert
