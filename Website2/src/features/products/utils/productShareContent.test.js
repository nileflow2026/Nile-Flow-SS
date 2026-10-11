import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createProductShareContent,
  getProductShareImageProxyUrl,
} from './productShareContent.js'

const shareOrigin = 'https://share.nileflowafrica.com'

test('formats ordinary product message with current display price and branded link', () => {
  const result = createProductShareContent({
    $id: 'product 1',
    productName: 'Canvas Tote',
    price: { basePrice: 1200, displayValue: 'UGX 33,000' },
    originalPrice: 1500,
    originalPriceDisplayValue: 'UGX 41,250',
  }, shareOrigin)

  assert.equal(result.isValid, true)
  assert.equal(result.shareUrl, 'https://share.nileflowafrica.com/share/product/product%201')
  assert.equal(result.offerText, [
    '✨ *Check out Canvas Tote*',
    '💰 Price: *UGX 33,000*',
    '🏷️ Was: UGX 41,250',
  ].join('\n'))
  assert.equal(result.message, `${result.offerText}\n\n🛒 *Shop now:* ${result.shareUrl}`)
})

test('uses page name and price fallbacks and omits unavailable original price', () => {
  const result = createProductShareContent({
    id: 'fallback-id',
    name: 'Market Basket',
    price: 1000,
    originalPrice: 1200,
  }, shareOrigin)

  assert.equal(result.isValid, true)
  assert.equal(result.productName, 'Market Basket')
  assert.equal(result.currentPrice, 'KSh 1,000')
  assert.equal(result.offerText.includes('Was:'), false)
})

test('rejects missing product IDs and invalid prices with the required messages', () => {
  const missingId = createProductShareContent({ price: 100 }, shareOrigin)
  assert.equal(missingId.isValid, false)
  assert.equal(missingId.validationMessage, 'This product link is unavailable and cannot be shared.')

  const missingPrice = createProductShareContent({ $id: 'product-1' }, shareOrigin)
  assert.equal(missingPrice.isValid, false)
  assert.equal(missingPrice.validationMessage, 'This product does not have a valid price and cannot be shared.')
})

test('ignores invalid and untrusted image URLs, then selects the first valid Appwrite image', () => {
  const result = createProductShareContent({
    $id: 'product-1',
    price: 100,
    image: 'http://cloud.appwrite.io/image.jpg',
    imageUrl: 'https://example.com/not-appwrite.jpg',
    images: [
      { url: 'https://fra.cloud.appwrite.io/first.jpg' },
      'https://cloud.appwrite.io/second.jpg',
    ],
  }, shareOrigin)

  assert.equal(result.imageUrl, 'https://fra.cloud.appwrite.io/first.jpg')
})

test('requests 2000 pixel images at quality 95 for sharing', () => {
  const requestUrl = new URL(
    getProductShareImageProxyUrl('https://cloud.appwrite.io/v1/storage/files/image/view'),
    'https://website.example',
  )
  assert.equal(requestUrl.searchParams.get('width'), '2000')
  assert.equal(requestUrl.searchParams.get('quality'), '95')
})
