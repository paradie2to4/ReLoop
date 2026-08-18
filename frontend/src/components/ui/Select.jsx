export default function Select({ label, error, options, placeholder, className = '', id, ...props }) {
  const inputId = id || props.name

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-navy-800">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:border-teal-500 ${
          error ? 'border-red-400' : 'border-sand-300'
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
