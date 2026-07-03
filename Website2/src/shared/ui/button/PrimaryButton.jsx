function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export default PrimaryButton
