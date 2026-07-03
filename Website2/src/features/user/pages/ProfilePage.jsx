import { Link } from 'react-router-dom'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Badge from '@shared/ui/badge/Badge'

const mockUser = {
  name: 'Amina Wanjiku',
  email: 'amina.wanjiku@example.com',
  joined: 'March 2023',
  avatar: 'AW',
  stats: { orders: 24, reviews: 12, wishlist: 8, premium: true },
}

function ProfilePage() {
  const { name, email, joined, avatar, stats } = mockUser

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Profile" title="Your account" description="Manage your personal information and view account activity." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white shadow-[var(--shadow-sm)] sm:h-24 sm:w-24 sm:text-3xl">
                {avatar}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{name}</h2>
                  {stats.premium && <Badge variant="primary">Premium</Badge>}
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{email}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Member since {joined}</p>
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
              { label: 'Orders', value: stats.orders, link: '/orders' },
              { label: 'Reviews', value: stats.reviews, link: '#' },
              { label: 'Wishlist', value: stats.wishlist, link: '#' },
              { label: 'Premium', value: stats.premium ? 'Active' : 'Upgrade', link: '/premium-deals' },
            ].map((stat) => (
              <Link key={stat.label} to={stat.link} className="group rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]">
                <p className="text-2xl font-bold text-[var(--color-primary)]">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]">{stat.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default ProfilePage
