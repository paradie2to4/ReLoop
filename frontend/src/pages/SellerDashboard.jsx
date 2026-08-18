import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Eye, Package, Pencil, Plus, ShoppingBag, TrendingUp } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { fetchSellerDashboard } from '../services/admin'
import { fetchProducts, updateProduct } from '../services/products'
import { fetchOrders } from '../services/orders'
import { formatRWF, timeAgo } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const TABS = ['Overview', 'My Listings', 'Orders']

export default function SellerDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Overview')
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchSellerDashboard(), fetchProducts({ mine: true }), fetchOrders()])
      .then(([s, p, o]) => {
        setStats(s)
        setProducts(p.results)
        setOrders((o.results || o).filter((order) => order.items.some((i) => i.seller === user.id)))
      })
      .finally(() => setLoading(false))
  }, [])

  async function archiveProduct(id) {
    await updateProduct(id, { status: 'ARCHIVED' })
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'ARCHIVED' } : p)))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy-900">Seller Dashboard</h1>
        <Button as={Link} to="/sell" size="sm" variant="accent">
          <Plus size={16} /> New listing
        </Button>
      </div>

      <div className="mt-4 flex gap-2 border-b border-sand-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-teal-600 text-navy-900' : 'text-navy-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Package} label="Active listings" value={stats.active_listings} />
          <StatCard icon={ShoppingBag} label="Sold items" value={stats.sold_items} />
          <StatCard icon={TrendingUp} label="Total views" value={stats.total_views} />
          <StatCard icon={Eye} label="Pending orders" value={stats.pending_orders} />
          <StatCard label="Pending exchange requests" value={stats.pending_exchange_requests} />
          <StatCard label="Pending donation requests" value={stats.pending_donation_requests} />
          <StatCard label="Items sold (all time)" value={stats.sales_stats.items_sold} />
          <StatCard label="Total revenue" value={formatRWF(stats.sales_stats.total_revenue)} />
        </div>
      )}

      {tab === 'My Listings' && (
        <div className="mt-6 space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-sand-200 bg-white p-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-sand-100">
                  {p.primary_image && <img src={p.primary_image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <Link to={`/products/${p.id}`} className="text-sm font-medium text-navy-900 hover:underline">{p.title}</Link>
                  <p className="text-xs text-navy-500">{p.views_count} views · {timeAgo(p.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={p.status === 'ACTIVE' ? 'teal' : 'neutral'}>{p.status}</Badge>
                <Link to={`/products/${p.id}/edit`} className="rounded-md p-1.5 text-navy-600 hover:bg-sand-100"><Pencil size={15} /></Link>
                {p.status === 'ACTIVE' && (
                  <button onClick={() => archiveProduct(p.id)} className="rounded-md p-1.5 text-navy-600 hover:bg-sand-100"><Archive size={15} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Orders' && (
        <div className="mt-6 space-y-2">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-4 hover:shadow-sm">
              <div>
                <p className="text-sm font-medium text-navy-900">Order #{order.id}</p>
                <p className="text-xs text-navy-500">{timeAgo(order.created_at)}</p>
              </div>
              <Badge tone="sky">{order.status.replace(/_/g, ' ')}</Badge>
            </Link>
          ))}
          {!orders.length && <p className="text-sm text-navy-600">No orders yet.</p>}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      {Icon && <Icon size={18} className="text-teal-600" />}
      <p className="mt-2 font-display text-2xl font-semibold text-navy-900">{value}</p>
      <p className="text-xs text-navy-500">{label}</p>
    </div>
  )
}
