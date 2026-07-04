/**
 * API Type Definitions
 *
 * Shared types for the API integration layer.
 * These define the contract between services and consumers.
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [message]
 * @property {string} [code]
 * @property {Array<{field?: string, message: string}>} [errors]
 * @property {number} [status]
 * @property {*} [raw]
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {boolean} success
 * @property {Array} data
 * @property {PaginationMeta} [meta]
 * @property {number} [total]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string|null} [nextCursor]
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} [accessToken]
 * @property {string} [refreshToken]
 * @property {number} [expiresIn]
 * @property {string} [tokenType]
 */

/**
 * @typedef {Object} User
 * @property {string} $id
 * @property {string} email
 * @property {string} [name]
 * @property {string} [username]
 * @property {string} [phone]
 * @property {boolean} [emailVerified]
 * @property {string} [avatarUrl]
 * @property {boolean} [isPremium]
 * @property {string} [subscriptionExpiresAt]
 * @property {Object} [prefs]
 */

/**
 * @typedef {Object} Product
 * @property {string} $id
 * @property {string} productName
 * @property {number} price
 * @property {string} [description]
 * @property {string} [image]
 * @property {Array<string>} [images]
 * @property {string} [category]
 * @property {string} [vendorId]
 * @property {string} [vendorName]
 * @property {number} [stock]
 * @property {number} [ratings]
 * @property {number} [ratingsCount]
 * @property {boolean} [featured]
 * @property {boolean} [premiumEligible]
 * @property {boolean} [premiumDeal]
 * @property {number} [premiumPrice]
 * @property {Array<string>} [tags]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} CartItem
 * @property {string} $id
 * @property {string} userId
 * @property {string} productId
 * @property {string} productName
 * @property {number} price
 * @property {string} [image]
 * @property {number} quantity
 * @property {string} [userName]
 */

/**
 * @typedef {Object} Order
 * @property {string} $id
 * @property {string} userId
 * @property {Array<OrderItem>} items
 * @property {number} totalAmount
 * @property {number} [discountAmount]
 * @property {string} status
 * @property {string} [paymentMethod]
 * @property {string} [paymentStatus]
 * @property {Object} [shippingAddress]
 * @property {string} [trackingId]
 * @property {string} [riderId]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} productId
 * @property {string} productName
 * @property {number} price
 * @property {number} quantity
 * @property {string} [image]
 */

/**
 * @typedef {Object} Category
 * @property {string} $id
 * @property {string} name
 * @property {string} [slug]
 * @property {string} [description]
 * @property {string} [image]
 * @property {string} [parentId]
 * @property {number} [productCount]
 * @property {number} [sortOrder]
 */

/**
 * @typedef {Object} Review
 * @property {string} $id
 * @property {string} productId
 * @property {string} userId
 * @property {string} userName
 * @property {number} rating
 * @property {string} [reviewText]
 * @property {string} [image]
 * @property {Array<string>} [images]
 * @property {string} [parentReviewId]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} Notification
 * @property {string} $id
 * @property {string} userId
 * @property {string} message
 * @property {string} [type]
 * @property {string} [description]
 * @property {boolean} [read]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} Address
 * @property {string} $id
 * @property {string} userId
 * @property {string} address
 * @property {string} phone
 * @property {string} city
 * @property {string} [state]
 * @property {string} [postalCode]
 * @property {string} [type]
 * @property {string} [fullName]
 * @property {boolean} [isDefault]
 */

/**
 * @typedef {Object} PremiumStatus
 * @property {boolean} isPremium
 * @property {string} [expiresAt]
 * @property {string} [subscriptionId]
 * @property {string} [startedAt]
 * @property {string} [cancelledAt]
 */

/**
 * @typedef {Object} NileMiles
 * @property {number} totalMiles
 * @property {number} earnedMiles
 * @property {number} redeemedMiles
 * @property {number} currentMultiplier
 * @property {Array<MilesTransaction>} [history]
 */

/**
 * @typedef {Object} MilesTransaction
 * @property {string} $id
 * @property {string} source
 * @property {number} amount
 * @property {string} type
 * @property {string} [description]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} SubscriptionPlan
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {string} currency
 * @property {string} interval
 * @property {Array<string>} benefits
 */

/**
 * @typedef {Object} GroupBuy
 * @property {string} $id
 * @property {string} productId
 * @property {string} creatorId
 * @property {number} maxParticipants
 * @property {number} currentParticipants
 * @property {number} basePrice
 * @property {number} [currentPrice]
 * @property {string} [priceStrategy]
 * @property {Array} [tiers]
 * @property {number} ttlHours
 * @property {string} status
 * @property {string} [productName]
 * @property {string} [productImage]
 * @property {string} [expiresAt]
 * @property {Array<Participant>} [participants]
 */

/**
 * @typedef {Object} Participant
 * @property {string} userId
 * @property {string} [userName]
 * @property {string} [joinedAt]
 * @property {string} role
 */

/**
 * @typedef {Object} UploadResult
 * @property {boolean} success
 * @property {string} [imageUrl]
 * @property {string} [fileId]
 * @property {string} [error]
 */

/**
 * @typedef {Object} SearchResult
 * @property {Array<Product>} products
 * @property {Array<Category>} [categories]
 * @property {number} total
 * @property {string|null} [nextCursor]
 * @property {Array<string>} [suggestions]
 */

/**
 * @typedef {Object} CurrencyRate
 * @property {string} code
 * @property {string} symbol
 * @property {string} locale
 * @property {number} rate
 * @property {number} [decimals]
 */

/**
 * @typedef {Object} PaymentIntent
 * @property {string} id
 * @property {number} amount
 * @property {string} currency
 * @property {string} status
 * @property {string} [clientSecret]
 * @property {string} [checkoutUrl]
 * @property {string} [checkoutRequestId]
 */

/**
 * @typedef {Object} ApiError
 * @property {string} code
 * @property {string} message
 * @property {number} [status]
 * @property {Array<{field?: string, message: string}>} [details]
 * @property {*} [originalError]
 */

/**
 * @typedef {('idle'|'loading'|'success'|'error')} AsyncStatus
 */

/**
 * @typedef {Object} AsyncState
 * @property {AsyncStatus} status
 * @property {*} [data]
 * @property {ApiError|null} [error]
 */

export {};
