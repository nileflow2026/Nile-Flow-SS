import { useState, useEffect, useMemo } from 'react'
import { getProducts } from '../../adminService'
import { toast } from 'sonner'
import {
  Search,
  Trash2,
  Edit,
  Clock,
  Package,
  Plus,
  X,
  Check,
} from 'lucide-react'
import axiosClient from '../../api'

const DealsManagement = () => {
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState('')
  const [dealType, setDealType] = useState('product') // 'product', 'premium', 'flash'

  // Form fields for regular deal creation
  const [selectedProduct, setSelectedProduct] = useState('')
  const [discount, setDiscount] = useState('')
  const [durationHours, setDurationHours] = useState('24')

  const categories = [
    { value: 'all', label: 'All Deals' },
    { value: 'product', label: 'Product Deals' },
    { value: 'flash', label: 'Flash Sales' },
    { value: 'premium', label: 'Premium Deals' },
  ]

  useEffect(() => {
    fetchDeals()
    fetchProducts()
    fetchAnalytics()
  }, [filter])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const response = await axiosClient.get('/api/admin/deals', {
        params: filter !== 'all' ? { type: filter } : {},
      })
      setDeals(response.data?.deals || [])
    } catch (error) {
      console.error('Failed to fetch deals:', error)
      toast.error('Could not load deals')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const allProducts = await getProducts()
      setProducts(allProducts)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await axiosClient.get('/api/admin/deals/analytics')
      setAnalytics(response.data?.analytics || null)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (filter !== 'all' && d.type !== filter) return false
      if (search && !d.productName?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [deals, filter, search])

  const handleCreateDeal = () => {
    setShowForm(true)
    setFormStatus('')
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setFormStatus('')
    setSelectedProduct('')
    setDiscount('')
    setDurationHours('24')
  }

  const handleSubmitDeal = async (e) => {
    e.preventDefault()
    if (!selectedProduct || !discount) {
      setFormStatus({ type: 'error', text: 'Please fill in all required fields.' })
      return
    }

    setSubmitting(true)
    setFormStatus(null)

    try {
      // Get selected product details
      const product = products.find(p => p.$id === selectedProduct)
      if (!product) {
        setFormStatus({ type: 'error', text: 'Selected product not found.' })
        setSubmitting(false)
        return
      }

      const discountPercent = parseFloat(discount)
      const originalPrice = parseFloat(product.price)
      const dealPrice = originalPrice * (1 - discountPercent / 100)

      // Create deal via API
      const payload = {
        productId: selectedProduct,
        productName: product.productName,
        price: originalPrice,
        dealPrice: dealPrice,
        discount: discountPercent,
        category: product.category || 'general',
        image: product.image,
        images: product.images,
        description: product.description || '',
        durationHours: parseInt(durationHours) || 24,
        isFlash: dealType === 'flash',
        premiumDeal: dealType === 'premium',
        active: true,
      }

      const response = await axiosClient.post('/api/admin/deals', payload)

      setDeals(prev => [response.data.deal, ...prev])
      setFormStatus({ type: 'success', text: 'Deal created successfully!' })
      toast.success('Deal created')

      // Reset form and close after delay
      setTimeout(() => {
        handleCloseForm()
      }, 1500)
    } catch (error) {
      console.error('Failed to create deal:', error)
      setFormStatus({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create deal. Product may already have an active deal.'
      })
      toast.error(error.response?.data?.error || 'Failed to create deal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditDeal = async (deal) => {
    try {
      const response = await axiosClient.patch(`/api/admin/deals/${deal.$id}`, {
        discount: deal.discount,
        dealPrice: deal.dealPrice,
        durationHours: deal.durationHours,
      })
      setDeals((prev) => prev.map((d) => d.$id === deal.$id ? { ...d, ...response.data?.deal } : d))
      toast.success('Deal updated')
    } catch (error) {
      console.error('Failed to update deal:', error)
      toast.error('Failed to update deal')
    }
  }

  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return
    try {
      await axiosClient.delete(`/api/admin/deals/${dealId}`)
      setDeals((prev) => prev.filter((d) => d.$id !== dealId))
      toast.success('Deal deleted')
    } catch (error) {
      console.error('Failed to delete deal:', error)
      toast.error('Failed to delete deal')
    }
  }

  const getTimeDisplay = (endTime) => {
    if (!endTime) return 'No deadline'
    const diff = new Date(endTime) - new Date()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">Deal Management</h1>
          <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
            Create and manage flash sales, premium deals, and product discounts
          </p>
        </div>
        <button
          onClick={handleCreateDeal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] text-white font-semibold hover:shadow-lg transition-all duration-200"
        >
          <Package className="w-4 h-4" />
          Create New Deal
        </button>
      </div>

      {/* Create Deal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] w-full max-w-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E8D6B5] dark:border-[#3A3A3A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">Create New Deal</h2>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    {dealType === 'flash' ? '⚡ Flash Sale' : dealType === 'premium' ? '⭐ Premium Deal' : '🏷️ Product Deal'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-2 rounded-full hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
              >
                <X className="w-5 h-5 text-[#8B4513]/70 dark:text-[#D4A017]/70" />
              </button>
            </div>

            {/* Deal Type Selector */}
            <div className="p-5 border-b border-[#E8D6B5] dark:border-[#3A3A3A]">
              <p className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-3">Deal Type</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'product', label: 'Product Deal', icon: '🏷️' },
                  { value: 'premium', label: 'Premium', icon: '⭐' },
                  { value: 'flash', label: 'Flash Sale', icon: '⚡' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setDealType(type.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      dealType === type.value
                        ? 'bg-gradient-to-r from-[#D4A017] to-[#8B6914] text-white shadow-md'
                        : 'bg-[#FAF7F2] dark:bg-[#1A1A1A] border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#2C1810] dark:text-[#F5E6D3] hover:border-[#D4A017]'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitDeal} className="p-5 space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                  Select Product *
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                  required
                >
                  <option value="">-- Choose a product --</option>
                  {products.map((product) => (
                    <option key={product.$id} value={product.$id}>
                      {product.productName} - Ksh {parseFloat(product.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                  Discount Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Enter discount %"
                    className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 pr-10"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B4513]/70 dark:text-[#D4A017]/70 font-semibold">%</span>
                </div>
              </div>

              {/* Duration Hours */}
              <div>
                <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                  Duration (hours)
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#1A1A1A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                >
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours (3 days)</option>
                  <option value="168">168 hours (7 days)</option>
                </select>
              </div>

              {/* Status Message */}
              {formStatus && (
                <div className={`flex items-center gap-2 p-3 rounded-xl ${
                  formStatus.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {formStatus.type === 'error' ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <p className="text-sm font-medium">{formStatus.text}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !selectedProduct || !discount}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create {dealType === 'flash' ? 'Flash Sale' : dealType === 'premium' ? 'Premium Deal' : 'Product Deal'}
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] p-4">
            <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">Total Deals</p>
            <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mt-1">{analytics.total}</p>
          </div>
          <div className="rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] p-4">
            <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">Flash Sales</p>
            <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mt-1">{analytics.flashSales}</p>
          </div>
          <div className="rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] p-4">
            <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">Premium Deals</p>
            <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mt-1">{analytics.premiumDeals}</p>
          </div>
          <div className="rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] p-4">
            <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">Best Value</p>
            <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mt-1">{analytics.bestValue}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              cat.value === filter
                ? 'bg-gradient-to-r from-[#D4A017] to-[#8B6914] text-white'
                : 'bg-white dark:bg-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#2C1810] dark:text-[#F5E6D3] hover:border-[#D4A017]'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/50 dark:text-[#D4A017]/50" />
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-sm text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
          />
        </div>
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8D6B5] border-t-[#D4A017]"></div>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A]">
          <Package className="w-12 h-12 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">No deals found</h3>
          <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2">
            Try adjusting your filters or create a new deal
          </p>
          <button
            onClick={handleCreateDeal}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] text-white font-semibold hover:shadow-lg transition-all duration-200"
          >
            <Package className="w-4 h-4" />
            Create New Deal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => (
            <div
              key={deal.$id}
              className="relative rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {deal.isFlash && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                    ⚡ Flash
                  </span>
                )}
                {deal.premiumDeal && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                    PREMIUM
                  </span>
                )}
                {deal.discount >= 40 && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                    BEST VALUE
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center text-white font-bold">
                  {deal.productName?.[0] || 'P'}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">{deal.category}</p>
                  <p className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mt-0.5">
                    {deal.productName}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#D4A017]">{deal.dealPrice}</span>
                  <span className="text-sm text-[#8B4513]/50 line-through">{deal.price}</span>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  {deal.discount}% OFF
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                <Clock className="w-3 h-3" />
                <span>Ends in: {getTimeDisplay(deal.dealEndTime)}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEditDeal(deal)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-[#E8D6B5] dark:border-[#3A3A3A] text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteDeal(deal.$id)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-full border border-red-500/30 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DealsManagement
