import { Star } from 'lucide-react'

export default function Rating({ value = 0, count, size = 14, onChange }) {
  const stars = [1, 2, 3, 4, 5]
  const interactive = typeof onChange === 'function'

  return (
    <span className="inline-flex items-center gap-1">
      {stars.map((star) => (
        <Star
          key={star}
          size={size}
          className={interactive ? 'cursor-pointer' : ''}
          fill={star <= Math.round(value) ? '#1e9e82' : 'none'}
          stroke={star <= Math.round(value) ? '#1e9e82' : '#a3a3a3'}
          onClick={interactive ? () => onChange(star) : undefined}
        />
      ))}
      {count !== undefined && <span className="ml-1 text-xs text-navy-600">({count})</span>}
    </span>
  )
}
