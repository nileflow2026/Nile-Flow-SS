import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../api'

/**
 * Admin Banner Management Page
 * Allows admins to create, edit, and delete promotional banners
 */
function BannerManagement() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    cta: 'Learn more',
    ctaHref: '#',
    gradient: '',
    order: 0,
    isActive: true,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch banners on mount
  const loadBanners = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/api/v1/banners')
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
      setBanners(data)
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          formDataToSend.append(key, formData[key])
        }
      })
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }

      let result
      if (isEditing && editingId) {
        result = await axiosClient.patch(`/api/v1/banners/${editingId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setSuccessMsg('Banner updated successfully')
      } else {
        result = await axiosClient.post('/api/v1/banners', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setSuccessMsg('Banner created successfully')
      }

      if (result.status >= 200 && result.status < 300) {
        loadBanners()
        resetForm()
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err?.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      cta: 'Learn more',
      ctaHref: '#',
      gradient: '',
      order: 0,
      isActive: true,
    })
    setSelectedImage(null)
    setPreviewImage(null)
    setIsEditing(false)
    setEditingId(null)
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleEdit = (banner) => {
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      cta: banner.cta || 'Learn more',
      ctaHref: banner.ctaHref || '#',
      gradient: banner.gradient || '',
      order: banner.order || 0,
      isActive: banner.isActive !== false,
    })
    setIsEditing(true)
    setEditingId(banner.id)
    setPreviewImage(banner.image || null)
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return
    setLoading(true)
    try {
      await axiosClient.delete(`/api/v1/banners/${bannerId}`)
      setSuccessMsg('Banner deleted successfully')
      loadBanners()
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">Banner Management</h1>
        <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">Create and manage homepage promotional banners</p>
      </div>

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Form Section */}
      <div className="rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] p-6 mb-6">
        <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
          {isEditing ? 'Edit Banner' : 'Create New Banner'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
              Banner Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] px-4 py-2 text-sm text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
              Subtitle
            </label>
            <textarea
              name="subtitle"
              value={formData.subtitle}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] px-4 py-2 text-sm text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
                CTA Text
              </label>
              <input
                type="text"
                name="cta"
                value={formData.cta}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] px-4 py-2 text-sm text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
                CTA Link
              </label>
              <input
                type="text"
                name="ctaHref"
                value={formData.ctaHref}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] px-4 py-2 text-sm text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
                Gradient (optional)
              </label>
              <input
                type="text"
                name="gradient"
                value={formData.gradient}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] px-4 py-2 text-sm text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
                placeholder="from-emerald-600 via-emerald-500 to-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] px-4 py-2 text-sm text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-[#E8D6B5] dark:border-[#3A3A3A] text-[#27AE60] focus:ring-[#D4A017]"
            />
            <label htmlFor="isActive" className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
              Active
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
              Banner Image (optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] px-4 py-2 text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 hover:border-[#D4A017]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 5h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm10 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9z" />
                </svg>
                <span>{selectedImage ? selectedImage.name : 'Upload banner image'}</span>
              </div>
            </div>
            {previewImage && (
              <div className="mt-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] p-2 bg-white dark:bg-[#2A2A2A]">
                <img src={previewImage} alt="Banner preview" className="max-h-32 w-auto object-cover rounded" />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update Banner' : 'Create Banner')}
            </button>
            {(isEditing || selectedImage) && (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#2C1810] dark:text-[#F5E6D3] text-sm font-semibold hover:bg-[#E8D6B5]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Banners List */}
      <div className="rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] p-6">
        <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">Existing Banners</h3>
        {loading && banners.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A017]"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#E8D6B5] dark:border-[#3A3A3A] px-4 py-8 text-center">
            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">No banners found. Create one above!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="flex items-center gap-4 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] p-4 bg-[#FAF7F2] dark:bg-[#2A2A2A]"
              >
                {banner.image && (
                  <img
                    src={banner.image}
                    alt=""
                    className="h-16 w-24 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3]">{banner.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      banner.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-[#3A3A3A] dark:text-[#D4A017]/70'
                    }`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1 line-clamp-1">{banner.subtitle}</p>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-0.5">{banner.cta} → {banner.ctaHref}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] text-sm text-[#2C1810] dark:text-[#F5E6D3] hover:bg-[#E8D6B5]/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BannerManagement
