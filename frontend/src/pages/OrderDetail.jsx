import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Input from '../components/ui/Input'
import Rating from '../components/ui/Rating'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { cancelOrder, checkMomoStatus, fetchMomoConfig, fetchOrder, payWithMomo, updateOrderStatus } from '../services/orders'
import { createReview } from '../services/reviews'
import { apiErrorMessage } from '../services/api'
import { formatDate, formatRWF } from '../utils/format'
import { ORDER_STATUSES, PAYMENT_METHODS } from '../utils/constants'
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
  const [cancelError, setCancelError] = useState('')

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
  const isMomo = order.payment_method === 'MOMO'
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

  async function handleCancel() {
    if (!window.confirm('Cancel this order? The items will go back on sale.')) return
    setCancelError('')
    setUpdating(true)
    try {
      setOrder(await cancelOrder(id))
    } catch (err) {
      setCancelError(apiErrorMessage(err, 'Could not cancel the order.'))
      load()
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
            <li key={s.value} className={`rounded-full px-3 py-1 text-xs font-medium ${i <= currentStepIndex ? 'bg-teal-600 text-on-accent' : 'bg-sand-200 text-navy-500'}`}>
              {s.label}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="glass-card flex items-center gap-4 rounded-lg border border-sand-200 bg-surface p-4">
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

      <div className="glass-card mt-6 grid gap-4 rounded-lg border border-sand-200 bg-surface p-5 sm:grid-cols-2">
        <Info label="Total" value={formatRWF(order.total_amount)} />
        <Info
          label="Payment method"
          value={PAYMENT_METHODS.find((m) => m.value === order.payment_method)?.label || order.payment_method.replace(/_/g, ' ')}
        />
        <Info label="Payment status" value={order.payment_status} />
        <Info label="Location" value={order.shipping_location} />
        <Info label="Placed on" value={formatDate(order.created_at)} />
      </div>

      {isBuyer && isMomo && order.payment_status !== 'PAID' && order.status !== 'CANCELLED' && (
        <MomoPanel order={order} onUpdate={setOrder} />
      )}
      {isMomo && order.payment_status === 'PAID' && (
        <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          <p>Paid with MTN Mobile Money{order.momo_payment?.phone ? ` from ${order.momo_payment.phone}` : ''}.</p>
          {order.momo_payment?.financial_transaction_id && (
            <p className="mt-1 text-xs">MTN transaction ID: {order.momo_payment.financial_transaction_id}</p>
          )}
        </div>
      )}

      {isBuyer && order.status === 'PENDING' && order.payment_status !== 'PAID' && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          {cancelError ? <p className="text-red-600">{cancelError}</p> : <span />}
          <Button size="sm" variant="outline" onClick={handleCancel} loading={updating}>
            Cancel order
          </Button>
        </div>
      )}

      {isSellerOfOrder && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
        <div className="glass-card mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-sand-200 bg-surface p-5">
          <p className="text-sm font-medium text-navy-900">Seller actions:</p>
          <Select
            className="w-48"
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={ORDER_STATUSES}
            disabled={updating}
          />
          {order.payment_status !== 'PAID' && !isMomo && (
            <Button size="sm" variant="outline" onClick={handleMarkPaid} loading={updating}>
              Mark as paid
            </Button>
          )}
        </div>
      )}

      {isBuyer && order.status === 'COMPLETED' && !reviewSubmitted && (
        <form onSubmit={handleReviewSubmit} className="glass-card mt-6 space-y-3 rounded-lg border border-sand-200 bg-surface p-5">
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

const POLL_EVERY_MS = 5000
const POLL_FOR_MS = 3 * 60 * 1000

function MomoPanel({ order, onUpdate }) {
  const location = useLocation()
  const payment = order.momo_payment
  const isPending = payment?.status === 'PENDING'
  const [phone, setPhone] = useState(payment?.phone || '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(location.state?.momoError || '')
  const [timedOut, setTimedOut] = useState(false)
  const [sandbox, setSandbox] = useState(false)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    fetchMomoConfig().then((cfg) => setSandbox(Boolean(cfg.sandbox))).catch(() => {})
  }, [])

  // While MTN is waiting for the buyer to approve, ask the server every few seconds.
  useEffect(() => {
    if (!isPending) return undefined
    startedAt.current = Date.now()
    setTimedOut(false)
    const timer = setInterval(async () => {
      if (Date.now() - startedAt.current > POLL_FOR_MS) {
        clearInterval(timer)
        setTimedOut(true)
        return
      }
      try {
        onUpdate(await checkMomoStatus(order.id))
      } catch {
        // Network hiccup: try again on the next tick.
      }
    }, POLL_EVERY_MS)
    return () => clearInterval(timer)
  }, [isPending, payment?.reference_id, order.id, onUpdate])

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      onUpdate(await payWithMomo(order.id, phone))
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send the MoMo payment request.'))
    } finally {
      setSending(false)
    }
  }

  async function handleCheckNow() {
    setTimedOut(false)
    startedAt.current = Date.now()
    try {
      onUpdate(await checkMomoStatus(order.id))
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not check the payment.'))
    }
  }

  return (
    <div className="glass-card mt-6 space-y-3 rounded-lg border border-sand-200 bg-surface p-5">
      <div className="flex items-center gap-2">
        <Smartphone size={18} className="text-teal-700" />
        <p className="text-sm font-medium text-navy-900">Pay {formatRWF(order.total_amount)} with MTN Mobile Money</p>
      </div>

      {sandbox && (
        <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-medium">Test mode (MTN MoMo sandbox): no real money is taken.</p>
          <p className="mt-1">
            Any number is approved automatically, e.g. 078 123 4567. To see a failed payment, use 46733123450.
          </p>
        </div>
      )}
      <p className="text-xs text-navy-500">Unpaid orders are cancelled automatically after 30 minutes.</p>

      {isPending ? (
        <div className="space-y-2 text-sm text-navy-700">
          <p>
            We sent a payment request to <span className="font-medium">{payment.phone}</span>. Approve it on your phone with
            your MoMo PIN. This page updates by itself.
          </p>
          <p className="text-xs text-navy-500">No prompt? Dial *182*7*1# to see pending approvals.</p>
          {timedOut ? (
            <Button size="sm" variant="outline" onClick={handleCheckNow}>
              Check payment again
            </Button>
          ) : (
            <LoadingSpinner />
          )}
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-3">
          {payment?.status === 'FAILED' && (
            <p className="text-sm text-red-600">
              The last payment didn't go through{payment.failure_reason ? ` (${payment.failure_reason.replace(/_/g, ' ').toLowerCase()})` : ''}. You can try again.
            </p>
          )}
          <Input
            label="MTN MoMo number"
            name="momo_phone"
            type="tel"
            inputMode="tel"
            required
            placeholder="078 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" size="sm" variant="accent" loading={sending}>
            Send payment request
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
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
