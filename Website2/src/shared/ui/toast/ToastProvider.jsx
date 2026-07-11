import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

function ToastViewport({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{toast.message}</p> : null}
            </div>
            <button onClick={() => dismiss(toast.id)} className="text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback((toast) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: toast.title,
      message: toast.message,
    }
    setToasts((current) => [...current, entry])
    window.setTimeout(() => dismiss(entry.id), 2800)
  }, [dismiss])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
