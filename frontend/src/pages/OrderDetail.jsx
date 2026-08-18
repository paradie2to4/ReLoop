import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Rating from '../components/ui/Rating'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { fetchOrder, updateOrderStatus } from '../services/orders'
import { createReview } from '../services/reviews'
import { apiErrorMessage } from '../services/api'
import { formatDate, formatRWF } from '../utils/format'
import { ORDER_STATUSES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    fetchOrder(id).then(setOrder).catch((err) => setError(apiErrorMessage(err, 'Order not found.'))).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!order) return null

  const isSellerOfOrder = order.items.some((item) => item.seller === user.id)
  const isBuyer = order.buyer === user.id
  const currentStepIndex = ORDER_STATUSES.findIndex((s) => s.value === order.status)

  async function handleStatusChange(newStatus) {
    setUpdating(true)
    try {
      const updated = await updateOrderStatus(id, { status: newStatus })
      setOrder(updated)
    } finally {
      setUpdating(false)
    }
  }

  async function handleMarkPaid() {
    setUpdating(true)
    try {
      const updated = await updateOrderStatus(id, { payment_status: 'PAID' })
      setOrder(updated)
    } finally {
      setUpdating(false)
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    setReviewError('')
    try {
      await createReview({ order_id: order.id, rating: review.rating, comment: review.comment })
      setReviewSubmitted(true)
    } catch (err) {
      setReviewError(apiErrorMessage(err, 'Could not submit review.'))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy-900">Order #{order.id}</h1>
        <Badge tone={order.status === 'CANCELLED' ? 'red' : 'teal'}>{order.status.replace(/_/g, ' ')}</Badge>
      </div>

      {order.status !== 'CANCELLED' && (
        <ol className="mt-6 flex flex-wrap gap-2">
          {ORDER_STATUSES.filter((s) => s.value !== 'CANCELLED').map((s, i) => (
            <li key={s.value} className={`rounded-full px-3 py-1 text-xs font-medium ${i <= currentStepIndex ? 'bg-teal-600 text-white' : 'bg-sand-200 text-navy-500'}`}>
              {s.label}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-lg border border-sand-200 bg-white p-4">
            <Link to={`/products/${item.product.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-sand-100">
              {item.product.primary_image && <img src={item.product.primary_image} alt="" className="h-full w-full object-cover" />}
            </Link>
            <div className="flex-1">
              <p className="text-sm font-medium text-navy-900">{item.product.title}</p>
              <p className="text-xs text-navy-500">Sold by {item.seller_name} · Qty {item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-navy-900">{formatRWF(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 rounded-lg border border-sand-200 bg-white p-5 sm:grid-cols-2">
        <Info label="Total" value={formatRWF(order.total_amount)} />
        <Info label="Payment method" value={order.payment_method.replace(/_/g, ' ')} />
        <Info label="Payment status" value={order.payment_status} />
        <Info label="Location" value={order.shipping_location} />
        <Info label="Placed on" value={formatDate(order.created_at)} />
      </div>

      {isSellerOfOrder && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-sand-200 bg-white p-5">
          <p className="text-sm font-medium text-navy-900">Seller actions:</p>
          <Select
            className="w-48"
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={ORDER_STATUSES}
            disabled={updating}
          />
          {order.payment_status !== 'PAID' && (
            <Button size="sm" variant="outline" onClick={handleMarkPaid} loading={updating}>
              Mark as paid
            </Button>
          )}
        </div>
      )}

      {isBuyer && order.status === 'COMPLETED' && !reviewSubmitted && (
        <form onSubmit={handleReviewSubmit} className="mt-6 space-y-3 rounded-lg border border-sand-200 bg-white p-5">
          <p className="text-sm font-medium text-navy-900">Leave a review for the seller</p>
          <Rating value={review.rating} onChange={(value) => setReview({ ...review, rating: value })} size={20} />
          <Textarea placeholder="How was your experience?" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
          {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
          <Button type="submit" size="sm">
            Submit review
          </Button>
        </form>
      )}
      {reviewSubmitted && <p className="mt-6 text-sm text-teal-700">Thanks for your review!</p>}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-navy-500">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-navy-900">{value}</p>
    </div>
  )
}
