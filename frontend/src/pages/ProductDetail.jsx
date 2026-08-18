import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, Heart, MapPin, MessageCircle, Pencil, Wrench } from 'lucide-react'
import ImageGallery from '../components/products/ImageGallery'
import ConditionBadge from '../components/products/ConditionBadge'
import PriceTag from '../components/products/PriceTag'
import ExchangeRecommendations from '../components/products/ExchangeRecommendations'
import ExchangeOfferModal from '../components/products/ExchangeOfferModal'
import DonationRequestModal from '../components/products/DonationRequestModal'
import MessageSellerModal from '../components/products/MessageSellerModal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { fetchExchangeRecommendations, fetchProduct } from '../services/products'
import { addToWishlist, removeFromWishlist } from '../services/wishlist'
import { apiErrorMessage } from '../services/api'
import { formatDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    fetchProduct(id)
      .then(setProduct)
      .catch((err) => setError(apiErrorMessage(err, 'Product not found.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  useEffect(() => {
    if (product?.allows_exchange || (product && ['FOR_EXCHANGE', 'SALE_OR_EXCHANGE'].includes(product.transaction_type))) {
      fetchExchangeRecommendations(id).then(setRecommendations).catch(() => {})
    }
  }, [product, id])

  if (loading) return <LoadingSpinner label="Loading product..." />
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!product) return null

  const isOwner = user?.id === product.seller?.id
  const allowsExchange = ['FOR_EXCHANGE', 'SALE_OR_EXCHANGE'].includes(product.transaction_type)
  const allowsPurchase = ['FOR_SALE', 'SALE_OR_EXCHANGE'].includes(product.transaction_type)
  const isDonation = product.transaction_type === 'FREE_DONATION'

  async function toggleWishlist() {
    if (!isAuthenticated) return navigate('/login')
    if (product.is_wishlisted) {
      await removeFromWishlist(product.id)
    } else {
      await addToWishlist(product.id)
    }
    setProduct({ ...product, is_wishlisted: !product.is_wishlisted })
  }

  async function handleAddToCart(buyNow) {
    if (!isAuthenticated) return navigate('/login')
    await addItem(product.id, 1)
    setNotice('Added to cart.')
    if (buyNow) navigate('/cart')
  }

  function requireAuth(action) {
    if (!isAuthenticated) return navigate('/login')
    action()
  }

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={product.images} />

        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500">
            <Link to={`/marketplace?category=${product.category_slug}`} className="hover:underline">
              {product.category}
            </Link>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {product.views_count} views
            </span>
          </div>

          <h1 className="mt-2 font-display text-2xl font-semibold text-navy-900">{product.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            <PriceTag price={product.price} transactionType={product.transaction_type} className="text-2xl" />
            <ConditionBadge condition={product.condition} />
            {product.status !== 'ACTIVE' && <Badge tone="amber">{product.status}</Badge>}
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-navy-600">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {product.location}
            </span>
            <span>Posted {formatDate(product.created_at)}</span>
          </div>

          <Link to={`/sellers/${product.seller?.id}`} className="mt-5 flex items-center gap-3 rounded-lg border border-sand-200 p-3 hover:bg-sand-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-sand-50">
              {product.seller?.full_name?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-navy-900">{product.seller?.full_name}</p>
              <p className="text-xs text-navy-500">{product.seller?.location}</p>
            </div>
          </Link>

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-navy-700">{product.description}</p>

          {notice && <p className="mt-4 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-700">{notice}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {isOwner ? (
              <Button as={Link} to={`/products/${product.id}/edit`} variant="outline">
                <Pencil size={16} /> Edit listing
              </Button>
            ) : (
              <>
                {allowsPurchase && (
                  <Button onClick={() => requireAuth(() => handleAddToCart(true))} variant="primary">
                    Buy Now
                  </Button>
                )}
                {allowsPurchase && (
                  <Button onClick={() => requireAuth(() => handleAddToCart(false))} variant="outline">
                    Add to Cart
                  </Button>
                )}
                {allowsExchange && (
                  <Button onClick={() => requireAuth(() => setModal('exchange'))} variant="accent">
                    Make Exchange Offer
                  </Button>
                )}
                {isDonation && (
                  <Button onClick={() => requireAuth(() => setModal('donation'))} variant="accent">
                    Request Donation
                  </Button>
                )}
                <Button onClick={() => requireAuth(() => setModal('message'))} variant="outline">
                  <MessageCircle size={16} /> Message Seller
                </Button>
                <Button onClick={toggleWishlist} variant="ghost">
                  <Heart size={16} fill={product.is_wishlisted ? '#1e9e82' : 'none'} /> Save
                </Button>
              </>
            )}
          </div>

          {product.condition === 'NEEDS_REPAIR' && (
            <Link
              to="/repair-providers"
              className="mt-6 flex items-center gap-3 rounded-lg border border-dashed border-navy-300 bg-white p-4 text-sm text-navy-800 hover:bg-sand-100"
            >
              <Wrench size={18} className="text-teal-600" />
              This item needs repair — find a trusted repair provider instead of discarding it.
            </Link>
          )}
        </div>
      </div>

      <ExchangeRecommendations recommendations={recommendations} />

      {modal === 'exchange' && (
        <ExchangeOfferModal open requestedProduct={product} onClose={() => setModal(null)} onSuccess={() => setNotice('Exchange offer sent!')} />
      )}
      {modal === 'donation' && (
        <DonationRequestModal open product={product} onClose={() => setModal(null)} onSuccess={() => setNotice('Donation request sent!')} />
      )}
      {modal === 'message' && <MessageSellerModal open product={product} onClose={() => setModal(null)} />}
    </div>
  )
}
