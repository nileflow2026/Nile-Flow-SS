import { useEffect, useRef, useState } from 'react'
import { Copy, MessageCircle, Send, Share2 } from 'lucide-react'
import { config } from '@api/config'
import { getProductShareImageProxyUrl } from '../utils/productShareContent'

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

export default function ProductShareDialog({
  isOpen,
  isDeal,
  shareContent,
  copyFailed,
  setCopyFailed,
  onClose,
  push,
}) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const copyFallbackRef = useRef(null)
  const downloadUrlsRef = useRef(new Set())
  const [preparedImage, setPreparedImage] = useState(null)
  const [whatsappFallbackMessage, setWhatsappFallbackMessage] = useState('')
  const {
    imageUrl,
    message,
    offerText,
    productId,
    productName,
    shareUrl,
  } = shareContent
  const imageKey = `${productId}:${imageUrl || ''}`
  const matchingPreparedImage = preparedImage?.key === imageKey ? preparedImage : null
  const imageFile = matchingPreparedImage?.file || null
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const canShareFiles = supportsFileShare(imageFile)
  const isPreparingImage = Boolean(
    isOpen && imageUrl && preparedImage?.key !== imageKey,
  )
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(offerText)}&url=${encodeURIComponent(shareUrl)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(offerText)}`
  const closeDialog = () => {
    setWhatsappFallbackMessage('')
    onClose()
  }

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
    const timeoutId = window.setTimeout(() => controller.abort(), 15000)
    const prepareImage = async () => {
      try {
        const response = await fetch(getProductShareImageProxyUrl(imageUrl), {
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
        const filePrefix = isDeal ? 'deal' : 'product'
        const file = new File([blob], `${filePrefix}-${productId}.${extensions[mimeType]}`, {
          type: mimeType,
        })
        if (!cancelled) setPreparedImage({ key: imageKey, file, failed: false })
      } catch {
        if (!cancelled) setPreparedImage({ key: imageKey, file: null, failed: true })
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    prepareImage()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [imageKey, imageUrl, isDeal, isOpen, preparedImage?.key, productId])

  const handleCancel = (event) => {
    event.preventDefault()
    closeDialog()
  }

  const handleDeviceShare = async () => {
    if (!canShare) return
    try {
      await navigator.share({
        title: productName,
        text: offerText,
        url: shareUrl,
        ...(canShareFiles ? { files: [imageFile] } : {}),
      })
      if (imageUrl && !canShareFiles) {
        push({
          title: `${isDeal ? 'Deal' : 'Product'} shared without image`,
          message: `The ${isDeal ? 'deal' : 'product'} details and link were shared, but the image could not be attached.`,
        })
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      push({
        title: 'Unable to share',
        message: `Please try another share option or copy the ${isDeal ? 'deal' : 'product'} link.`,
      })
    }
  }

  const handleWhatsAppShare = async () => {
    if (!imageFile) {
      setWhatsappFallbackMessage(
        matchingPreparedImage?.failed
          ? `The ${isDeal ? 'deal' : 'product'} image could not be prepared. Copy the ${isDeal ? 'deal' : 'product'} link or try another share option.`
          : `No public ${isDeal ? 'deal' : 'product'} image is available. Copy the ${isDeal ? 'deal' : 'product'} link or try another share option.`,
      )
      return
    }
    if (!canShare || !canShareFiles) {
      setWhatsappFallbackMessage(`Image sharing is unavailable. Download the image and add it to WhatsApp, then copy the ${isDeal ? 'deal' : 'product'} link.`)
      return
    }
    try {
      await navigator.share({ title: productName, text: message, files: [imageFile] })
      closeDialog()
    } catch (error) {
      if (error?.name === 'AbortError') return
      setWhatsappFallbackMessage(`Image sharing did not complete. Download the image and add it to WhatsApp, then copy the ${isDeal ? 'deal' : 'product'} link.`)
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
      await navigator.clipboard.writeText(shareUrl)
      push({
        title: `${isDeal ? 'Deal' : 'Product'} link copied`,
        message: `Share the link with someone who may like this ${isDeal ? 'deal' : 'product'}.`,
      })
      closeDialog()
    } catch {
      setCopyFailed(true)
      push({
        title: 'Could not copy the link',
        message: `You can select and copy the full ${isDeal ? 'deal' : 'product'} message below.`,
      })
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      aria-labelledby={`product-share-title-${productId}`}
      aria-describedby={`product-share-description-${productId}`}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-text-primary)] shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              ref={titleRef}
              id={`product-share-title-${productId}`}
              tabIndex="-1"
              className="text-lg font-bold text-[var(--color-text-primary)]"
            >
              {isDeal ? 'Share this deal' : 'Share this product'}
            </h2>
            <p id={`product-share-description-${productId}`} className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Share the {isDeal ? 'deal' : 'product'} details and link with someone.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
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
                ? `device-share-unavailable-${productId}`
                : isPreparingImage
                  ? `device-share-preparing-${productId}`
                  : undefined}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-green-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Share2 aria-hidden="true" className="h-4 w-4" />
              Share from this device
            </button>
            {!canShare ? (
              <p id={`device-share-unavailable-${productId}`} className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Device sharing is not available in this browser.
              </p>
            ) : isPreparingImage ? (
              <p id={`device-share-preparing-${productId}`} role="status" className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Preparing product image for device sharing.
              </p>
            ) : matchingPreparedImage?.failed ? (
              <p role="status" className="mt-1 text-xs text-[var(--color-text-secondary)]">
                The product image could not be prepared. Sharing will include the product details and link.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={isPreparingImage}
            aria-describedby={isPreparingImage ? `whatsapp-image-preparing-${productId}` : undefined}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
            WhatsApp or Status
          </button>
          {isPreparingImage && (
            <p id={`whatsapp-image-preparing-${productId}`} role="status" className="text-xs text-[var(--color-text-secondary)]">
              Preparing product image for WhatsApp sharing.
            </p>
          )}
          {whatsappFallbackMessage && (
            <p role="status" className="text-sm text-[var(--color-text-secondary)]">
              {whatsappFallbackMessage}
            </p>
          )}
          {whatsappFallbackMessage && imageFile && (
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-green-600 hover:text-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              Download product image
            </button>
          )}

          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" onClick={closeDialog} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-700">f</span>
            Facebook
          </a>
          <a href={xUrl} target="_blank" rel="noopener noreferrer" onClick={closeDialog} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800">
            <span aria-hidden="true" className="text-base font-bold">X</span>
            Share on X
          </a>
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer" onClick={closeDialog} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">
            <Send aria-hidden="true" className="h-4 w-4" />
            Telegram
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-green-600 hover:text-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
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
            <label htmlFor={`product-share-message-${productId}`} className="mb-1 block text-sm font-semibold">
              Select and copy this {isDeal ? 'deal' : 'product'} message
            </label>
            <textarea
              ref={copyFallbackRef}
              id={`product-share-message-${productId}`}
              readOnly
              value={message}
              rows={6}
              aria-label={`${isDeal ? 'Deal' : 'Product'} share message to copy`}
              className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            />
          </div>
        )}
      </div>
    </dialog>
  )
}
