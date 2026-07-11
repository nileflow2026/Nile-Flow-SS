import { useState } from 'react'
import PrimaryButton from '../button/PrimaryButton'
import { reviewService } from '@api/services'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '../toast/ToastProvider'

const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

function ReviewForm({ productId, onReviewSubmitted }) {
  const { isAuthenticated } = useAuth()
  const { push } = useToast()

  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isAuthenticated) {
      push({ title: 'Sign in required', message: 'Please sign in to leave a review.' })
      return
    }

    if (rating === 0) {
      setError('Please select a rating.')
      return
    }

    setSubmitting(true)
    const result = await reviewService.submitReview({
      productId,
      reviewText: reviewText.trim(),
      rating,
    })
    setSubmitting(false)

    if (result.success) {
      push({ title: 'Review submitted', message: 'Thank you for your feedback!' })
      setRating(0)
      setReviewText('')
      onReviewSubmitted?.()
    } else {
      setError(result.error || 'Failed to submit review.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Write a review</p>

      {/* Star selector */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= (hoveredStar || rating)
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                className="cursor-pointer transition-transform hover:scale-110"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                <svg width="28" height="28" viewBox="0 0 20 20" fill={filled ? 'var(--color-warning, #f59e0b)' : 'var(--color-border, #d1d5db)'}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            )
          })}
          {(hoveredStar || rating) > 0 && (
            <span className="ml-2 text-xs font-medium text-[var(--color-text-muted)]">
              {STAR_LABELS[(hoveredStar || rating) - 1]}
            </span>
          )}
        </div>
      </div>

      {/* Review text */}
      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Share your experience with this product…"
        rows={4}
        maxLength={1000}
        className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(22,163,74,0.16)]"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center sm:w-auto">
        {submitting ? 'Submitting…' : 'Submit review'}
      </PrimaryButton>
    </form>
  )
}

export default ReviewForm
