import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import Rating from '../components/ui/Rating'
import ProductGrid from '../components/products/ProductGrid'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { fetchPublicSeller } from '../services/auth'
import { fetchProducts } from '../services/products'
import { fetchReviews } from '../services/reviews'
import { formatDate } from '../utils/format'

export default function SellerProfile() {
  const { id } = useParams()
  const [seller, setSeller] = useState(null)
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchPublicSeller(id), fetchProducts({ seller: id }), fetchReviews(id)])
      .then(([sellerData, productData, reviewData]) => {
        setSeller(sellerData)
        setProducts(productData.results)
        setReviews(reviewData.results || reviewData)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!seller) return null

  const stats = seller.stats || {}

  return (
    <div>
      <div className="flex flex-col items-start gap-4 rounded-lg border border-sand-200 bg-white p-6 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-navy-900 text-xl font-semibold text-sand-50">
          {seller.avatar ? <img src={seller.avatar} alt="" className="h-full w-full object-cover" /> : seller.full_name?.[0]}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-navy-900">{seller.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-navy-600">
            {seller.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {seller.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> Joined {formatDate(seller.date_joined)}
            </span>
          </div>
          {stats.rating != null && <div className="mt-2"><Rating value={stats.rating} count={stats.review_count} /></div>}
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <MiniStat label="Sold" value={stats.items_sold} />
          <MiniStat label="Donated" value={stats.items_donated} />
          <MiniStat label="Exchanged" value={stats.items_exchanged} />
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-navy-900">Active listings</h2>
      <div className="mt-4">
        <ProductGrid products={products} emptyTitle="No active listings" />
      </div>

      {reviews.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-semibold text-navy-900">Reviews</h2>
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-sand-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy-900">{review.reviewer_name}</p>
                  <Rating value={review.rating} />
                </div>
                {review.comment && <p className="mt-2 text-sm text-navy-700">{review.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold text-navy-900">{value ?? 0}</p>
      <p className="text-xs text-navy-500">{label}</p>
    </div>
  )
}
