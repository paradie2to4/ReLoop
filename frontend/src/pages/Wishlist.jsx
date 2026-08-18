import { useEffect, useState } from 'react'
import ProductGrid from '../components/products/ProductGrid'
import { fetchWishlist } from '../services/wishlist'
import { apiErrorMessage } from '../services/api'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetchWishlist()
      .then((data) => setItems(data.map((i) => ({ ...i.product, is_wishlisted: true }))))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">My Wishlist</h1>
      <div className="mt-6">
        <ProductGrid
          products={items}
          loading={loading}
          error={error}
          onRetry={load}
          emptyTitle="Your wishlist is empty"
          emptyDescription="Tap the heart icon on any product to save it for later."
        />
      </div>
    </div>
  )
}
