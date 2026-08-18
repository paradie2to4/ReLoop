export default function LoadingSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-navy-600 ${className}`}>
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
