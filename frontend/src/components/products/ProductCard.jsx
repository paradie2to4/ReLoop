import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import ConditionBadge from './ConditionBadge'
import PriceTag from './PriceTag'
import { useAuth } from '../../context/AuthContext'
import * as wishlistService from '../../services/wishlist'
import { timeAgo } from '../../utils/format'

export default function ProductCard({ product, onWishlistChange }) {
  const { isAuthenticated } = useAuth()
  const [wishlisted, setWishlisted] = useState(product.is_wishlisted)
  const [busy, setBusy] = useState(false)

  async function toggleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated || busy) return
    setBusy(true)
    try {
      if (wishlisted) {
        await wishlistService.removeFromWishlist(product.id)
      } else {
        await wishlistService.addToWishlist(product.id)
      }
      setWishlisted(!wishlisted)
      onWishlistChange?.(product.id, !wishlisted)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-sand-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-navy-500/50">No image</div>
        )}
        {isAuthenticated && (
          <button
            onClick={toggleWishlist}
            aria-label="Toggle wishlist"
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white"
          >
            <Heart size={16} fill={wishlisted ? '#1e9e82' : 'none'} stroke={wishlisted ? '#1e9e82' : '#0d2635'} />
          </button>
        )}
        {product.is_featured && (
          <span className="absolute left-2 top-2 rounded-full bg-navy-900 px-2 py-0.5 text-xs font-medium text-sand-50">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium text-navy-900">{product.title}</h3>
        </div>
        <PriceTag price={product.price} transactionType={product.transaction_type} className="text-base" />
        <div className="flex items-center gap-2">
          <ConditionBadge condition={product.condition} />
        </div>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-navy-600">
          <span className="flex items-center gap-1 truncate">
            <MapPin size={12} /> {product.location}
          </span>
          <span>{timeAgo(product.created_at)}</span>
        </div>
        <p className="truncate text-xs text-navy-500">by {product.seller?.full_name}</p>
      </div>
    </Link>
  )
}
