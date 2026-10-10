import { imageProxyUrl } from '../../../api/config/index.js'

const DEAL_SHARE_IMAGE_WIDTH = 2000
const DEAL_SHARE_IMAGE_QUALITY = 95

function formatDealSharePrice(value) {
  return `KES ${value.toLocaleString()}`
}

export function getDealShareImageProxyUrl(imageUrl) {
  return imageProxyUrl(imageUrl, DEAL_SHARE_IMAGE_WIDTH, DEAL_SHARE_IMAGE_QUALITY)
}

export function createDealShareContent(product, discount, shareOrigin) {
  const productId = typeof product.$id === 'string' ? product.$id.trim() : ''
  const activeDeal = product.isDeal === true
  const dealPriceValid = typeof product.dealPrice === 'number' && Number.isFinite(product.dealPrice)
  const originalPriceValid = typeof product.price === 'number' && Number.isFinite(product.price)
  const discountValid = typeof discount === 'number'
    && Number.isFinite(discount)
    && typeof product.discount === 'number'
    && Number.isFinite(product.discount)
  const hasExpiry = product.endTime !== null && product.endTime !== undefined
  const expiryTimestamp = hasExpiry ? new Date(product.endTime).getTime() : null
  const expiryValid = !hasExpiry || Number.isFinite(expiryTimestamp)
  const isExpired = expiryValid && expiryTimestamp !== null && expiryTimestamp <= Date.now()
  let dealUrl = ''
  if (productId) {
    dealUrl = new URL(
      `/share/deal/${encodeURIComponent(productId)}`,
      shareOrigin,
    ).toString()
  }
  const expiryText = expiryValid && expiryTimestamp !== null
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(expiryTimestamp))
    : null
  const offerText = [
    '✨ *DEAL ALERT*',
    `🛍️ *${product.productName || 'this deal'}*`,
    `💸 Now *${dealPriceValid ? formatDealSharePrice(product.dealPrice) : ''}* (was ${originalPriceValid ? formatDealSharePrice(product.price) : ''})`,
    `🔥 *Save ${discountValid ? `${discount}%` : ''}*`,
    expiryText ? `⏰ Ends ${expiryText}` : null,
  ].filter(Boolean).join('\n')
  const message = `${offerText}\n\n🛒 *Shop now:* ${dealUrl}`
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
