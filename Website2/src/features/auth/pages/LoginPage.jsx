import PageShell from '@shared/ui/layout/PageShell'
import PrimaryButton from '@shared/ui/button/PrimaryButton'

function LoginPage() {
  return (
    <PageShell>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Authentication</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Welcome back</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Sign in to manage orders, saved favorites, and premium benefits with a calm, mobile-first experience.
          </p>
          <div className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Email
              <input className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="you@example.com" />
            </label>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Password
              <input type="password" className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" placeholder="••••••••" />
            </label>
            <PrimaryButton className="w-full justify-center">Continue</PrimaryButton>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

export default LoginPage
