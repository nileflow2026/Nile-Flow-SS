import { useEffect } from 'react'

function Modal({ isOpen, title, description, children, onClose, footer }) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h3>
            {description ? <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]">Close</button>
        </div>

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  )
}

export default Modal
