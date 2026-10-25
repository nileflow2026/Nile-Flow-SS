export const BUSINESS_PAGE_SIZE = 24
export const BUSINESS_HOME_LIMIT = 6
export const BUSINESS_IMAGE_FALLBACK = '/logo.png'

function optionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getBusinessLocation(business) {
  const city = optionalText(business.city)
  const country = optionalText(business.country)
  if (city && country) return `${city}, ${country}`
  return city || country || optionalText(business.location)
}

export function getBusinessDescriptionPreview(description, sentenceLimit = 2) {
  const text = optionalText(description)
  const sentences = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
  return (sentences || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, sentenceLimit)
    .join(' ')
}

export function normalizeBusiness(record) {
  const id = optionalText(record?.id || record?.$id)
  const name = optionalText(record?.storeName) || optionalText(record?.name)
  if (!id || !name) {
    throw new Error('The business response is missing its ID or store name.')
  }

  const category = optionalText(record.category)
  const location = getBusinessLocation(record)
  const description = optionalText(record.storeDescription)
  const imagePath =
    optionalText(record.coverImage) ||
    optionalText(record.profileImage) ||
    BUSINESS_IMAGE_FALLBACK
  const altParts = [name, category, location, description].filter(Boolean)

  return {
    id,
    vendorId: id,
    name,
    category,
    location,
    description,
    coverImagePath: imagePath,
    coverImageAlt: altParts.join('. '),
  }
}
