import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import { productService } from '@api/services'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { SeoHead } from '@shared/seo/SeoHead'
import { config, imageProxyUrl } from '@api/config'
import { Zap, Flame, Clock, ArrowRight, Tag, Share2, MessageCircle, Copy, Send } from 'lucide-react'

// ── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const [display, setDisplay] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const intervalRef = useRef(null)
  const endTimeRef = useRef(endTime)

  // Keep ref in sync when endTime prop changes (e.g. after manual refresh)
  useEffect(() => {
    endTimeRef.current = endTime
  }, [endTime])

  useEffect(() => {
    if (!endTime) return

    const formatTime = () => {
      const target = new Date(endTimeRef.current).getTime()
      const now = Date.now()
      if (!Number.isFinite(target)) return '00:00:00'
      if (target <= now) {
        setIsExpired(true)
        return '00:00:00'
      }
      const totalSeconds = Math.floor((target - now) / 1000)
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    setDisplay(formatTime())
    intervalRef.current = setInterval(() => {
      setDisplay(formatTime())
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- interval must not restart; endTime is accessed via ref

  return { display, isExpired }
}

// ── Urgency Badge Component ──────────────────────────────────────────────────
function UrgencyBadge({ discount, isExpiringSoon, isFlash, isPremium }) {
  if (isFlash) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
        <Zap className="w-3 h-3" />
        FLASH SALE
      </div>
    )
  }
  if (isPremium) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">
        <Flame className="w-3 h-3" />
        PREMIUM
      </div>
    )
  }
  if (discount >= 50) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
        <Tag className="w-3 h-3" />
        MEGA DEAL
      </div>
    )
  }
  if (isExpiringSoon) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
        <Clock className="w-3 h-3" />
        ENDING SOON
      </div>
    )
  }
  return null
}

function formatDealSharePrice(value) {
  return `KES ${value.toLocaleString()}`
}

function getShareImageUrl(product) {
  const candidates = [product.image, ...(Array.isArray(product.images) ? product.images : [])]

  for (const candidate of candidates) {
    let image = candidate
    if (typeof image === 'string') {
      try {
        const parsed = JSON.parse(image)
        if (parsed && typeof parsed === 'object') image = parsed
      } catch {
        // A non JSON string is already an image URL.
      }
    }

    if (image && typeof image === 'object') {
      image = image.url || image.imageUrl || image.id
    }
    if (typeof image !== 'string') continue

    try {
      const url = new URL(image)
      if (
        url.protocol === 'https:' &&
        ['fra.cloud.appwrite.io', 'cloud.appwrite.io'].includes(url.hostname) &&
        !url.username &&
        !url.password
      ) {
        return url.toString()
      }
    } catch {
      // Skip invalid image values and try the next candidate.
    }
  }

  return null
}

