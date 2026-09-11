import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Badge from '@shared/ui/badge/Badge'
import Loader from '@shared/ui/loader/Loader'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import Alert from '@shared/ui/alert/Alert'
import { useAuth } from '@auth/AuthContext'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { bannerService } from '@api/services'
import { productService } from '@api/services'

/**
 * Admin Banner Management Page
 * Allows admins to create, edit, and delete promotional banners
 */
function BannerManagement() {
  const { isAuthenticated } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    cta: 'Learn more',
    ctaHref: '#',
    image: null,
    gradient: '',
    order: 0,
    isActive: true,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [products, setProducts] = useState([])

  // Fetch banners on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    loadBanners()
    loadProducts()
  }, [isAuthenticated, navigate])

  const loadBanners = useCallback(async () => {
    setLoading(true)
    try {
      const data = await bannerService.getBanners()
      setBanners(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err?.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const result = await productService.getProducts({ limit: 50 })
      setProducts(Array.isArray(result.products) ? result.products : [])
    } catch {
      setProducts([])
    }
  }, [])

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
    setLoading(true)

    const payload = {
      title: formData.title || '',
      subtitle: formData.subtitle || '',
      cta: formData.cta || 'Learn more',
      ctaHref: formData.ctaHref || '#',
      gradient: formData.gradient || null,
      order: parseInt(formData.order, 10) || 0,
      isActive: formData.isActive !== false,
    }

    try {
      if (isEditing && editingId) {
        const result = await bannerService.updateBanner(editingId, payload, selectedImage)
        if (result.success) {
          push({ title: 'Banner updated', message: 'Banner updated successfully' })
          setIsEditing(false)
          setEditingId(null)
          setSelectedImage(null)
          setPreviewImage(null)
          loadBanners()
        } else {
          push({ title: 'Update failed', message: result.error || 'Please try again.' })
        }
      } else {
        const result = await bannerService.createBanner(payload, selectedImage)
        if (result.success) {
          push({ title: 'Banner created', message: 'New banner created successfully' })
          loadBanners()
          resetForm()
        } else {
          push({ title: 'Creation failed', message: result.error || 'Please try again.' })
        }
      }
    } catch (err) {
      push({ title: 'Error', message: err.message || 'Operation failed' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      cta: 'Learn more',
      ctaHref: '#',
      image: null,
      gradient: '',
      order: 0,
      isActive: true,
    })
    setSelectedImage(null)
    setPreviewImage(null)
    setIsEditing(false)
    setEditingId(null)
  }

  const handleEdit = (banner) => {
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      cta: banner.cta || 'Learn more',
      ctaHref: banner.ctaHref || '#',
      image: banner.image || null,
      gradient: banner.gradient || '',
      order: banner.order || 0,
      isActive: banner.isActive !== false,
    })
    setIsEditing(true)
    setEditingId(banner.id)
    setPreviewImage(banner.image || null)
  }

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return
    setLoading(true)
    try {
      const result = await bannerService.deleteBanner(bannerId)
      if (result.success) {
        push({ title: 'Banner deleted', message: 'Banner removed successfully' })
        loadBanners()
      } else {
        push({ title: 'Delete failed', message: result.error || 'Please try again.' })
      }
    } catch (err) {
      push({ title: 'Error', message: err.message || 'Operation failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
  }

  // Loading state
  if (loading && !banners.length) {
    return (
      <PageShell>
        <div className="responsive-shell flex min-h-[60vh] items-center justify-center py-14">
          <Loader label="Loading banners…" />
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        <ResponsiveSection eyebrow="Banners" title="Manage Banners">
          <EmptyState
            title="Failed to load banners"
            description={error}
            icon="⚠️"
            action={<Link to="/admin"><PrimaryButton>Back to admin</PrimaryButton></Link>}
          />
        </ResponsiveSection>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <SeoHead title="Manage Banners — Admin" robots="noindex,follow" />
      <ResponsiveSection eyebrow="Admin" title="Banner Management">
        {/* Form Section */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] mb-8">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            {isEditing ? 'Edit Banner' : 'Create New Banner'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Banner Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Subtitle
              </label>
              <textarea
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                CTA Text
              </label>
              <input
                type="text"
                name="cta"
                value={formData.cta}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                CTA Link
              </label>
              <input
                type="text"
                name="ctaHref"
                value={formData.ctaHref}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Gradient (optional — e.g., from-emerald-600 via-emerald-500 to-teal-400)
              </label>
              <input
                type="text"
                name="gradient"
                value={formData.gradient}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="from-emerald-600 via-emerald-500 to-teal-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-[var(--color-border)] text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isActive" className="text-sm text-[var(--color-text-secondary)]">
                Active
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Banner Image (optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:border-emerald-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 5h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm10 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9zm-4 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9zm-4 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9z" />
                  </svg>
                  <span>{selectedImage ? selectedImage.name : 'Upload banner image'}</span>
                </div>
              </div>
              {previewImage && (
                <div className="mt-2 rounded-lg border border-[var(--color-border)] p-2 bg-[var(--color-surface-muted)]">
                  <img src={previewImage} alt="Banner preview" className="max-h-32 w-auto object-cover rounded" />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <PrimaryButton
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {isEditing ? 'Update Banner' : 'Create Banner'}
              </PrimaryButton>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Banners List */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Existing Banners</h3>
          {banners.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No banners found. Create one above!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {banner.image && (
                        <img
                          src={banner.image}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{banner.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{banner.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={banner.isActive ? 'success' : 'neutral'}
                      className="text-xs"
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleEdit(banner)}
                      className="px-3 py-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleDelete(banner.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default BannerManagement
