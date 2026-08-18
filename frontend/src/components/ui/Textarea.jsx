export default function Textarea({ label, error, className = '', id, rows = 4, ...props }) {
  const inputId = id || props.name

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-navy-800">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-500/50 focus:border-teal-500 ${
          error ? 'border-red-400' : 'border-sand-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