function createDealShareContent(product, discount) {
  const productId = typeof product.$id === 'string' ? product.$id.trim() : ''
  const activeDeal = product.isDeal === true
  const dealPriceValid = typeof product.dealPrice === 'number' && Number.isFinite(product.dealPrice)
  const originalPriceValid = typeof product.price === 'number' && Number.isFinite(product.price)
  const discountValid = typeof discount === 'number'
    && Number.isFinite(discount)
    && typeof product.discount === 'number'
    && Number.isFinite(product.discount)
  const hasExpiry = product.endTime !== null && product.endTime !== undefined && product.endTime !== ''
  const expiryTimestamp = hasExpiry ? new Date(product.endTime).getTime() : null
  const expiryValid = !hasExpiry || Number.isFinite(expiryTimestamp)
  const isExpired = expiryValid && expiryTimestamp !== null && expiryTimestamp <= Date.now()
  let dealUrl = ''
  if (productId && typeof window !== 'undefined') {
    dealUrl = new URL(
      `/share/deal/${encodeURIComponent(productId)}`,
      config.sharing.dealShareOrigin,
    ).toString()
  }
  const expiryText = expiryValid && expiryTimestamp !== null
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(expiryTimestamp))
    : null
  const offerText = [
    `Check out ${product.productName || 'this deal'} on Nile Flow!`,
    `Deal price: ${dealPriceValid ? formatDealSharePrice(product.dealPrice) : ''}`,
    `Original price: ${originalPriceValid ? formatDealSharePrice(product.price) : ''}`,
    `Save ${discountValid ? `${discount}%` : ''}`,
    expiryText ? `Offer ends: ${expiryText}` : null,
  ].filter(Boolean).join('\n')
  const message = `${offerText}\nShop now: ${dealUrl}`
  let validationMessage = ''

  if (!activeDeal) {
    validationMessage = 'This deal is no longer available to share.'
  } else if (!productId) {
    validationMessage = 'This deal is missing its product link and cannot be shared.'
  } else if (!dealPriceValid || !originalPriceValid || !discountValid) {
    validationMessage = 'This deal is missing valid offer details and cannot be shared.'
  } else if (isExpired) {
    validationMessage = 'This deal has expired and cannot be shared.'
  } else if (!expiryValid) {
    validationMessage = 'This deal has an invalid expiry time and cannot be shared.'
  }

  return {
    dealUrl,
    offerText,
    message,
    isValid: Boolean(activeDeal && productId && dealPriceValid && originalPriceValid && discountValid && expiryValid && !isExpired && dealUrl),
    validationMessage,
  }
}

