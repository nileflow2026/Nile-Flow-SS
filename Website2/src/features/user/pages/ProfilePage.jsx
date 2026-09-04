import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { useAuth } from '@auth/AuthContext'
import { addressService, notificationService, orderService } from '@api/services'
import { httpClient } from '@api/client/HttpClient'
import { imageProxyUrl } from '@api/config'
import { useToast } from '@shared/ui/toast/ToastProvider'

function ProfilePage() {
  const { user, authService } = useAuth()
  const { push } = useToast()
  const fileInputRef = useRef(null)
  const [profile, setProfile] = useState(user)
  const [stats, setStats] = useState({ orders: 0, addresses: 0, notifications: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    let active = true

    const loadProfileData = async () => {
      setLoadingStats(true)
      const userId = user?.$id || user?.id || user?.userId
      const [session, orders, addresses, notifications, milesResponse] = await Promise.all([
        authService.validateSession(),
        orderService.getOrders(),
        addressService.getAddresses(),
        notificationService.getNotifications(),
        userId
          ? httpClient.get(`/api/nilemiles/nilemiles/status?userId=${encodeURIComponent(userId)}&_=${Date.now()}`, {}, {
            headers: { 'Cache-Control': 'no-cache' },
          }).catch(() => ({ data: null }))
          : Promise.resolve({ data: null }),
      ])

      if (!active) return
      const statusMiles = Number(milesResponse?.data?.currentMiles)
      const sessionMiles = Number(session?.user?.nileMiles)
      const miles = Number.isFinite(statusMiles) ? statusMiles : sessionMiles
      if (session?.user || miles !== undefined) {
        setProfile((current) => ({
          ...current,
          ...(session?.user || {}),
          ...(miles !== undefined ? { nileMiles: Number(miles) } : {}),
        }))
      }
      setStats({
        orders: orders.length,
        addresses: addresses.length,
        notifications: notifications.filter((notification) => !notification.read).length,
      })
      setLoadingStats(false)
    }

    loadProfileData()
    return () => { active = false }
  }, [authService, user])

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      push({ title: 'Invalid image', message: 'Please select an image file.' })
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)
    formData.append('userId', profile?.$id || profile?.id || profile?.userId || '')

    try {
      const response = await httpClient.upload('/api/customerprofile/updatedAvatar', formData)
      const avatarUrl = response.data?.avatarUrl
      if (avatarUrl) {
        setProfile((current) => ({ ...current, avatarUrl }))
        push({ title: 'Profile picture updated', message: 'Your new profile picture is now saved.' })
      } else {
        throw new Error('The uploaded image URL was not returned.')
      }
    } catch (error) {
      push({ title: 'Upload failed', message: error?.message || 'Could not update your profile picture.' })
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const name = profile?.name || profile?.username || profile?.email?.split('@')[0] || 'User'
  const email = profile?.email || ''
  const phone = profile?.phone || ''
  const nileMiles = Number(profile?.nileMiles ?? profile?.totalMilesEarned ?? 0)
  const avatarValue = profile?.avatarUrl || profile?.avatar || profile?.profileImage || ''
  const avatarSource = typeof avatarValue === 'object'
    ? avatarValue.url || avatarValue.imageUrl || avatarValue.href || ''
    : avatarValue
  const avatarUrl = avatarSource.includes('appwrite.io') ? imageProxyUrl(avatarSource, 192, 80) : avatarSource
  const initials = (name?.charAt(0) || 'U').toUpperCase()

  const rawJoined = profile?.createdAt || profile?.$registration || profile?.registration || null
  const joined = rawJoined
    ? new Date(rawJoined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null

  return (
    <PageShell>
      <ResponsiveSection  title="Your account" description="Manage your personal information and view account activity." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-[var(--shadow-sm)] sm:h-24 sm:w-24 sm:text-3xl">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = '/logo.png'
                      }}
                    />
                  ) : initials}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white shadow-sm disabled:opacity-60">
                  {uploadingAvatar ? '...' : 'Change'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{name}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{email}</p>
                {phone && <p className="text-sm text-[var(--color-text-muted)]">{phone}</p>}
                {joined && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Member since {joined}</p>}
              </div>
              <div className="mt-2 sm:ml-auto sm:mt-0">
                <Link to="/settings">
                  <PrimaryButton>Edit profile</PrimaryButton>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: 'Orders', value: loadingStats ? '...' : stats.orders, link: '/orders' },
              { label: 'Addresses', value: loadingStats ? '...' : stats.addresses, link: '/addresses' },
              { label: 'Notifications', value: loadingStats ? '...' : stats.notifications, link: '/notifications' },
              { label: 'Nile Miles', value: nileMiles.toLocaleString(), link: '/profile' },
              { label: 'Premium', value: profile?.isPremium ? 'Active' : 'No', link: '/premium-deals' },
            ].map((stat) => (
              <Link key={stat.label} to={stat.link} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-lg)]">
                <p className="text-2xl font-bold text-emerald-600">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-emerald-600">{stat.label}</p>
              </Link>
            ))}
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Account management</p>
            <div className="mt-4 space-y-3">
              <Link to="/addresses" className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 transition hover:border-emerald-500">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Saved addresses</span>
                <span className="text-xs text-[var(--color-text-muted)]">Manage &rarr;</span>
              </Link>
              <Link to="/notifications" className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 transition hover:border-emerald-500">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Notifications</span>
                <span className="text-xs text-[var(--color-text-muted)]">Manage &rarr;</span>
              </Link>
              <Link to="/settings" className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 transition hover:border-emerald-500">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Settings & preferences</span>
                <span className="text-xs text-[var(--color-text-muted)]">Manage &rarr;</span>
              </Link>
              <Link to="/account-deletion" className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 transition hover:border-red-500 hover:bg-red-50">
                <span className="text-sm font-medium text-red-600">Delete account</span>
                <span className="text-xs text-[var(--color-text-muted)]">Request &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProfilePage