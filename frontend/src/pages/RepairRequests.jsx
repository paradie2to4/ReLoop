import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { fetchRepairRequests } from '../services/repairs'
import { formatRWF, timeAgo } from '../utils/format'

const STATUS_TONE = { REQUESTED: 'amber', ACCEPTED: 'sky', IN_PROGRESS: 'sky', COMPLETED: 'teal', CANCELLED: 'red' }

export default function RepairRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRepairRequests().then((data) => setRequests(data.results || data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">My Repair Requests</h1>

      {!requests.length ? (
        <EmptyState icon={Wrench} title="No repair requests yet" description="Browse repair providers to fix an item instead of replacing it." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-900">{r.provider_name}</p>
                  {r.product_title && <p className="text-xs text-navy-500">Re: {r.product_title}</p>}
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{r.status.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="mt-2 text-sm text-navy-700">{r.problem_description}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-navy-500">
                <span>{timeAgo(r.created_at)}</span>
                {r.estimated_cost && <span className="font-medium text-navy-800">Est. {formatRWF(r.estimated_cost)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
