import { httpClient } from '@api/client/HttpClient'
import { BUSINESS_PAGE_SIZE, normalizeBusiness } from '@features/businesses/data/businesses'

const BASE = '/api/customerprofile/businesses'

function getBusinessPage(data) {
  if (
    !data ||
    !Array.isArray(data.businesses) ||
    !Array.isArray(data.categories) ||
    !data.pagination
  ) {
    throw new Error('The business directory response is incomplete.')
  }

  if (!data.categories.every((category) => typeof category === 'string')) {
    throw new Error('The business category response is invalid.')
  }

  return {
    businesses: data.businesses.map(normalizeBusiness),
    categories: data.categories,
    pagination: data.pagination,
  }
}

export const businessService = {
  async getBusinesses({ page = 1, limit = BUSINESS_PAGE_SIZE, category } = {}) {
    const params = { page, limit }
    if (category) params.category = category

    const response = await httpClient.get(BASE, params)
    return getBusinessPage(response.data)
  },

  async getBusiness(businessId) {
    if (!businessId) {
      throw new Error('A business ID is required.')
    }

    const response = await httpClient.get(`${BASE}/${encodeURIComponent(businessId)}`)
    const business = response.data?.business
    if (!business) {
      throw new Error('The business profile response is incomplete.')
    }
    return normalizeBusiness(business)
  },
}

export default businessService
