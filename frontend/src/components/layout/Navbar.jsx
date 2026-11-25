import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Heart, Leaf, Menu, Moon, Plus, ShoppingCart, Sun, User, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../hooks/useTheme'

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
              <Link to="/wishlist" className={iconLink} aria-label="Wishlist">
                <Heart size={19} />
              </Link>
              <Link to="/notifications" className={iconLink} aria-label="Notifications">
                <Bell size={19} />
              </Link>
              <Link to="/cart" className={iconLink} aria-label="Cart">
                <ShoppingCart size={19} />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-on-accent">
                    {itemCount}
                  </span>
                )}
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 bg-sand-100 text-navy-800 transition-colors hover:border-teal-500"
                >
                  <User size={16} />
                </button>
                {menuOpen && (
                  <div className="glass-card absolute right-0 mt-2 w-56 rounded-xl border border-sand-200 bg-surface py-1.5 shadow-xl shadow-black/10">
                    <p className="truncate border-b border-sand-200 px-4 py-2 text-xs text-navy-500">{user?.email}</p>
                    <MenuLink to="/profile" onClick={() => setMenuOpen(false)}>My Profile</MenuLink>
                    <MenuLink to="/orders" onClick={() => setMenuOpen(false)}>My Orders</MenuLink>
                    <MenuLink to="/exchange-requests" onClick={() => setMenuOpen(false)}>Exchange Requests</MenuLink>
                    <MenuLink to="/donation-requests" onClick={() => setMenuOpen(false)}>Donation Requests</MenuLink>
                    <MenuLink to="/repair-requests" onClick={() => setMenuOpen(false)}>Repair Requests</MenuLink>
                    <MenuLink to="/messages" onClick={() => setMenuOpen(false)}>Messages</MenuLink>
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
          <button className="rounded-lg p-2 text-navy-900 hover:bg-sand-200" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
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

function MenuLink({ to, children, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-2 text-sm text-navy-800 hover:bg-sand-100">
      {children}
    </Link>
  )
}