function supportsFileShare(file) {
  if (!file || typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') {
    return false
  }
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

function DealShareDialog({ isOpen, product, shareContent, copyFailed, setCopyFailed, onClose, push }) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const copyFallbackRef = useRef(null)
  const downloadUrlsRef = useRef(new Set())
  const [preparedImage, setPreparedImage] = useState(null)
  const [whatsappFallbackMessage, setWhatsappFallbackMessage] = useState('')
  const { dealUrl, offerText, message } = shareContent
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const imageUrl = getShareImageUrl(product)
  const imageKey = `${product.$id}:${imageUrl || ''}`
  const matchingPreparedImage = preparedImage?.key === imageKey ? preparedImage : null
  const imageFile = matchingPreparedImage?.file || null
  const canShareFiles = supportsFileShare(imageFile)
  const isPreparingImage = Boolean(
    isOpen && imageUrl && preparedImage?.key !== imageKey,
  )
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dealUrl)}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(offerText)}&url=${encodeURIComponent(dealUrl)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(dealUrl)}&text=${encodeURIComponent(offerText)}`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined

    if (isOpen && !dialog.open) {
      dialog.showModal()
      titleRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
    return undefined
  }, [isOpen])

  useEffect(() => {
    if (copyFailed) copyFallbackRef.current?.focus()
  }, [copyFailed])

  useEffect(() => {
    if (isOpen) return undefined
    for (const url of downloadUrlsRef.current) URL.revokeObjectURL(url)
    downloadUrlsRef.current.clear()
    return undefined
  }, [isOpen])

  useEffect(() => () => {
    for (const url of downloadUrlsRef.current) URL.revokeObjectURL(url)
    downloadUrlsRef.current.clear()
  }, [])

  useEffect(() => {
    if (!isOpen || !imageUrl || preparedImage?.key === imageKey) return undefined

    const controller = new AbortController()
    let cancelled = false
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const prepareImage = async () => {
      try {
        const response = await fetch(imageProxyUrl(imageUrl), {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Image request failed with status ${response.status}.`)
        }

        const mimeType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
        if (!config.upload.allowedImageTypes.includes(mimeType)) {
          throw new Error('The product image type is not supported for sharing.')
        }

        const blob = await response.blob()
        const extensions = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/gif': 'gif',
        }
        const file = new File([blob], `deal-${product.$id}.${extensions[mimeType]}`, {
          type: mimeType,
        })

        if (!cancelled) setPreparedImage({ key: imageKey, file, failed: false })
      } catch {
        if (!cancelled) setPreparedImage({ key: imageKey, file: null, failed: true })
      } finally {
        clearTimeout(timeoutId)
      }
    }

    prepareImage()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [imageKey, imageUrl, isOpen, preparedImage?.key, product.$id])

  const handleCancel = (event) => {
    event.preventDefault()
    onClose()
  }

  const handleDeviceShare = async () => {
    if (!canShare) return
    try {
      await navigator.share({
        title: product.productName || 'Nile Flow deal',
        text: offerText,
        url: dealUrl,
        ...(canShareFiles ? { files: [imageFile] } : {}),
      })
      if (imageUrl && !canShareFiles) {
        push({
          title: 'Deal shared without image',
          message: 'The offer and link were shared, but the product image could not be attached.',
        })
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      push({ title: 'Unable to share', message: 'Please try one of the social platforms or copy the deal link instead.' })
    }
  }

  const handleWhatsAppShare = async () => {
    if (!imageFile) {
      setWhatsappFallbackMessage('The product image could not be prepared. Copy the offer link or try another share option.')
      return
    }
    if (!canShare || !canShareFiles) {
      setWhatsappFallbackMessage('Unable to share the product image. Download it and add it to your WhatsApp Status, then copy the offer link.')
      return
    }

    try {
      await navigator.share({
        title: product.productName || 'Nile Flow deal',
        text: message,
        files: [imageFile],
      })
      onClose()
    } catch (error) {
      if (error?.name === 'AbortError') return
      setWhatsappFallbackMessage('Unable to share the product image. Download it and add it to your WhatsApp Status, then copy the offer link.')
    }
  }

  const handleDownloadImage = () => {
    if (!imageFile) return
    const objectUrl = URL.createObjectURL(imageFile)
    downloadUrlsRef.current.add(objectUrl)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = imageFile.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
      downloadUrlsRef.current.delete(objectUrl)
    }, 1000)
  }

  const handleCopyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is not available in this browser.')
      }
      await navigator.clipboard.writeText(dealUrl)
      push({ title: 'Deal link copied', message: 'Share the link with anyone who may like this offer.' })
      onClose()
    } catch {
      setCopyFailed(true)
      push({ title: 'Could not copy the link', message: 'You can select and copy the full deal message below.' })
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      aria-labelledby={`deal-share-title-${product.$id}`}
      aria-describedby={`deal-share-description-${product.$id}`}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-text-primary)] shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              ref={titleRef}
              id={`deal-share-title-${product.$id}`}
              tabIndex="-1"
              className="text-lg font-bold text-[var(--color-text-primary)]"
            >
              Share this deal
            </h2>
            <p id={`deal-share-description-${product.$id}`} className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Share the offer details and link with someone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <div>
            <button
              type="button"
              onClick={handleDeviceShare}
              disabled={!canShare || isPreparingImage}
              aria-describedby={!canShare
                ? `device-share-unavailable-${product.$id}`
                : isPreparingImage
                  ? `device-share-preparing-${product.$id}`
                  : undefined}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-red-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Share2 aria-hidden="true" className="h-4 w-4" />
              Share from this device
            </button>
            {!canShare ? (
              <p id={`device-share-unavailable-${product.$id}`} className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Device sharing is not available in this browser.
              </p>
            ) : isPreparingImage ? (
              <p
                id={`device-share-preparing-${product.$id}`}
                role="status"
                className="mt-1 text-xs text-[var(--color-text-secondary)]"
              >
                Preparing product image for device sharing.
              </p>
            ) : matchingPreparedImage?.failed ? (
              <p role="status" className="mt-1 text-xs text-[var(--color-text-secondary)]">
                The product image could not be prepared. Sharing will include the offer and link.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={isPreparingImage}
            aria-describedby={isPreparingImage
              ? `whatsapp-image-preparing-${product.$id}`
              : whatsappFallbackMessage
                ? `whatsapp-image-fallback-${product.$id}`
                : undefined}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
            WhatsApp or Status
          </button>
          {imageUrl && isPreparingImage && (
            <p
              id={`whatsapp-image-preparing-${product.$id}`}
              role="status"
              className="mt-1 text-xs text-[var(--color-text-secondary)]"
            >
              Preparing product image for WhatsApp sharing.
            </p>
          )}
          {whatsappFallbackMessage && (
            <p
              id={`whatsapp-image-fallback-${product.$id}`}
              role="status"
              className="text-sm text-[var(--color-text-secondary)]"
            >
              {whatsappFallbackMessage}
            </p>
          )}
          {whatsappFallbackMessage.startsWith('Unable to share the product image.') && imageFile && (
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-red-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Download product image
            </button>
          )}

          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-700">f</span>
            Facebook
          </a>

          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"
          >
            <span aria-hidden="true" className="text-base font-bold">X</span>
            Share on X
          </a>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            <Send aria-hidden="true" className="h-4 w-4" />
            Telegram
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-red-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            Copy link
          </button>
        </div>

        {copyFailed && (
          <div className="mt-4">
            <p role="alert" className="mb-2 text-sm font-medium text-red-700">
              Copying is unavailable. You can select the message below and copy it manually.
            </p>
            <label htmlFor={`deal-share-message-${product.$id}`} className="mb-1 block text-sm font-semibold">
              Select and copy this deal message
            </label>
            <textarea
              ref={copyFallbackRef}
              id={`deal-share-message-${product.$id}`}
              readOnly
              value={message}
              rows={6}
              aria-label="Deal share message to copy"
              className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            />
          </div>
        )}
      </div>
    </dialog>
  )
}

