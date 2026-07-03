import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { useToast } from '@shared/ui/toast/ToastProvider'

function SettingsPage() {
  const [form, setForm] = useState({ language: 'en', theme: 'system', emailPromos: true, orderUpdates: true, smsAlerts: false })
  const { push } = useToast()

  const handleSave = () => {
    push({ title: 'Settings saved', message: 'Your preferences have been updated.' })
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Settings" title="Account preferences" description="Customize your experience across language, notifications, and more." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Language & region</p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Language
                <select value={form.language} onChange={(e) => setForm((cur) => ({ ...cur, language: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] cursor-pointer">
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                  <option value="fr">Français</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Theme
                <select value={form.theme} onChange={(e) => setForm((cur) => ({ ...cur, theme: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] cursor-pointer">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System default</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</p>
            <div className="mt-4 space-y-4">
              {[
                { key: 'emailPromos', label: 'Promotional emails', desc: 'Deals, offers, and product updates' },
                { key: 'orderUpdates', label: 'Order updates', desc: 'Shipping confirmations and delivery status' },
                { key: 'smsAlerts', label: 'SMS alerts', desc: 'Time-sensitive delivery notifications' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.checked }))}
                    className="mt-1 h-5 w-5 rounded-md border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" />
                  <div><p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p><p className="text-xs text-[var(--color-text-muted)]">{desc}</p></div>
                </label>
              ))}
            </div>
          </div>

          <PrimaryButton className="w-full justify-center" onClick={handleSave}>Save preferences</PrimaryButton>
        </div>
      </ResponsiveSection>
    </PageShell>
  )
}

export default SettingsPage
