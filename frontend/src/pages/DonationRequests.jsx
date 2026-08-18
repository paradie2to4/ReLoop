import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gift } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { fetchDonations, respondToDonation } from '../services/donations'
import { timeAgo } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const STATUS_TONE = { PENDING: 'amber', ACCEPTED: 'sky', REJECTED: 'red', COMPLETED: 'teal' }

export default function DonationRequests() {
  const { user } = useAuth()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => fetchDonations().then((data) => setDonations(data.results || data)).finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  async function handleAction(id, action) {
    setBusyId(id)
    try {
      const updated = await respondToDonation(id, action)
      setDonations((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">Donation Requests</h1>

      {!donations.length ? (
        <EmptyState icon={Gift} title="No donation requests" description="Request a free item from the marketplace, or donate one of your own." />
      ) : (
        <div className="mt-6 space-y-3">
          {donations.map((d) => {
            const isDonor = d.product_detail?.seller?.id === user.id
            return (
              <div key={d.id} className="flex items-start justify-between gap-4 rounded-lg border border-sand-200 bg-white p-4">
                <div className="flex flex-1 items-start gap-3">
                  <Link to={`/products/${d.product}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-sand-100">
                    {d.product_detail?.primary_image && <img src={d.product_detail.primary_image} alt="" className="h-full w-full object-cover" />}
                  </Link>
                  <div>
                    <Link to={`/products/${d.product}`} className="text-sm font-medium text-navy-900 hover:underline">
                      {d.product_detail?.title}
                    </Link>
                    <p className="text-xs text-navy-500">{isDonor ? `Requested by ${d.requester_name}` : 'Your request'} · {timeAgo(d.created_at)}</p>
                    {d.message && <p className="mt-1 text-sm text-navy-700">"{d.message}"</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {isDonor && d.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="accent" loading={busyId === d.id} onClick={() => handleAction(d.id, 'accept')}>Accept</Button>
                          <Button size="sm" variant="outline" loading={busyId === d.id} onClick={() => handleAction(d.id, 'reject')}>Reject</Button>
                        </>
                      )}
                      {d.status === 'ACCEPTED' && (
                        <Button size="sm" variant="accent" loading={busyId === d.id} onClick={() => handleAction(d.id, 'complete')}>Mark completed</Button>
                      )}
                    </div>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
