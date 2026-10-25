import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BUSINESS_HOME_LIMIT,
  BUSINESS_IMAGE_FALLBACK,
  BUSINESS_PAGE_SIZE,
  getBusinessDescriptionPreview,
  getBusinessLocation,
  normalizeBusiness,
} from './businesses.js'
import { generateMainSitemap, STATIC_ROUTES } from '../../../shared/seo/SitemapGenerator.js'

test('uses live business page limits for directory and home requests', () => {
  assert.equal(BUSINESS_HOME_LIMIT, 6)
  assert.equal(BUSINESS_PAGE_SIZE, 24)
})

test('maps public vendor fields to a business card and profile record', () => {
  const business = normalizeBusiness({
    id: 'vendor-id',
    name: 'Owner name',
    storeName: 'Market name',
    storeDescription: 'Fresh food and pantry products.',
    category: 'Food & Groceries',
    city: 'Juba',
    country: 'South Sudan',
    coverImage: 'https://images.example/cover.jpg',
    profileImage: 'https://images.example/profile.jpg',
  })

  assert.deepEqual(business, {
    id: 'vendor-id',
    vendorId: 'vendor-id',
    name: 'Market name',
    category: 'Food & Groceries',
    location: 'Juba, South Sudan',
    description: 'Fresh food and pantry products.',
    coverImagePath: 'https://images.example/cover.jpg',
    coverImageAlt: 'Market name. Food & Groceries. Juba, South Sudan. Fresh food and pantry products.',
  })
})

test('uses available public fallbacks for missing names, location, and images', () => {
  const business = normalizeBusiness({
    $id: 'vendor-id',
    name: 'Owner name',
    location: 'Central Juba',
    profileImage: 'https://images.example/profile.jpg',
  })

  assert.equal(business.name, 'Owner name')
  assert.equal(business.location, 'Central Juba')
  assert.equal(business.category, '')
  assert.equal(business.coverImagePath, 'https://images.example/profile.jpg')
  assert.equal(getBusinessLocation({ city: 'Juba' }), 'Juba')
  assert.equal(normalizeBusiness({ id: 'vendor-id', name: 'Store' }).coverImagePath, BUSINESS_IMAGE_FALLBACK)
})

test('limits business card descriptions to two sentences', () => {
  assert.equal(
    getBusinessDescriptionPreview('First sentence. Second sentence! Third sentence?'),
    'First sentence. Second sentence!',
  )
  assert.equal(
    getBusinessDescriptionPreview('First sentence. Second sentence! Third sentence?', 1),
    'First sentence.',
  )
  assert.equal(getBusinessDescriptionPreview('One sentence'), 'One sentence')
  assert.equal(getBusinessDescriptionPreview('  '), '')
})

test('rejects a vendor response that cannot identify a business', () => {
  assert.throws(
    () => normalizeBusiness({ id: 'vendor-id' }),
    /missing its ID or store name/,
  )
  assert.throws(
    () => normalizeBusiness({ name: 'Store name' }),
    /missing its ID or store name/,
  )
})

test('keeps directory and live profile paths out of the static sitemap', () => {
  const sitemap = generateMainSitemap()

  assert.ok(!STATIC_ROUTES.some((route) => route.path === '/businesses'))
  assert.ok(!sitemap.includes('/businesses'))
})
