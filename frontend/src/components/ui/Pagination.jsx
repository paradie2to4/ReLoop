import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, hasNext, hasPrevious, onChange, totalCount, pageSize = 12 }) {
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : null

  if (!hasNext && !hasPrevious) return null

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={!hasPrevious}
        className="flex items-center gap-1 rounded-md border border-sand-300 px-3 py-2 text-sm text-navy-800 disabled:opacity-40"
      >
        <ChevronLeft size={16} /> Previous
      </button>
      <span className="text-sm text-navy-700">
        Page {page}
        {totalPages ? ` of ${totalPages}` : ''}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={!hasNext}
        className="flex items-center gap-1 rounded-md border border-sand-300 px-3 py-2 text-sm text-navy-800 disabled:opacity-40"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  )
}
