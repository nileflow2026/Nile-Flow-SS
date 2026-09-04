import { useState, useEffect } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { ProtectedRoute } from '@api/context/ProtectedRoute'
import { notificationService } from '@api/services'
import { useToast } from '@shared/ui/toast/ToastProvider'

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
  if (diffWeek < 4) return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getIconFromType(type) {
  const lower = (type || '').toLowerCase()
  if (lower === 'order' || lower.includes('order')) return '📦'
  if (lower === 'promo' || lower.includes('promo') || lower.includes('deal')) return '🏷️'
  if (lower === 'payment' || lower.includes('payment') || lower.includes('pay')) return '💳'
  if (lower === 'review' || lower.includes('review') || lower.includes('rate')) return '⭐'
  if (lower === 'welcome' || lower.includes('welcome')) return '🎉'
  return '🔔'
}

function NotificationPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { push } = useToast()

  useEffect(() => {
    let cancelled = false
    async function fetchNotifications() {
      setLoading(true)
      const data = await notificationService.getNotifications()
      if (cancelled) return
      const mapped = (data || []).map((n) => ({
        id: n.$id || n.id || Math.random().toString(36).slice(2),
        title: n.title || 'Notification',
        description: n.message || n.description || '',
        time: formatRelativeTime(n.createdAt || n.$createdAt),
        read: n.read === true,
        icon: getIconFromType(n.type || n.notificationType || ''),
      }))
      setNotifications(mapped)
      setLoading(false)
    }
    fetchNotifications()
    return () => { cancelled = true }
  }, [])

  const unread = notifications.filter((n) => !n.read).length

  const markAllRead = async () => {
    const saved = await notificationService.markAllAsRead()
    if (!saved) {
      push({ title: 'Update failed', message: 'Could not mark notifications as read.' })
      return
    }

    setNotifications((cur) => cur.map((n) => ({ ...n, read: true })))
    window.dispatchEvent(new Event('notifications:updated'))
    push({ title: 'Done', message: 'All notifications marked as read.' })
  }

  return (
    <ProtectedRoute requireAuth>
      <PageShell>
        <ResponsiveSection eyebrow="Notifications" title="Your activity" description="Stay updated on orders, deals, and account activity." className="py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-secondary)]">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
              {unread > 0 && <button onClick={markAllRead} className="min-h-11 rounded-full bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white">Mark all read</button>}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-emerald-600 dark:border-t-emerald-400" />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState title="No notifications" description="You're all caught up! New notifications will appear here." icon="🔔" />
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-4 rounded-2xl border p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-lg)] sm:p-6 ${
                    n.read ? 'border-[var(--color-border)] bg-[var(--color-surface)]' : 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10'
                  }`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-lg">
                      {n.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />}
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{n.description}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ResponsiveSection>
      </PageShell>
    </ProtectedRoute>
  )
}

export default NotificationPage