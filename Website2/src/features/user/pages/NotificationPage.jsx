import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { useToast } from '@shared/ui/toast/ToastProvider'

const mockNotifications = [
  { id: 1, icon: '📦', title: 'Order shipped', description: 'Order NF-2024-003 is on its way.', time: '2 hours ago', read: false },
  { id: 2, icon: '🏷️', title: 'Flash sale starts soon', description: 'Up to 50% off on selected items for the next 6 hours.', time: '5 hours ago', read: false },
  { id: 3, icon: '⭐', title: 'Rate your purchase', description: 'How was your Nile Premium Coffee? Leave a review.', time: '1 day ago', read: true },
  { id: 4, icon: '💳', title: 'Payment confirmed', description: 'Your payment of KES 2,400 for Order NF-2024-001 was successful.', time: '2 days ago', read: true },
  { id: 5, icon: '🎉', title: 'Welcome to Nile Flow', description: 'Thanks for joining! Start exploring our curated collection.', time: '1 week ago', read: true },
]

function NotificationPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const { push } = useToast()
  const unread = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((cur) => cur.map((n) => ({ ...n, read: true })))
    push({ title: 'Done', message: 'All notifications marked as read.' })
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Notifications" title="Your activity" description="Stay updated on orders, deals, and account activity." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
            {unread > 0 && <button onClick={markAllRead} className="min-h-11 rounded-full bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">Mark all read</button>}
          </div>

          {notifications.length === 0 ? (
            <EmptyState title="No notifications" description="You're all caught up! New notifications will appear here." icon="🔔" />
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={`flex items-start gap-4 rounded-[1.5rem] border p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] sm:p-6 ${
                  n.read ? 'border-[var(--color-border)] bg-[var(--color-surface)]' : 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.03]'
                }`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-lg">
                    {n.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
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
  )
}

export default NotificationPage
