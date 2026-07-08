function EmptyState({ title, description, action, icon = '✦' }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-gray-600 dark:text-gray-400">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

export default EmptyState
