import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Heart, Leaf, Menu, MessageCircle, Moon, Plus, ShoppingCart, Sun, User, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useNotifications } from '../../context/NotificationsContext'
import { useTheme } from '../../hooks/useTheme'

function CountBadge({ count, alert = false }) {
  if (!count) return null
  return (
    <span
      className={`absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-sand-50 ${
        alert ? 'bg-red-500 text-white' : 'bg-teal-600 text-on-accent'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

const NAV_LINKS = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/marketplace?transaction_type=FREE_DONATION', label: 'Donate' },
  { to: '/marketplace?transaction_type=FOR_EXCHANGE', label: 'Exchange' },
  { to: '/repair-providers', label: 'Repair' },
]

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-display text-xl font-bold text-navy-900 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-on-accent">
        <Leaf size={18} />
      </span>
      ReLoop
    </Link>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="rounded-lg p-2 text-navy-700 transition-colors hover:bg-sand-200 hover:text-navy-900"
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  const { unread_notifications, unread_messages, pending_exchange_requests, pending_donation_requests } = useNotifications()
  const pendingRequests = pending_exchange_requests + pending_donation_requests
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const iconLink = 'relative rounded-lg p-2 text-navy-700 transition-colors hover:bg-sand-200 hover:text-navy-900'

  return (
    <header className="site-header sticky top-0 z-40 border-b border-sand-200 bg-sand-50/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:bg-sand-200 hover:text-navy-900"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 lg:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link to="/wishlist" className={iconLink} aria-label="Wishlist" title="Wishlist">
                <Heart size={19} />
              </Link>
              <Link to="/messages" className={iconLink} aria-label={`Messages${unread_messages ? `, ${unread_messages} unread` : ''}`} title="Messages">
                <MessageCircle size={19} />
                <CountBadge count={unread_messages} />
              </Link>
              <Link to="/notifications" className={iconLink} aria-label={`Notifications${unread_notifications ? `, ${unread_notifications} unread` : ''}`} title="Notifications">
                <Bell size={19} />
                <CountBadge count={unread_notifications} alert />
              </Link>
              <Link to="/cart" className={iconLink} aria-label="Cart" title="Cart">
                <ShoppingCart size={19} />
                <CountBadge count={itemCount} />
              </Link>
              <Link
                to="/sell"
                className="ml-1 flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-teal-700"
              >
                <Plus size={16} /> Sell an item
              </Link>
              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Account menu"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 bg-sand-100 text-navy-800 transition-colors hover:border-teal-500"
                >
                  <User size={16} />
                  {pendingRequests > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-sand-50" />}
                </button>
                {menuOpen && (
                  <div className="glass-card absolute right-0 mt-2 w-56 rounded-xl border border-sand-200 bg-surface py-1.5 shadow-xl shadow-black/10">
                    <p className="truncate border-b border-sand-200 px-4 py-2 text-xs text-navy-500">{user?.email}</p>
                    <MenuLink to="/profile" onClick={() => setMenuOpen(false)}>My Profile</MenuLink>
                    <MenuLink to="/orders" onClick={() => setMenuOpen(false)}>My Orders</MenuLink>
                    <MenuLink to="/exchange-requests" onClick={() => setMenuOpen(false)} count={pending_exchange_requests}>Exchange Requests</MenuLink>
                    <MenuLink to="/donation-requests" onClick={() => setMenuOpen(false)} count={pending_donation_requests}>Donation Requests</MenuLink>
                    <MenuLink to="/repair-requests" onClick={() => setMenuOpen(false)}>Repair Requests</MenuLink>
                    <MenuLink to="/messages" onClick={() => setMenuOpen(false)} count={unread_messages}>Messages</MenuLink>
                    <MenuLink to="/impact" onClick={() => setMenuOpen(false)}>Impact Dashboard</MenuLink>
                    {user?.is_seller && <MenuLink to="/seller/dashboard" onClick={() => setMenuOpen(false)}>Seller Dashboard</MenuLink>}
                    {user?.role === 'admin' && <MenuLink to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Admin Dashboard</MenuLink>}
                    <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-sand-100">
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-navy-800 transition-colors hover:bg-sand-200 hover:text-navy-900">
                Log in
              </Link>
              <Link to="/register" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-teal-700">
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button className="relative rounded-lg p-2 text-navy-900 hover:bg-sand-200" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            {!mobileOpen && (unread_notifications + unread_messages + pendingRequests > 0) && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-sand-50" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-sand-200 bg-sand-50 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/sell" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-teal-700">Sell an item</Link>
                <MobileLink to="/messages" onClick={() => setMobileOpen(false)} count={unread_messages}>Messages</MobileLink>
                <MobileLink to="/notifications" onClick={() => setMobileOpen(false)} count={unread_notifications} alert>Notifications</MobileLink>
                <MobileLink to="/exchange-requests" onClick={() => setMobileOpen(false)} count={pending_exchange_requests}>Exchange requests</MobileLink>
                <MobileLink to="/donation-requests" onClick={() => setMobileOpen(false)} count={pending_donation_requests}>Donation requests</MobileLink>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">Cart ({itemCount})</Link>
                <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">Wishlist</Link>
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">My Orders</Link>
                <Link to="/impact" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">Impact Dashboard</Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">Profile</Link>
                <button onClick={handleLogout} className="text-left text-sm font-medium text-red-600">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-teal-700">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function InlineCount({ count, alert = false }) {
  if (!count) return null
  return (
    <span
      className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
        alert ? 'bg-red-500 text-white' : 'bg-teal-600 text-on-accent'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function MenuLink({ to, children, onClick, count }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center justify-between px-4 py-2 text-sm text-navy-800 hover:bg-sand-100">
      {children}
      <InlineCount count={count} />
    </Link>
  )
}

function MobileLink({ to, children, onClick, count, alert }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center text-sm font-medium text-navy-800">
      {children}
      <InlineCount count={count} alert={alert} />
    </Link>
  )
}