// ── Deal Card Component ──────────────────────────────────────────────────────
function DealCard({ product, isFlash, isPremium, discount }) {
  const { display: countdown, isExpired } = useCountdown(product.endTime)
  const shareContent = createDealShareContent(product, discount)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareSession, setShareSession] = useState(0)
  const [copyFailed, setCopyFailed] = useState(false)
  const { push } = useToast()
  const shareUnavailableDescriptionId = `deal-share-unavailable-${product.$id}`
  const shareUnavailableMessage = isExpired
    ? 'This deal has expired and cannot be shared.'
    : shareContent.validationMessage
  const closeShareDialog = () => {
    setIsShareOpen(false)
    setCopyFailed(false)
  }

  return (
    <div
      className={`group relative rounded-2xl border-2 bg-[var(--color-surface)] shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        isFlash
          ? 'border-red-500 hover:border-red-600'
          : isPremium
          ? 'border-purple-500 hover:border-purple-600'
          : discount >= 50
          ? 'border-orange-500 hover:border-orange-600'
          : 'border-[var(--color-border)] hover:border-red-400'
      }`}
    >
      {/* Top Badges */}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 z-10">
        <UrgencyBadge
          discount={discount}
          isExpiringSoon={product.isExpiringSoon}
          isFlash={isFlash}
          isPremium={isPremium}
        />
        {discount >= 50 && (
          <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-black animate-pulse">
            BEST VALUE
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative px-2 pt-12 pb-2 sm:px-4 sm:pt-16 sm:pb-4">
        <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg ${
          discount >= 50 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-br from-red-500 to-orange-500'
        }`}>
          -{discount}%
        </div>
        <img
          src={product.image ? imageProxyUrl(product.image, 400, 90) : '/logo.png'}
          alt={product.productName}
          className="w-full h-36 sm:h-48 object-cover rounded-xl bg-[var(--color-surface-muted)]"
          onError={(e) => { e.target.src = '/logo.png' }}
        />
      </div>

      {/* Content */}
      <div className="px-2 pb-2 sm:px-4 sm:pb-4">
        {/* Category */}
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5 sm:mb-1">
          {product.categoryName || product.category?.categoryName || product.category   || 'Uncategorized'}
        </p>

        {/* Product Name */}
        <h3 className="font-bold text-[var(--color-text-primary)] text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-2 sm:mb-3 group-hover:text-red-600 transition-colors">
          {product.productName}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-base sm:text-xl font-black text-red-600">
            KES {product.dealPrice?.toLocaleString?.() ?? product.dealPrice}
          </span>
          <span className="text-xs sm:text-sm text-[var(--color-text-muted)] line-through">
            KES {product.price?.toLocaleString?.() ?? product.price}
          </span>
        </div>

        {/* Countdown Timer */}
        {product.endTime && (
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-2 sm:mb-3 ${
          isExpired
            ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
            : product.isExpiringSoon
            ? 'bg-red-50 text-red-700 animate-pulse'
            : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
        }`}>
          <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${product.isExpiringSoon ? 'text-red-600' : ''}`} />
          {isExpired ? (
            <span className="text-[10px] sm:text-xs font-medium">Deal Expired</span>
          ) : (
            <span className="text-[10px] sm:text-xs font-mono font-bold">{countdown}</span>
          )}
        </div>
        )}

        {/* CTA Button */}
        <div className="flex gap-2">
          <Link
            to={`/deal/${product.$id}`}
            className={`block min-w-0 flex-1 text-center py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
              isFlash
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl'
                : isPremium
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] hover:bg-red-600 hover:text-white'
            }`}
          >
            {isExpired ? 'Deal Ended' : 'View Deal →'}
          </Link>
          <button
            type="button"
            onClick={() => {
              setCopyFailed(false)
              setShareSession((session) => session + 1)
              setIsShareOpen(true)
            }}
            disabled={isExpired || !shareContent.isValid}
            aria-describedby={shareUnavailableMessage ? shareUnavailableDescriptionId : undefined}
            title={shareUnavailableMessage || undefined}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] px-2 py-2 text-xs font-bold text-[var(--color-text-primary)] transition hover:border-red-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" />
            Share
          </button>
        </div>
        {shareUnavailableMessage && (
          <p id={shareUnavailableDescriptionId} className="mt-2 text-xs text-[var(--color-text-secondary)]">
            {shareUnavailableMessage}
          </p>
        )}
        <DealShareDialog
          key={`${product.$id}:${shareSession}`}
          isOpen={isShareOpen}
          product={product}
          shareContent={shareContent}
          copyFailed={copyFailed}
          setCopyFailed={setCopyFailed}
          onClose={closeShareDialog}
          push={push}
        />
      </div>
    </div>
  )
}

// ── Flash Sale Ticker Countdown ──────────────────────────────────────────────
function TickerCountdown({ flashSales }) {
  const [display, setDisplay] = useState('--:--:--')
  const intervalRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      const nearest = flashSales.reduce((min, f) => {
        if (!f.endTime) return min
        const total = Math.floor((new Date(f.endTime).getTime() - Date.now()) / 1000)
        if (total <= 0) return min
        return total < (min?.total ?? Infinity) ? { ...f, total } : min
      }, null)
      if (!nearest || !nearest.total) {
        setDisplay('--:--:--')
        return
      }
      const h = Math.floor(nearest.total / 3600)
      const m = Math.floor((nearest.total % 3600) / 60)
      const s = nearest.total % 60
      setDisplay(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }

    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => clearInterval(intervalRef.current)
  }, [flashSales])

  return <span>{display}</span>
}

// ── Main Component ───────────────────────────────────────────────────────────
const DealsPage = () => {
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('type') || 'all'
  const [filter, setFilter] = useState(initialFilter)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [flashSales, setFlashSales] = useState([])
  const [globalTimeLeft, setGlobalTimeLeft] = useState(null)
  const { push } = useToast()

  const categories = [
    { value: 'all', label: 'All Deals', icon: '🔥' },
    { value: 'product', label: 'Product Deals', icon: '🏷️' },
    { value: 'flash', label: 'Flash Sales', icon: '⚡' },
    { value: 'ending-soon', label: 'Ending Soon', icon: '⏱️' },
    { value: 'premium', label: 'Premium', icon: '⭐' },
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      const [deals, flash] = await Promise.all([
        productService.getDealProducts(),
        productService.getFlashSales(),
      ])
      setProducts(deals)
      setFlashSales(flash)
    } catch (error) {
      console.error('Failed to fetch deals:', error)
      push({ title: 'Error', message: 'Could not load deals. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Update global countdown from all deals
  useEffect(() => {
    if (products.length === 0) return
    const nearest = products.reduce((min, p) => {
      if (!p.endTime) return min
      const totalSec = Math.floor((new Date(p.endTime).getTime() - Date.now()) / 1000)
      if (totalSec <= 0) return min
      const hours = Math.floor(totalSec / 3600)
      const minutes = Math.floor((totalSec % 3600) / 60)
      return totalSec < (min?.totalSeconds ?? Infinity)
        ? { totalHours: hours, minutes, seconds: totalSec % 60, totalSeconds: totalSec }
        : min
    }, null)
    setGlobalTimeLeft(nearest)
  }, [products])

  const filteredProducts = products.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'flash') return p.isFlash || flashSales.some((f) => f.productId === p.productId)
    if (filter === 'product') return !p.isFlash && !p.isPremium && !p.premiumDeal
    if (filter === 'ending-soon') return p.isExpiringSoon
    if (filter === 'premium') return p.isPremium || p.premiumDeal
    return true
  })

  const isFilteredFlash = filter === 'flash'

  return (
    <PageShell>
      <SeoHead
        title="Deals & Flash Sales"
        description="Exclusive discounts and limited-time offers on Nile Flow products."
        keywords={['deals', 'flash sale', 'discount', 'premium', 'shopping']}
      />

      {/* ── Hero Section ── */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-red-950 via-orange-950 to-amber-950 px-4 py-12 text-center sm:py-16"
        style={{
          backgroundImage: 'url(/DealImage.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
              <Flame className="w-3 h-3" /> HOT DEALS
            </span>
            {globalTimeLeft && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-600/90 text-white text-xs font-bold">
                <Clock className="w-3 h-3" />
                Ends in {globalTimeLeft.totalHours}h {globalTimeLeft.minutes}m
              </span>
            )}
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
            <span className="text-red-400">Limited-Time</span> Savings
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-200">
            Up to <span className="font-bold text-red-400">50% off</span> on handpicked African products.
            These deals won't last — grab yours before they're gone.
          </p>

          <div className="mt-8 flex flex-nowrap items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 min-h-10 sm:min-h-11 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 hover:border-white/50"
            >
              Browse All Products
            </Link>
            <Link
              to="/featured-products"
              className="inline-flex items-center gap-2 min-h-10 sm:min-h-11 rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xl transition hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              Shop Featured Deals
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Flash Sale Ticker ── */}
      {flashSales.length > 0 && !isFilteredFlash && (
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm font-bold animate-pulse">
                <Zap className="w-5 h-5 text-yellow-300" />
                ⚡ FLASH SALE ACTIVE
              </span>
              <span className="text-xs text-red-100 hidden sm:inline">
                {flashSales.length} deals ending soon
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-black/20 px-3 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              <TickerCountdown flashSales={flashSales} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <ResponsiveSection className="py-10 sm:py-14 lg:py-16">
        {/* Category Filters - Scrollable on small screens */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 justify-start sm:justify-center min-w-max px-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  cat.value === filter
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-105'
                    : 'bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-red-400 hover:text-red-600'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
                {cat.value === 'flash' && flashSales.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 rounded-full text-white">
                    {flashSales.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-6 h-6 text-red-600 animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Loading amazing deals...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-12 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No deals found</h3>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Try adjusting your filters or check back later for new deals.
            </p>
            <Link
              to="/featured-products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Browse Featured Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6 text-sm text-[var(--color-text-muted)]">
              Showing <span className="font-semibold text-red-600">{filteredProducts.length}</span> deals
              {filter !== 'all' && <span> in <span className="font-semibold">{categories.find(c => c.value === filter)?.label}</span></span>}
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => {
                const isFlash = product.isFlash || flashSales.some((f) => f.productId === product.productId)
                const isPremium = product.isPremium || product.premiumDeal
                const discount = product.discount || 0

                return (
                  <DealCard
                    key={product.$id}
                    product={product}
                    isFlash={isFlash}
                    isPremium={isPremium}
                    discount={discount}
                  />
                )
              })}
            </div>
          </>
        )}
      </ResponsiveSection>
    </PageShell>
  )
}

export default DealsPage
