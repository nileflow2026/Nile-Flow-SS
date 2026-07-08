function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export default PrimaryButton
