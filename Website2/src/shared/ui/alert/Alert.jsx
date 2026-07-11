function Alert({ title, description, tone = 'info', children }) {
  const tones = {
    info: 'border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone] ?? tones.info}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export default Alert
