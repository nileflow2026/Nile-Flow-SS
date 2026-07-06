import { useState, useRef, useCallback } from 'react'

const FALLBACK_IMAGE = '/logo.png'

function getProxiedUrl(url, width = 800, quality = 75) {
  if (!url) return FALLBACK_IMAGE
  if (url.includes('appwrite.io')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}&width=${width}&quality=${quality}`
  }
  return url
}

function ImageCarousel({ images = [], alt = '', fallback = FALLBACK_IMAGE }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const trackRef = useRef(null)

  // Collect all images: primary (index 0) + extras
  const allImages = images.length > 0 ? images : [fallback]
  const hasMultiple = allImages.length > 1

  const goTo = useCallback((index) => {
    setActiveIndex(Math.max(0, Math.min(index, allImages.length - 1)))
  }, [allImages.length])

  const goNext = useCallback(() => {
    goTo(activeIndex + 1)
  }, [activeIndex, goTo])

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1)
  }, [activeIndex, goTo])

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
    setTouchEnd(null)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const diff = touchStart - touchEnd
    const threshold = 50
    if (Math.abs(diff) > threshold) {
      if (diff > 0) goNext()
      else goPrev()
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Keyboard nav
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goPrev()
    if (e.key === 'ArrowRight') goNext()
  }

  return (
    <div className="space-y-4">
      {/* Main carousel track */}
      <div
        ref={trackRef}
        className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[var(--color-surface-muted)]"
        onTouchStart={hasMultiple ? handleTouchStart : undefined}
        onTouchMove={hasMultiple ? handleTouchMove : undefined}
        onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        onKeyDown={hasMultiple ? handleKeyDown : undefined}
        tabIndex={hasMultiple ? 0 : -1}
        role="region"
        aria-label={`Product image ${activeIndex + 1} of ${allImages.length}`}
      >
        {/* Slides container */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {allImages.map((src, i) => (
            <div key={i} className="relative w-full shrink-0">
              <img
                src={getProxiedUrl(src)}
                alt={`${alt} — image ${i + 1}`}
                className="h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.target.src = fallback
                }}
              />
            </div>
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Arrow controls (desktop) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[var(--color-text-primary)] shadow-md transition hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5l-5 5 5 5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex === allImages.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[var(--color-text-primary)] shadow-md transition hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 5l5 5-5 5" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Counter badge */}
        {hasMultiple && (
          <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
            {activeIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {allImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === activeIndex
                  ? 'border-[var(--color-primary)] opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
              aria-label={`Select image ${i + 1}`}
            >
              <img
                src={getProxiedUrl(src, 150, 60)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = fallback
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageCarousel
