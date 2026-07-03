function ResponsiveSection({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`responsive-shell ${className}`.trim()}>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 text-center sm:text-left">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {description ? <p className="text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">{description}</p> : null}
      </div>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  )
}

export default ResponsiveSection
