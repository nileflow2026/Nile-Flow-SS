import { useState } from 'react'
import PageShell from '@shared/ui/layout/PageShell'
import ResponsiveSection from '@shared/ui/section/ResponsiveSection'
import PrimaryButton from '@shared/ui/button/PrimaryButton'
import Button from '@shared/ui/button/Button'
import Badge from '@shared/ui/badge/Badge'
import Modal from '@shared/ui/modal/Modal'
import EmptyState from '@shared/ui/empty-state/EmptyState'
import { useToast } from '@shared/ui/toast/ToastProvider'

const initialAddresses = [
  { id: 1, label: 'Home', street: '123 Moi Avenue', city: 'Nairobi', phone: '+254 712 345 678', default: true },
  { id: 2, label: 'Office', street: '456 Kenyatta Blvd', city: 'Mombasa', phone: '+254 723 456 789', default: false },
]

function AddressesPage() {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ label: '', street: '', city: '', phone: '' })
  const { push } = useToast()

  const handleAdd = () => {
    if (!form.label || !form.street || !form.city || !form.phone) return
    setAddresses((cur) => [...cur, { ...form, id: Date.now(), default: false }])
    setForm({ label: '', street: '', city: '', phone: '' })
    setModalOpen(false)
    push({ title: 'Address added', message: 'Your new address has been saved.' })
  }

  const handleDelete = (id) => {
    setAddresses((cur) => cur.filter((a) => a.id !== id))
    push({ title: 'Address removed', message: 'Address has been deleted.' })
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
                <div key={addr.id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
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
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--color-error)] transition hover:bg-[var(--color-error)]/10">
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
            {(['label', 'street', 'city', 'phone']).map((field) => (
              <label key={field} className="block text-sm font-medium text-[var(--color-text-secondary)]">
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <input value={form[field]} onChange={(e) => setForm((cur) => ({ ...cur, [field]: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  placeholder={field === 'phone' ? '+254 7XX XXX XXX' : `Enter ${field}`} required />
              </label>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1 justify-center" onClick={() => setModalOpen(false)}>Cancel</Button>
            <PrimaryButton className="flex-1 justify-center" onClick={handleAdd}>Save address</PrimaryButton>
          </div>
        </Modal>
      </ResponsiveSection>
    </PageShell>
  )
}

export default AddressesPage
