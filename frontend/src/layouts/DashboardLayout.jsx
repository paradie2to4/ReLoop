import { NavLink, Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function DashboardLayout({ title, links }) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-60">
          <h2 className="font-display text-lg font-semibold text-navy-900">{title}</h2>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-navy-900 text-sand-50' : 'text-navy-700 hover:bg-sand-200'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
