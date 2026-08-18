import { Link } from 'react-router-dom'
import PriceTag from './PriceTag'

export default function ExchangeRecommendations({ recommendations }) {
  if (!recommendations?.length) return null

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-semibold text-navy-900">You might exchange this for:</h2>
      <p className="mt-1 text-sm text-navy-600">
        Rule-based matches by category, value, condition and location — no black-box AI.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recommendations.map(({ product, reasons }) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="flex gap-3 rounded-lg border border-sand-200 bg-white p-3 hover:shadow-sm"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-sand-100">
              {product.primary_image && <img src={product.primary_image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-navy-900">{product.title}</p>
              <PriceTag price={product.price} transactionType={product.transaction_type} className="text-sm" />
              <p className="mt-1 truncate text-xs text-teal-600">{reasons.join(' · ')}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
