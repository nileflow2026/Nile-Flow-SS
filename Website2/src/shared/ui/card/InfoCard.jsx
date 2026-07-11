function InfoCard({ title, description, badge, action, children }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-6 lg:p-7 dark:border-gray-800 dark:bg-gray-900">
      {badge ? (
        <span className="mb-4 inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {badge}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description ? <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-400">{description}</p> : null}
      {children ? <div className="mt-5 flex-1">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </article>
  )
}

export default InfoCard
