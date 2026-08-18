import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../products/ProductCard'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function ProductRow({ title, subtitle, products, loading, viewAllLink }) {
  if (!loading && !products?.length) return null

  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-navy-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-navy-600">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
