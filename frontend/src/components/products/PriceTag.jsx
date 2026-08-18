import { formatRWF } from '../../utils/format'

export default function PriceTag({ price, transactionType, className = '' }) {
  if (transactionType === 'FREE_DONATION') {
    return <span className={`font-display text-lg font-semibold text-teal-600 ${className}`}>FREE</span>
  }
  if (transactionType === 'FOR_EXCHANGE') {
    return <span className={`font-display text-lg font-semibold text-sky-600 ${className}`}>EXCHANGE</span>
  }
  return (
    <span className={`font-display text-lg font-semibold text-navy-900 ${className}`}>
      {formatRWF(price)}
      {transactionType === 'SALE_OR_EXCHANGE' && <span className="ml-1.5 text-xs font-sans font-medium text-sky-600">or exchange</span>}
    </span>
  )
}
