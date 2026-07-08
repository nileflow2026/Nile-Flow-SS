import { useState, useEffect } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { httpClient } from '@api/client/index'

function SettingsPage() {
  const [form, setForm] = useState({ language: 'en', theme: 'system', emailPromos: true, orderUpdates: true, smsAlerts: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { push } = useToast()

  useEffect(() => {
    let cancelled = false
    async function fetchPreferences() {
      setLoading(true)
      try {
        const res = await httpClient.get('/api/customerauth/preferences')
        const prefs = res?.data?.preferences || {}
        if (cancelled) return
        setForm({
          language: prefs.language || 'en',
          theme: prefs.theme || 'system',
          emailPromos: prefs.emailPromos !== false,
          orderUpdates: prefs.orderUpdates !== false,
          smsAlerts: prefs.smsAlerts === true,
        })
      } catch {
        // Use defaults
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPreferences()
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await httpClient.put('/api/customerauth/preferences', {
        language: form.language,
        theme: form.theme,
        emailPromos: form.emailPromos,
        orderUpdates: form.orderUpdates,
        smsAlerts: form.smsAlerts,
      })
      push({ title: 'Settings saved', message: 'Your preferences have been updated.' })
    } catch {
      push({ title: 'Failed to save', message: 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Settings" title="Account preferences" description="Customize your experience across language, notifications, and more." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Language & region</p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
                <select value={form.language} onChange={(e) => setForm((cur) => ({ ...cur, language: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer">
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                  <option value="fr">Français</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
                <select value={form.theme} onChange={(e) => setForm((cur) => ({ ...cur, theme: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System default</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
            <div className="mt-4 space-y-4">
              {[
                { key: 'emailPromos', label: 'Promotional emails', desc: 'Deals, offers, and product updates' },
                { key: 'orderUpdates', label: 'Order updates', desc: 'Shipping confirmations and delivery status' },
                { key: 'smsAlerts', label: 'SMS alerts', desc: 'Time-sensitive delivery notifications' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[key]} onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.checked }))}
                    className="mt-1 h-5 w-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer dark:border-gray-600" />
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p><p className="text-xs text-gray-500 dark:text-gray-500">{desc}</p></div>
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
