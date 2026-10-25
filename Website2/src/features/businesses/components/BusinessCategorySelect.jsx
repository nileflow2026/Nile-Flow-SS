function BusinessCategorySelect({ value, categories, onChange, disabled = false }) {
  return (
    <label className="flex min-h-12 w-full flex-col gap-2 text-sm font-semibold text-[var(--color-text-primary)] sm:w-72">
      <span>Filter by category</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-base text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]"
      >
        <option value="All">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
    </label>
  )
}

export default BusinessCategorySelect
