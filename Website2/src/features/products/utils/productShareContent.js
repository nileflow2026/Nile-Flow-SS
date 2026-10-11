import { imageProxyUrl } from '../../../api/config/index.js'

const APPWRITE_IMAGE_HOSTS = new Set([
  'fra.cloud.appwrite.io',
  'cloud.appwrite.io',
])

function getProductId(product) {
  for (const value of [product?.$id, product?.productId, product?.id]) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function getCatalogPrice(product) {
  const price = product?.price
  if (price && typeof price === 'object') {
    return typeof price.basePrice === 'number' && Number.isFinite(price.basePrice)
      ? price.basePrice
      : null
  }
  return typeof price === 'number' && Number.isFinite(price) ? price : null
}

function getDisplayedPrice(product) {
  if (product?.displayPrice) return String(product.displayPrice)
  const price = product?.price
  if (typeof price === 'number') return `KSh ${Math.round(price).toLocaleString()}`
  if (price && typeof price === 'object' && price.displayValue) {
    return String(price.displayValue)
  }
  if (typeof price === 'string') return price
  return ''
}

export function getProductShareImageUrl(product) {
  const candidates = [
    product?.image,
    product?.imageUrl,
    ...(Array.isArray(product?.images) ? product.images : []),
  ]

  for (const candidate of candidates) {
    let image = candidate
    if (typeof image === 'string') {
      try {
        const parsed = JSON.parse(image)
        if (parsed && typeof parsed === 'object') image = parsed
      } catch {
        // Non JSON strings are already image URLs.
      }
    }
    if (image && typeof image === 'object') {
      image = image.url || image.imageUrl || image.href
    }
    if (typeof image !== 'string') continue

    try {
      const url = new URL(image)
      if (
        url.protocol === 'https:' &&
        APPWRITE_IMAGE_HOSTS.has(url.hostname) &&
        !url.username &&
        !url.password
      ) {
        return url.toString()
      }
    } catch {
      // Ignore malformed and non absolute image URLs.
    }
  }
  return null
}

export function getProductShareImageProxyUrl(imageUrl) {
  return imageProxyUrl(imageUrl, 2000, 95)
}

export function createProductShareContent(product, shareOrigin) {
  const productId = getProductId(product)
  const productName = [product?.productName, product?.name, product?.title]
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim() || 'Product'
  const catalogPrice = getCatalogPrice(product)
  const currentPrice = getDisplayedPrice(product)
  const shareUrl = productId
    ? new URL(`/share/product/${encodeURIComponent(productId)}`, shareOrigin).toString()
    : ''
  const originalPrice =
    typeof product?.originalPrice === 'number' &&
    Number.isFinite(product.originalPrice) &&
    catalogPrice !== null &&
    product.originalPrice > catalogPrice &&
    typeof product.originalPriceDisplayValue === 'string' &&
    product.originalPriceDisplayValue.trim()
      ? product.originalPriceDisplayValue.trim()
      : ''
  const offerText = [
    `✨ *Check out ${productName}*`,
    `💰 Price: *${currentPrice}*`,
    originalPrice ? `🏷️ Was: ${originalPrice}` : null,
  ].filter(Boolean).join('\n')
  const message = `${offerText}\n\n🛒 *Shop now:* ${shareUrl}`
  let validationMessage = ''

  if (!productId) {
    validationMessage = 'This product link is unavailable and cannot be shared.'
  } else if (catalogPrice === null || !currentPrice.trim()) {
    validationMessage = 'This product does not have a valid price and cannot be shared.'
  }

  return {
    catalogPrice,
    currentPrice,
    imageUrl: getProductShareImageUrl(product),
    message,
    offerText,
    productId,
    productName,
    shareUrl,
    validationMessage,
    isValid: Boolean(productId && catalogPrice !== null && currentPrice.trim()),
  }
}
