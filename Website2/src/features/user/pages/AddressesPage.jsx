import { useState, useEffect, useCallback } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Badge from '@shared/ui/badge/Badge'
import Modal from '@shared/ui/modal/Modal'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { useToast } from '@shared/ui/toast/ToastProvider'
import { addressService } from '@api/services'

function AddressesPage() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ label: '', street: '', city: '', state: '', phone: '' })
  const { push } = useToast()

  const fetchAddresses = useCallback(async () => {
    setLoading(true)
    const data = await addressService.getAddresses()
    setAddresses(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const handleAdd = async () => {
    const requiredFields = [
      ['label', 'address label'],
      ['street', 'street address'],
      ['city', 'city'],
      ['state', 'state or province'],
      ['phone', 'phone number'],
    ]
    const missingField = requiredFields.find(([field]) => !form[field].trim())
    if (missingField) {
      push({ title: 'Incomplete address', message: `Please enter your ${missingField[1]}.` })
      return
    }

    setSaving(true)
    try {
      const result = await addressService.addAddress({
        ...form,
        country: 'Kenya',
      })
      if (result.success) {
        push({ title: 'Address added', message: 'Your new address has been saved.' })
        setForm({ label: '', street: '', city: '', state: '', phone: '' })
        setModalOpen(false)
        await fetchAddresses()
      } else {
        push({ title: 'Failed to add address', message: result.error || 'Please try again.' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = await addressService.deleteAddress(id)
    if (ok) {
      push({ title: 'Address removed', message: 'Address has been deleted.' })
      fetchAddresses()
    } else {
      push({ title: 'Failed to delete address', message: 'Please try again.' })
    }
  }

  return (
    <PageShell>
      <ResponsiveSection eyebrow="Addresses" title="Saved addresses" description="Manage your delivery addresses for faster checkout." className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
            <PrimaryButton onClick={() => setModalOpen(true)}>Add address</PrimaryButton>
          </div>

          {addresses.length === 0 ? (
            <EmptyState title="No addresses saved" description="Add a delivery address to speed up checkout." action={<PrimaryButton onClick={() => setModalOpen(true)}>Add address</PrimaryButton>} />
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id || addr.$id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-[var(--color-text-primary)]">{addr.label}</p>
                        {addr.default && <Badge variant="primary">Default</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{addr.street}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{addr.city}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{addr.phone}</p>
                    </div>
                    <button onClick={() => handleDelete(addr.id)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add new address" description="Fill in your delivery address details.">
          <div className="space-y-4">
            {(['label', 'street', 'city', 'state', 'phone']).map((field) => (
              <label key={field} className="block text-sm font-medium text-[var(--color-text-secondary)]">
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <input value={form[field]} onChange={(e) => setForm((cur) => ({ ...cur, [field]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder={field === 'phone' ? '+254 7XX XXX XXX' : `Enter ${field}`} required />
              </label>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1 justify-center" onClick={() => setModalOpen(false)}>Cancel</Button>
            <PrimaryButton className="flex-1 justify-center" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving...' : 'Save address'}
            </PrimaryButton>
          </div>
        </Modal>
      </ResponsiveSection>
    </PageShell>
  )
}

export default AddressesPage