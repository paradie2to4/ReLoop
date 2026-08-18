import { PackageSearch } from 'lucide-react'
import ProductCard from './ProductCard'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import ErrorMessage from '../ui/ErrorMessage'

export default function ProductGrid({ products, loading, error, onRetry, emptyTitle = 'No products found', emptyDescription }) {
  if (loading) return <LoadingSpinner label="Loading products..." />
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />
  if (!products?.length) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription || 'Try adjusting your filters or search terms.'}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
