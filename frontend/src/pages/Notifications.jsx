import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications'
import { timeAgo } from '../utils/format'
import { notificationIcon, useNotifications } from '../context/NotificationsContext'

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'unread', label: 'Unread', match: (n) => !n.is_read },
  { key: 'messages', label: 'Messages', match: (n) => n.type === 'MESSAGE' },
  { key: 'requests', label: 'Requests', match: (n) => n.type.startsWith('EXCHANGE') || n.type.startsWith('DONATION') },
  { key: 'orders', label: 'Orders', match: (n) => n.type === 'ORDER' || n.type === 'PRODUCT_SOLD' },
]

export default function Notifications() {
  const navigate = useNavigate()
  const { refresh } = useNotifications()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchNotifications().then((data) => setNotifications(data.results || data)).finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)
    return notifications.filter(f.match)
  }, [notifications, filter])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function open(n) {
    if (!n.is_read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      try {
        await markNotificationRead(n.id)
      } catch {
        // Not critical.
      }
      refresh()
    }
    if (n.link) navigate(n.link)
  }

  async function handleMarkAll() {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    refresh()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-navy-600">
            {unreadCount ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAll}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = notifications.filter((n) => f.match(n) && !n.is_read).length
          const activeTab = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab ? 'border-teal-600 bg-teal-600 text-on-accent' : 'border-sand-300 bg-surface text-navy-700 hover:border-teal-400'
              }`}
            >
              {f.label}
              {count > 0 && f.key !== 'unread' && (
                <span className={`rounded-full px-1.5 text-[11px] font-bold ${activeTab ? 'bg-on-accent/20' : 'bg-teal-50 text-teal-700'}`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {!visible.length ? (
        <div className="glass-card mt-6 flex flex-col items-center gap-3 rounded-3xl border border-sand-200 bg-surface px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Bell size={26} />
          </span>
          <p className="font-semibold text-navy-900">{filter === 'all' ? 'No notifications yet' : 'Nothing here'}</p>
          <p className="max-w-sm text-sm text-navy-600">
            You'll see new messages, exchange and donation requests, and order updates here.
          </p>
        </div>
      ) : (
        <ul className="glass-card mt-6 divide-y divide-sand-200 overflow-hidden rounded-3xl border border-sand-200 bg-surface">
          {visible.map((n) => {
            const Icon = notificationIcon(n.type)
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-sand-100 sm:px-5 ${
                    n.is_read ? '' : 'bg-teal-50/60'
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      n.is_read ? 'bg-sand-100 text-navy-600' : 'bg-teal-600 text-on-accent'
                    }`}
                  >
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm ${n.is_read ? 'font-medium text-navy-800' : 'font-bold text-navy-900'}`}>{n.title}</span>
                      {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500" aria-label="Unread" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-navy-600">{n.message}</span>
                    <span className="mt-1 block text-xs text-navy-500">{timeAgo(n.created_at)}</span>
                  </span>
                  {n.link && <ChevronRight size={18} className="shrink-0 text-navy-400" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
