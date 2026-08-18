import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications'
import { timeAgo } from '../utils/format'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications().then((data) => setNotifications(data.results || data)).finally(() => setLoading(false))
  }, [])

  async function handleMarkRead(id) {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function handleMarkAll() {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy-900">Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <Button size="sm" variant="ghost" onClick={handleMarkAll}>
            Mark all as read
          </Button>
        )}
      </div>

      {!notifications.length ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You'll see updates about orders, exchanges, donations and messages here." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`flex w-full items-start justify-between gap-4 rounded-lg border p-4 text-left ${
                n.is_read ? 'border-sand-200 bg-white' : 'border-teal-300 bg-teal-50'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-navy-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-navy-600">{n.message}</p>
                <p className="mt-1 text-xs text-navy-500">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
