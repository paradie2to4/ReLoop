import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

// data-theme="dark" keeps the footer dark in both light and dark mode.
export default function Footer() {
  return (
    <footer data-theme="dark" className="mt-16 border-t border-sand-200 bg-sand-50 text-navy-700">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-on-accent">
                <Leaf size={16} />
              </span>
              ReLoop
            </div>
            <p className="mt-3 max-w-xs text-sm text-navy-600">
              Give products another life. Buy less new, reuse more, save money and reduce waste.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1 text-xs text-navy-700">
              Pay with MTN MoMo or cash on pickup
            </p>
          </div>
          <FooterColumn
            title="Marketplace"
            links={[
              ['Browse all', '/marketplace'],
              ['Sell an item', '/sell'],
              ['Donations', '/marketplace?transaction_type=FREE_DONATION'],
              ['Exchange', '/marketplace?transaction_type=FOR_EXCHANGE'],
              ['Repair providers', '/repair-providers'],
            ]}
          />
          <FooterColumn
            title="Account"
            links={[
              ['My profile', '/profile'],
              ['My orders', '/orders'],
              ['Wishlist', '/wishlist'],
              ['Impact dashboard', '/impact'],
              ['Messages', '/messages'],
            ]}
          />
          <FooterColumn title="Company" links={[['About the circular economy', '/#impact']]} />
        </div>
        <div className="mt-10 border-t border-sand-200 pt-6 text-xs text-navy-500">
          © {new Date().getFullYear()} ReLoop. Made in Rwanda.
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-navy-900">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-navy-600 transition-colors hover:text-teal-600">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
