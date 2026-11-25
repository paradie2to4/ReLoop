import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Gift, MessageCircle, Package, Repeat, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { fetchNotificationSummary, markNotificationRead } from '../services/notifications'

const POLL_MS = 15000
const TOAST_MS = 7000

const EMPTY = {
  unread_notifications: 0,
  unread_messages: 0,
  pending_exchange_requests: 0,
  pending_donation_requests: 0,
  latest: [],
}

const NotificationsContext = createContext({ ...EMPTY, refresh: () => {} })

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(EMPTY)
  const [toasts, setToasts] = useState([])
  const seenIds = useRef(null) // null until the first load, so old notifications don't pop up

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await fetchNotificationSummary()
      setSummary(data)
      const latest = data.latest || []
      if (seenIds.current === null) {
        seenIds.current = new Set(latest.map((n) => n.id))
        return
      }
      const fresh = latest.filter((n) => !seenIds.current.has(n.id))
      fresh.forEach((n) => seenIds.current.add(n.id))
      // Don't pop up a message alert for the chat that's already open.
      const visible = fresh.filter((n) => !(n.type === 'MESSAGE' && n.link && window.location.pathname === n.link))
      if (visible.length) setToasts((t) => [...visible.reverse(), ...t].slice(0, 3))
    } catch {
      // Offline or the server is waking up; try again on the next tick.
    }
  }, [isAuthenticated])

  // Poll while logged in, and refresh when the tab regains focus or the page changes.
  useEffect(() => {
    if (!isAuthenticated) {
      setSummary(EMPTY)
      seenIds.current = null
      return undefined
    }
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [isAuthenticated, refresh])

  useEffect(() => {
    refresh()
  }, [location.pathname, refresh])

  // Show the unread count in the browser tab title, e.g. "(3) ReLoop".
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '')
    const count = summary.unread_notifications
    document.title = count > 0 ? `(${count}) ${base}` : base
  }, [summary.unread_notifications])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((n) => n.id !== id)), [])

  async function openToast(n) {
    dismiss(n.id)
    try {
      await markNotificationRead(n.id)
    } catch {
      // Not critical.
    }
    if (n.link) navigate(n.link)
    refresh()
  }

  return (
    <NotificationsContext.Provider value={{ ...summary, refresh }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((n) => (
          <Toast key={n.id} notification={n} onOpen={() => openToast(n)} onClose={() => dismiss(n.id)} />
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}

export const NOTIFICATION_STYLE = {
  MESSAGE: { icon: MessageCircle, label: 'Message' },
  EXCHANGE_REQUEST: { icon: Repeat, label: 'Exchange request' },
  EXCHANGE_ACCEPTED: { icon: Repeat, label: 'Exchange' },
  EXCHANGE_REJECTED: { icon: Repeat, label: 'Exchange' },
  DONATION_REQUEST: { icon: Gift, label: 'Donation request' },
  DONATION_ACCEPTED: { icon: Gift, label: 'Donation' },
  ORDER: { icon: Package, label: 'Order' },
  PRODUCT_SOLD: { icon: Package, label: 'Order' },
}

export function notificationIcon(type) {
  return NOTIFICATION_STYLE[type]?.icon || Bell
}

function Toast({ notification: n, onOpen, onClose }) {
  const Icon = notificationIcon(n.type)

  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      role="status"
      className="glass-card pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-sand-200 bg-surface p-3.5 shadow-2xl shadow-black/20"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-on-accent">
        <Icon size={18} />
      </span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-navy-900">{n.title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-navy-600">{n.message}</p>
        {n.link && <p className="mt-1 text-xs font-semibold text-teal-600">Open</p>}
      </button>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="rounded-lg p-1 text-navy-500 hover:bg-sand-200 hover:text-navy-900">
        <X size={16} />
      </button>
    </div>
  )
}
