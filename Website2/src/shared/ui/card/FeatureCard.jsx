function FeatureCard({ title, description }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-400">{description}</p>
    </article>
  )
}

export default FeatureCard
