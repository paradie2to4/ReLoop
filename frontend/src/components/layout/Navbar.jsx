import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Heart, Leaf, Menu, Plus, ShoppingCart, User, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const NAV_LINKS = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/marketplace?transaction_type=FREE_DONATION', label: 'Donate' },
  { to: '/marketplace?transaction_type=FOR_EXCHANGE', label: 'Exchange' },
  { to: '/repair-providers', label: 'Repair' },
]

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

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-navy-900">
          <Leaf className="text-teal-600" size={22} />
          ReLoop
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-navy-700 hover:text-navy-900"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link to="/sell" className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-teal-700">
                <Plus size={16} /> Sell an item
              </Link>
              <Link to="/wishlist" className="rounded-md p-2 text-navy-700 hover:bg-sand-200" aria-label="Wishlist">
                <Heart size={20} />
              </Link>
              <Link to="/notifications" className="rounded-md p-2 text-navy-700 hover:bg-sand-200" aria-label="Notifications">
                <Bell size={20} />
              </Link>
              <Link to="/cart" className="relative rounded-md p-2 text-navy-700 hover:bg-sand-200" aria-label="Cart">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-semibold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sand-50"
                >
                  <User size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-md border border-sand-200 bg-white py-1.5 shadow-lg">
                    <p className="truncate border-b border-sand-100 px-4 py-2 text-xs text-navy-500">{user?.email}</p>
                    <MenuLink to="/profile" onClick={() => setMenuOpen(false)}>My Profile</MenuLink>
                    <MenuLink to="/orders" onClick={() => setMenuOpen(false)}>My Orders</MenuLink>
                    <MenuLink to="/exchange-requests" onClick={() => setMenuOpen(false)}>Exchange Requests</MenuLink>
                    <MenuLink to="/donation-requests" onClick={() => setMenuOpen(false)}>Donation Requests</MenuLink>
                    <MenuLink to="/repair-requests" onClick={() => setMenuOpen(false)}>Repair Requests</MenuLink>
                    <MenuLink to="/messages" onClick={() => setMenuOpen(false)}>Messages</MenuLink>
                    <MenuLink to="/impact" onClick={() => setMenuOpen(false)}>Impact Dashboard</MenuLink>
                    {user?.is_seller && <MenuLink to="/seller/dashboard" onClick={() => setMenuOpen(false)}>Seller Dashboard</MenuLink>}
                    {user?.role === 'admin' && <MenuLink to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Admin Dashboard</MenuLink>}
                    <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-sand-50">
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-navy-800 hover:text-navy-900">
                Log in
              </Link>
              <Link to="/register" className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-navy-800">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button className="p-2 lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
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
                <Link to="/sell" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-teal-700">Sell an item</Link>
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
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-navy-800">Sign up</Link>
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
    <Link to={to} onClick={onClick} className="block px-4 py-2 text-sm text-navy-800 hover:bg-sand-50">
      {children}
    </Link>
  )
}
