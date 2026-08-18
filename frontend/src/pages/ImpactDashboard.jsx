import { useEffect, useState } from 'react'
import { Leaf, Package, Recycle, Repeat, Scale } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { fetchImpactDashboard } from '../services/impact'
import { formatDate } from '../utils/format'

export default function ImpactDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImpactDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return null

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">Your Impact Dashboard</h1>
      <p className="mt-1 text-sm text-navy-600">
        Estimated environmental impact from your sales, donations and exchanges.{' '}
        <span className="font-medium text-navy-800">Figures are illustrative estimates, not precise measurements.</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Recycle} label="Items reused" value={data.items_reused} tone="teal" />
        <StatCard icon={Package} label="Items sold" value={data.items_sold} tone="navy" />
        <StatCard icon={Leaf} label="Items donated" value={data.items_donated} tone="teal" />
        <StatCard icon={Repeat} label="Items exchanged" value={data.items_exchanged} tone="sky" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-navy-900 p-6 text-sand-50">
          <Scale size={22} className="text-teal-300" />
          <p className="mt-3 font-display text-3xl font-semibold">{data.estimated_weight_saved_kg} kg</p>
          <p className="mt-1 text-sm text-sand-100/70">Estimated waste avoided</p>
        </div>
        <div className="rounded-lg bg-teal-600 p-6 text-white">
          <Leaf size={22} />
          <p className="mt-3 font-display text-3xl font-semibold">{data.estimated_co2_saved_kg} kg</p>
          <p className="mt-1 text-sm text-white/80">Estimated CO₂ savings</p>
        </div>
      </div>

      {data.recent_records?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-navy-900">Recent impact records</h2>
          <div className="mt-3 space-y-2">
            {data.recent_records.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-3 text-sm">
                <div>
                  <p className="font-medium text-navy-900">{r.product_title}</p>
                  <p className="text-xs text-navy-500">{r.transaction_type} · {formatDate(r.created_at)}</p>
                </div>
                <p className="text-xs text-navy-600">{r.estimated_weight_saved}kg · {r.estimated_co2_saved}kg CO₂</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const TONE_CLASS = { teal: 'bg-teal-50 text-teal-700', navy: 'bg-sand-100 text-navy-800', sky: 'bg-sky-50 text-sky-600' }

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <div className={`inline-flex rounded-md p-2 ${TONE_CLASS[tone] || TONE_CLASS.navy}`}>
        <Icon size={18} />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-navy-900">{value}</p>
      <p className="text-xs text-navy-500">{label}</p>
    </div>
  )
}
