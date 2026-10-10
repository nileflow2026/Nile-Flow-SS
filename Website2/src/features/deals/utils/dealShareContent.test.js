import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDealShareContent,
  getDealShareImageProxyUrl,
} from './dealShareContent.js'

const shareOrigin = 'https://share.nileflowafrica.com'
const deal = {
  $id: 'deal 1',
  isDeal: true,
  productName: 'White Dodgers Cap',
  dealPrice: 1350,
  price: 1500,
  discount: 10,
}

test('formats the full deal message with localized expiry and branded link', () => {
  const expiry = new Date(Date.now() + 60_000).toISOString()
  const result = createDealShareContent(
    { ...deal, endTime: expiry },
    deal.discount,
    shareOrigin,
  )
  const formattedExpiry = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(expiry))

  assert.equal(result.isValid, true)
  assert.equal(
    result.dealUrl,
    'https://share.nileflowafrica.com/share/deal/deal%201',
  )
  assert.equal(
    result.offerText,
    [
      '✨ *DEAL ALERT*',
      '🛍️ *White Dodgers Cap*',
      '💸 Now *KES 1,350* (was KES 1,500)',
      '🔥 *Save 10%*',
      `⏰ Ends ${formattedExpiry}`,
    ].join('\n'),
  )
  assert.equal(
    result.message,
    `${result.offerText}\n\n🛒 *Shop now:* ${result.dealUrl}`,
  )
})

test('omits expiry and falls back to a generic product name when absent', () => {
  const result = createDealShareContent(
    { ...deal, productName: '', endTime: null },
    deal.discount,
    shareOrigin,
  )

  assert.equal(result.isValid, true)
  assert.equal(
    result.offerText,
    [
      '✨ *DEAL ALERT*',
      '🛍️ *this deal*',
      '💸 Now *KES 1,350* (was KES 1,500)',
      '🔥 *Save 10%*',
    ].join('\n'),
  )
  assert.equal(result.message.includes('⏰ Ends'), false)
  assert.equal(result.message.includes('only'), false)
})

test('keeps invalid deals disabled while retaining the formatted offer fallback', () => {
  const result = createDealShareContent(
    { ...deal, dealPrice: Number.NaN, endTime: 'not a date' },
    deal.discount,
    shareOrigin,
  )

  assert.equal(result.isValid, false)
  assert.equal(
    result.validationMessage,
    'This deal is missing valid offer details and cannot be shared.',
  )
  assert.match(result.message, /^✨ \*DEAL ALERT\*/)
})

test('treats an empty expiry value as invalid rather than as no expiry', () => {
  const result = createDealShareContent(
    { ...deal, endTime: '' },
    deal.discount,
    shareOrigin,
  )

  assert.equal(result.isValid, false)
  assert.equal(
    result.validationMessage,
    'This deal has an invalid expiry time and cannot be shared.',
  )
})

test('requests the maximum supported size and high quality for shared images', () => {
  const requestUrl = new URL(
    getDealShareImageProxyUrl('https://cloud.appwrite.io/v1/storage/files/image/view'),
  )

  assert.equal(requestUrl.searchParams.get('width'), '2000')
  assert.equal(requestUrl.searchParams.get('quality'), '95')
})
