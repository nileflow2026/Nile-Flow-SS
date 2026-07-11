import StarRating from '../star-rating/StarRating'
import { imageProxyUrl } from '@api/config'

const DEFAULT_AVATAR = '/logo.png'

function getAvatarUrl(src) {
  if (!src) return DEFAULT_AVATAR
  if (typeof src === 'string' && src.includes('appwrite.io')) {
    return imageProxyUrl(src, 80, 60)
  }
  return src || DEFAULT_AVATAR
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function ReviewCard({ review }) {
  const userName = review?.userName || review?.username || 'Anonymous'
  const avatar = getAvatarUrl(review?.avatar || review?.avatarUrl)
  const rating = review?.rating || 0
  const text = review?.text || review?.reviewText || ''
  const date = formatDate(review?.date || review?.createdAt)
  const images = review?.images || (review?.image ? [review.image] : [])

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <img
          src={avatar}
          alt={userName}
          className="h-10 w-10 shrink-0 rounded-full object-cover bg-[var(--color-surface-muted)]"
          onError={(e) => { e.target.src = DEFAULT_AVATAR }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{userName}</p>
            {date && (
              <time className="shrink-0 text-xs text-[var(--color-text-muted)]">{date}</time>
            )}
          </div>
          <div className="mt-1">
            <StarRating rating={rating} size={14} />
          </div>
          {text && (
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{text}</p>
          )}
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.includes('appwrite.io') ? imageProxyUrl(img, 200, 60) : img}
                  alt={`Review image ${i + 1}`}
                  className="h-20 w-20 rounded-xl object-cover border border-[var(--color-border)]"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewCard
