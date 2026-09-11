import { useState, useEffect, useCallback, useRef } from 'react'

const DEFAULT_BANNERS = [
  {
    id: '1',
    title: 'Africa-ready shopping, reimagined',
    subtitle: 'Discover everyday essentials, premium finds, and trusted local sellers in one calm, modern marketplace.',
    cta: 'Browse products',
    ctaHref: '/products',
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    image: null,
  },
  {
    id: '2',
    title: 'Premium merchants, fast delivery',
    subtitle: 'Unlock deals, bonus rewards, and dependable support — all in one place.',
    cta: 'Shop premium',
    ctaHref: '/products?premium=true',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    image: null,
  },
  {
    id: '3',
    title: 'Support local artisans',
    subtitle: 'Handpicked goods from trusted merchants across the region — quality you can trust.',
    cta: 'Explore artisan picks',
    ctaHref: '/products?featured=true',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
    image: null,
  },
]

function BannerCarousel({ banners, autoPlayInterval = 5000 }) {
  const resolvedBanners = Array.isArray(banners) && banners.length > 0 ? banners : DEFAULT_BANNERS
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef(null)
  const total = resolvedBanners.length
  const hasMultiple = total > 1
  const isPausedRef = useRef(false)

  // Use refs for values that change frequently to avoid stale closures in setInterval
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex
  const totalRef = useRef(total)
  totalRef.current = total
  const isTransitioningRef = useRef(isTransitioning)
  isTransitioningRef.current = isTransitioning

  const goTo = useCallback((index) => {
    if (isTransitioningRef.current || !hasMultiple) return
    setIsTransitioning(true)
    const nextIndex = Math.max(0, Math.min(index, totalRef.current - 1))
    setActiveIndex(nextIndex)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Auto-play effect — only starts when banners actually change
  // Uses a ref to track the resolvedBanners reference to avoid restarting on every render
  const bannersKeyRef = useRef(0)
  const currentBannersKey = resolvedBanners.map(b => b.id + b.title).join('|')

  useEffect(() => {
    if (!hasMultiple || autoPlayInterval <= 0) return

    // Only restart timer if the banner content actually changed
    if (bannersKeyRef.current !== currentBannersKey) {
      bannersKeyRef.current = currentBannersKey
      clearTimer()
      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          const next = (activeIndexRef.current + 1) % totalRef.current
          goTo(next)
        }
      }, autoPlayInterval)
    } else if (!timerRef.current) {
      // Timer was cleared but banners haven't changed — restart it
      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          const next = (activeIndexRef.current + 1) % totalRef.current
          goTo(next)
        }
      }, autoPlayInterval)
    }

    return clearTimer
  }, [hasMultiple, autoPlayInterval, clearTimer, goTo, currentBannersKey])

  // Pause on touch start, resume on touch end
  const handleTouchStart = useCallback(() => {
    isPausedRef.current = true
    clearTimer()
  }, [clearTimer])

  const handleTouchEnd = useCallback(() => {
    isPausedRef.current = false
    if (hasMultiple && autoPlayInterval > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          const next = (activeIndexRef.current + 1) % totalRef.current
          goTo(next)
        }
      }, autoPlayInterval)
    }
  }, [hasMultiple, autoPlayInterval, goTo, clearTimer])

  // Pause on hover for desktop
  const handleMouseEnter = useCallback(() => {
    isPausedRef.current = true
    clearTimer()
  }, [clearTimer])

  const handleMouseLeave = useCallback(() => {
    isPausedRef.current = false
    if (hasMultiple && autoPlayInterval > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        if (!isPausedRef.current) {
          const next = (activeIndexRef.current + 1) % totalRef.current
          goTo(next)
        }
      }, autoPlayInterval)
    }
  }, [hasMultiple, autoPlayInterval, goTo, clearTimer])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') {
        const prev = (activeIndexRef.current - 1 + totalRef.current) % totalRef.current
        goTo(prev)
      }
      if (e.key === 'ArrowRight') {
        const next = (activeIndexRef.current + 1) % totalRef.current
        goTo(next)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goTo])

  return (
    <section
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main banner slide */}
      <div className="relative min-h-[200px] sm:min-h-[240px] md:min-h-[300px] lg:min-h-[360px] xl:min-h-[400px]">
        {resolvedBanners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 flex flex-col justify-center px-4 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-16 transition-all duration-500 ease-in-out ${
              i === activeIndex
                ? 'opacity-100 translate-y-0 z-10'
                : 'opacity-0 translate-y-3 pointer-events-none z-0'
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${total}: ${banner.title}`}
            aria-hidden={i !== activeIndex}
          >
            {/* Banner image */}
            {banner.image && (
              <img
                src={banner.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}

            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 ${
                banner.image
                  ? 'bg-gradient-to-t from-black/70 via-black/30 to-transparent'
                  : `bg-gradient-to-br ${banner.gradient}`
              }`}
            />

            {/* Content */}
            <div className="relative z-10 mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl">
              <span className="inline-block rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-xs">
                Featured
              </span>
              <h2 className="mt-3 text-lg font-bold leading-tight text-white sm:mt-4 sm:text-xl md:mt-5 md:text-2xl lg:text-3xl xl:text-4xl">
                {banner.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-white/80 sm:mt-3 sm:text-sm md:mt-4 md:text-base lg:text-lg">
                {banner.subtitle}
              </p>
              <div className="mt-4 sm:mt-5 md:mt-6">
                <a
                  href={banner.ctaHref}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-lg transition hover:scale-105 hover:shadow-xl active:scale-95 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm md:px-6 md:py-3"
                >
                  {banner.cta}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrow controls (desktop) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={() => goTo((activeIndex - 1 + total) % total)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden h-8 w-8 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none sm:left-3 sm:h-9 sm:w-9 md:left-4 md:h-10 md:w-10"
            aria-label="Previous banner"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5l-5 5 5 5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo((activeIndex + 1) % total)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden h-8 w-8 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none sm:right-3 sm:h-9 sm:w-9 md:right-4 md:h-10 md:w-10"
            aria-label="Next banner"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 5l5 5-5 5" />
            </svg>
          </button>
        </>
      )}

      {/* Touch swipe zones (mobile) */}
      {hasMultiple && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-10 sm:hidden cursor-pointer"
            onClick={() => goTo((activeIndex - 1 + total) % total)}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-10 sm:hidden cursor-pointer"
            onClick={() => goTo((activeIndex + 1) % total)}
            aria-hidden="true"
          />
        </>
      )}

      {/* Dot indicators */}
      {hasMultiple && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 hidden sm:flex">
          {resolvedBanners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                i === activeIndex
                  ? 'w-3 h-1.5 bg-white sm:w-6 sm:h-2'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75 sm:w-2 sm:h-2'
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default BannerCarousel
