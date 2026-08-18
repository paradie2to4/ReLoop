import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorMessage from '../components/ui/ErrorMessage'
import Button from '../components/ui/Button'
import { fetchOrders } from '../services/orders'
import { apiErrorMessage } from '../services/api'
import { formatDate, formatRWF } from '../utils/format'

const STATUS_TONE = {
  PENDING: 'amber', CONFIRMED: 'sky', PROCESSING: 'sky', READY_FOR_PICKUP: 'teal', COMPLETED: 'teal', CANCELLED: 'red',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    fetchOrders().then((data) => setOrders(data.results || data)).catch((err) => setError(apiErrorMessage(err))).finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">My Orders</h1>

      {!orders.length ? (
        <EmptyState icon={PackageSearch} title="No orders yet" description="Your purchases and sales will show up here." action={<Button as={Link} to="/marketplace" className="mt-2">Explore Marketplace</Button>} />
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-4 hover:shadow-sm">
              <div>
                <p className="text-sm font-medium text-navy-900">Order #{order.id}</p>
                <p className="text-xs text-navy-500">{order.items.length} item(s) · {formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-navy-900">{formatRWF(order.total_amount)}</span>
                <Badge tone={STATUS_TONE[order.status]}>{order.status.replace(/_/g, ' ')}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
