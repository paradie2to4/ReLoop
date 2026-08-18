import { useEffect, useState } from 'react'
import { AlertTriangle, Layers, Package, ShoppingBag, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import api from '../services/api'
import {
  createCategory,
  deleteCategory,
  fetchAdminAnalytics,
  fetchAdminCategories,
  fetchAdminReports,
  fetchAdminUsers,
  reactivateUser,
  suspendUser,
} from '../services/admin'
import { formatDate } from '../utils/format'

const TABS = ['Overview', 'Users', 'Categories', 'Reports']

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview')
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [reports, setReports] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAdminAnalytics(), fetchAdminUsers(), fetchAdminCategories(), fetchAdminReports()])
      .then(([a, u, c, r]) => {
        setAnalytics(a)
        setUsers(u.results || u)
        setCategories(c)
        setReports(r.results || r)
      })
      .finally(() => setLoading(false))
  }, [])

  async function toggleUser(user) {
    const updated = user.is_active ? await suspendUser(user.id) : await reactivateUser(user.id)
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategory.trim()) return
    const created = await createCategory({ name: newCategory })
    setCategories((prev) => [...prev, created])
    setNewCategory('')
  }

  async function handleDeleteCategory(id) {
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  async function updateReportStatus(id, status) {
    const { data } = await api.patch(`/reports/${id}/`, { status })
    setReports((prev) => prev.map((r) => (r.id === id ? data : r)))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">Admin Dashboard</h1>

      <div className="mt-4 flex gap-2 border-b border-sand-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium ${tab === t ? 'border-b-2 border-teal-600 text-navy-900' : 'text-navy-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && analytics && (
        <div className="mt-6 space-y-6">
          <Section title="Users" icon={Users}>
            <Stat label="Total" value={analytics.users.total} />
            <Stat label="New this week" value={analytics.users.new_this_week} />
            <Stat label="Active" value={analytics.users.active} />
            <Stat label="Sellers" value={analytics.users.sellers} />
          </Section>
          <Section title="Marketplace" icon={Package}>
            <Stat label="Total listings" value={analytics.marketplace.total_listings} />
            <Stat label="Active" value={analytics.marketplace.active_listings} />
            <Stat label="Sold" value={analytics.marketplace.sold} />
            <Stat label="Donated" value={analytics.marketplace.donated} />
            <Stat label="Exchanged" value={analytics.marketplace.exchanged} />
          </Section>
          <Section title="Transactions" icon={ShoppingBag}>
            <Stat label="Orders" value={analytics.transactions.orders} />
            <Stat label="Completed" value={analytics.transactions.completed} />
            <Stat label="Cancelled" value={analytics.transactions.cancelled} />
          </Section>
          <Section title="Sustainability" icon={Layers}>
            <Stat label="Items reused" value={analytics.sustainability.items_reused} />
            <Stat label="Waste avoided" value={`${analytics.sustainability.estimated_weight_saved_kg} kg`} />
            <Stat label="CO₂ avoided" value={`${analytics.sustainability.estimated_co2_saved_kg} kg`} />
          </Section>
          <Section title="Reports" icon={AlertTriangle}>
            <Stat label="Pending" value={analytics.reports.pending} />
            <Stat label="Resolved" value={analytics.reports.resolved} />
          </Section>
        </div>
      )}

      {tab === 'Users' && (
        <div className="mt-6 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium text-navy-900">{u.full_name}</p>
                <p className="text-xs text-navy-500">{u.email} · {u.location}</p>
              </div>
              <div className="flex items-center gap-2">
                {u.is_seller && <Badge tone="sky">Seller</Badge>}
                <Badge tone={u.is_active ? 'teal' : 'red'}>{u.is_active ? 'Active' : 'Suspended'}</Badge>
                {!u.is_staff && (
                  <Button size="sm" variant={u.is_active ? 'danger' : 'outline'} onClick={() => toggleUser(u)}>
                    {u.is_active ? 'Suspend' : 'Reactivate'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Categories' && (
        <div className="mt-6">
          <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
            <Input placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="max-w-xs" />
            <Button type="submit" size="sm">Add category</Button>
          </form>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-sand-200 bg-white px-3 py-2 text-sm">
                <span>{c.name} <span className="text-navy-400">({c.product_count ?? 0})</span></span>
                <button onClick={() => handleDeleteCategory(c.id)} className="text-xs text-red-600">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Reports' && (
        <div className="mt-6 space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-900">{r.reason.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-navy-500">{formatDate(r.created_at)}</p>
                </div>
                <Badge tone={r.status === 'PENDING' ? 'amber' : r.status === 'RESOLVED' ? 'teal' : 'neutral'}>{r.status}</Badge>
              </div>
              {r.description && <p className="mt-2 text-sm text-navy-700">{r.description}</p>}
              {r.status === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="accent" onClick={() => updateReportStatus(r.id, 'RESOLVED')}>Resolve</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateReportStatus(r.id, 'DISMISSED')}>Dismiss</Button>
                </div>
              )}
            </div>
          ))}
          {!reports.length && <p className="text-sm text-navy-600">No reports.</p>}
        </div>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-navy-900">
        <Icon size={16} className="text-teal-600" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">{children}</div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold text-navy-900">{value}</p>
      <p className="text-xs text-navy-500">{label}</p>
    </div>
  )
}
