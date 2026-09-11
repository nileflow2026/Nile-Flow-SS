import { useState, useEffect, useMemo } from 'react'
import { getProducts } from '../../adminService'
import { toast } from 'sonner'
import {
  Search,
  Trash2,
  Edit,
  Clock,
  TrendingUp,
  Package,
  Filter,
} from 'lucide-react'
import axiosClient from '../../api'

const DealsManagement = () => {
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [analytics, setAnalytics] = useState(null)

  const categories = [
    { value: 'all', label: 'All Deals' },
    { value: 'product', label: 'Product Deals' },
    { value: 'flash', label: 'Flash Sales' },
    { value: 'premium', label: 'Premium Deals' },
  ]

  // Fetch deals and products on mount
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
    toast.info('Create deal form coming soon')
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

  const getBadgeColor = (type, discount) => {
    if (type === 'flash') return 'bg-red-500'
    if (type === 'premium') return 'bg-blue-500'
    if (discount >= 50) return 'bg-amber-500'
    if (discount >= 30) return 'bg-green-500'
    return 'bg-gray-500'
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
                {deal.isPremium && (
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
