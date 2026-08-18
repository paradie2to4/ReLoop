import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { fetchExchanges, respondToExchange } from '../services/exchanges'
import { formatRWF, timeAgo } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const STATUS_TONE = { PENDING: 'amber', ACCEPTED: 'sky', REJECTED: 'red', CANCELLED: 'neutral', COMPLETED: 'teal' }

export default function ExchangeRequests() {
  const { user } = useAuth()
  const [exchanges, setExchanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => fetchExchanges().then((data) => setExchanges(data.results || data)).finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  async function handleAction(id, action) {
    setBusyId(id)
    try {
      const updated = await respondToExchange(id, action)
      setExchanges((prev) => prev.map((ex) => (ex.id === id ? updated : ex)))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">Exchange Requests</h1>

      {!exchanges.length ? (
        <EmptyState icon={Repeat} title="No exchange requests" description="Offer an exchange from any product listing that accepts swaps." />
      ) : (
        <div className="mt-6 space-y-3">
          {exchanges.map((ex) => {
            const isReceiver = ex.receiver === user.id
            const isSender = ex.sender === user.id
            return (
              <div key={ex.id} className="rounded-lg border border-sand-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <ExchangeProduct label={isSender ? 'You offer' : `${ex.sender_name} offers`} product={ex.offered_product_detail} />
                    <Repeat size={16} className="shrink-0 text-navy-400" />
                    <ExchangeProduct label={isReceiver ? 'For your' : `For ${ex.receiver_name}'s`} product={ex.requested_product_detail} />
                  </div>
                  <Badge tone={STATUS_TONE[ex.status]}>{ex.status}</Badge>
                </div>
                {Number(ex.additional_cash) > 0 && <p className="mt-2 text-xs text-navy-600">+ {formatRWF(ex.additional_cash)} additional cash</p>}
                {ex.message && <p className="mt-2 text-sm text-navy-700">"{ex.message}"</p>}
                <p className="mt-2 text-xs text-navy-500">{timeAgo(ex.created_at)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {isReceiver && ex.status === 'PENDING' && (
                    <>
                      <Button size="sm" variant="accent" loading={busyId === ex.id} onClick={() => handleAction(ex.id, 'accept')}>Accept</Button>
                      <Button size="sm" variant="outline" loading={busyId === ex.id} onClick={() => handleAction(ex.id, 'reject')}>Reject</Button>
                    </>
                  )}
                  {isSender && ex.status === 'PENDING' && (
                    <Button size="sm" variant="ghost" loading={busyId === ex.id} onClick={() => handleAction(ex.id, 'cancel')}>Cancel</Button>
                  )}
                  {ex.status === 'ACCEPTED' && (isSender || isReceiver) && (
                    <Button size="sm" variant="accent" loading={busyId === ex.id} onClick={() => handleAction(ex.id, 'complete')}>Mark completed</Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ExchangeProduct({ label, product }) {
  if (!product) return null
  return (
    <Link to={`/products/${product.id}`} className="flex items-center gap-2">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-sand-100">
        {product.primary_image && <img src={product.primary_image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-navy-500">{label}</p>
        <p className="text-sm font-medium text-navy-900">{product.title}</p>
      </div>
    </Link>
  )
}
