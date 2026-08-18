const VARIANTS = {
  primary: 'bg-navy-900 text-sand-50 hover:bg-navy-800 disabled:bg-navy-900/40',
  accent: 'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-600/40',
  outline: 'border border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-sand-50 disabled:opacity-40',
  ghost: 'text-navy-700 hover:bg-sand-200 disabled:opacity-40',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/40',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  as: Component = 'button',
  className = '',
  children,
  loading = false,
  disabled,
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </Component>
  )
}
