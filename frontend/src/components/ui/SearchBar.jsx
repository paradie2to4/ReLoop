import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search for products...', className = '' }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(value)
      }}
      className={`flex items-center gap-2 rounded-md border border-sand-300 bg-white px-3.5 py-2.5 ${className}`}
    >
      <Search size={18} className="text-navy-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-navy-900 placeholder:text-navy-500/60 focus:outline-none"
      />
    </form>
  )
}
