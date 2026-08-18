import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-sand-200 bg-navy-950 text-sand-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Leaf className="text-teal-400" size={20} /> ReLoop
            </div>
            <p className="mt-3 max-w-xs text-sm text-sand-100/70">
              Give products another life. Buy less new, reuse more, save money and reduce waste.
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
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-sand-100/50">
          © {new Date().getFullYear()} ReLoop.
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-sand-100/70 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
