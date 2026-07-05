function StarRating({ rating = 0, count = 0, size = 16 }) {
  const numericRating = Number(rating) || 0
  const fullStars = Math.floor(numericRating)
  const fraction = numericRating - fullStars

  const stars = []

  for (let i = 0; i < 5; i++) {
    let fill
    if (i < fullStars) {
      fill = 'var(--color-warning, #f59e0b)'
    } else if (i === fullStars && fraction >= 0.25) {
      fill = fraction >= 0.75 ? 'var(--color-warning, #f59e0b)' : `url(#half-${i})`
    } else {
      fill = 'var(--color-border, #d1d5db)'
    }

    stars.push(
      <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={fill}>
        {fill === `url(#half-${i})` && (
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="var(--color-warning, #f59e0b)" />
              <stop offset="50%" stopColor="var(--color-border, #d1d5db)" />
            </linearGradient>
          </defs>
        )}
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>,
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-[1px]" aria-label={`${numericRating.toFixed(1)} out of 5 stars`}>
        {stars}
      </div>
      {count > 0 && (
        <span className="text-xs text-[var(--color-text-muted)]">({count})</span>
      )}
    </div>
  )
}

export default StarRating
