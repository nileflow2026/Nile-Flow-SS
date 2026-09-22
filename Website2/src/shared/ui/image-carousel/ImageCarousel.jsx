import { useState, useRef, useCallback, useMemo } from 'react'
import { imageProxyUrl } from '@api/config'

const FALLBACK_IMAGE = '/logo.png'

/**
 * Returns the proxied URL for Appwrite images, or the raw URL for others.
 */
function getProxiedUrl(url, width = 800, quality = 75) {
  if (!url) return FALLBACK_IMAGE
  if (typeof url === 'object') {
    url = url.url || url.imageUrl || url.href || ''
  }
  if (!url) return FALLBACK_IMAGE
  if (url.includes('/api/image-proxy?')) return imageProxyUrl(url, width, quality)
  if (url.includes('appwrite.io')) {
    return imageProxyUrl(url, width, quality)
  }
  return url
}

function ImageCarousel({ images = [], alt = '', fallback = FALLBACK_IMAGE }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const trackRef = useRef(null)

  // Memoize image list so we don't recalc on every render
  const allImages = useMemo(() => (images.length > 0 ? images : [fallback]), [images, fallback])
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

  // ── Image error handler ────────────────────────────────────────────────
  // Keep failures on the same origin; raw Appwrite URLs can be blocked by CORP.
  const handleMainImageError = useCallback((e) => {
    const img = e.currentTarget
    img.onerror = null
    img.src = fallback
  }, [fallback])

  // ── Touch handlers for swipe ──────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.touches[0].clientX)
    setTouchEnd(null)
  }, [])

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.touches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (touchStart === null || touchEnd === null) return
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, goNext, goPrev])

  // ── Keyboard nav ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
  }, [goPrev, goNext])

  // ── Thumbnail error handler ───────────────────────────────────────────
  const handleThumbError = useCallback((e) => {
    const img = e.currentTarget
    img.onerror = null
    img.src = fallback
  }, [fallback])

  return (
    <div className="space-y-2 sm:space-y-4 select-none">
      {/* ── Main carousel track ────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 sm:aspect-[4/3] sm:rounded-[1.5rem]"
        onTouchStart={hasMultiple ? handleTouchStart : undefined}
        onTouchMove={hasMultiple ? handleTouchMove : undefined}
        onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        onKeyDown={hasMultiple ? handleKeyDown : undefined}
        tabIndex={hasMultiple ? 0 : -1}
        role="region"
        aria-roledescription="carousel"
        aria-label={alt ? `${alt} images` : 'Product images'}
      >
        {/* Slides container */}
        <div
          className="flex h-full transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {allImages.map((src, i) => (
            <div
              key={i}
              className="relative w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`Image ${i + 1} of ${allImages.length}`}
            >
              <img
                src={getProxiedUrl(src)}
                alt={`${alt} — image ${i + 1}`}
                className="h-full w-full object-contain p-2 sm:p-4"
                loading="eager"
                decoding="async"
                fetchPriority={i === 0 ? 'high' : 'low'}
                draggable={false}
                onError={(e) => handleMainImageError(e, i)}
              />
            </div>
          ))}
        </div>

        {/* Gradient overlay (desktop only) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent hidden sm:block" />

        {/* ── Arrow controls ────────────────────────────────────────────── */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5l-5 5 5 5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex === allImages.length - 1}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M8 5l5 5-5 5" />
              </svg>
            </button>

            {/* Touch swipe zones (mobile) — invisible hit areas */}
            <div
              className="absolute inset-y-0 left-0 w-1/3 z-10 sm:hidden cursor-pointer"
              onClick={goPrev}
              aria-hidden="true"
            />
            <div
              className="absolute inset-y-0 right-0 w-1/3 z-10 sm:hidden cursor-pointer"
              onClick={goNext}
              aria-hidden="true"
            />
          </>
        )}

        {/* ── Dot indicators ────────────────────────────────────────────── */}
        {hasMultiple && (
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {allImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  i === activeIndex
                    ? 'w-4 sm:w-6 h-1.5 sm:h-2 bg-white'
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* ── Counter badge ──────────────────────────────────────────────── */}
        {hasMultiple && (
          <div className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 rounded-full bg-black/55 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-white backdrop-blur-sm">
            {activeIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ────────────────────────────────────────────── */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin snap-x snap-mandatory px-1">
          {allImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`snap-start shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                i === activeIndex
                  ? 'h-12 w-12 sm:h-16 sm:w-16 border-amber-500 opacity-100 ring-1 ring-amber-500/40'
                  : 'h-12 w-12 sm:h-16 sm:w-16 border-transparent opacity-55 hover:opacity-90 sm:opacity-60'
              }`}
              aria-label={`Select image ${i + 1}`}
            >
              <img
                src={getProxiedUrl(src, 150, 55)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                draggable={false}
                onError={(e) => handleThumbError(e, src)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageCarousel
