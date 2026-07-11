import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { useAuth } from '@auth/AuthContext'

function ProfilePage() {
  const { user } = useAuth()

  const name = user?.name || user?.username || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''
  const phone = user?.phone || ''
  const initials = (name?.charAt(0) || 'U').toUpperCase()

  const rawJoined = user?.createdAt || user?.$registration || user?.registration || null
  const joined = rawJoined
    ? new Date(rawJoined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Profile" title="Your account" description="Manage your personal information and view account activity." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-[var(--shadow-sm)] sm:h-24 sm:w-24 sm:text-3xl">
                {initials}
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

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Orders', value: '—', link: '/orders' },
              { label: 'Addresses', value: '—', link: '/addresses' },
              { label: 'Notifications', value: '—', link: '/notifications' },
              { label: 'Premium', value: '—', link: '/premium-deals' },
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