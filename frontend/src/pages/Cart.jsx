import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { formatRWF } from '../utils/format'
import { checkout } from '../services/orders'
import { apiErrorMessage } from '../services/api'
import { PAYMENT_METHODS } from '../utils/constants'

export default function Cart() {
  const { cart, updateItem, removeItem, refreshCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ payment_method: 'CASH', shipping_location: user?.location || '', notes: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const items = cart.items || []

  async function handleCheckout(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const order = await checkout(form)
      await refreshCart()
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Checkout failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Browse the marketplace to find your next great find."
        action={<Button as={Link} to="/marketplace" className="mt-2">Explore Marketplace</Button>}
      />
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">Your Cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border border-sand-200 bg-white p-4">
              <Link to={`/products/${item.product.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-sand-100">
                {item.product.primary_image && <img src={item.product.primary_image} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link to={`/products/${item.product.id}`} className="text-sm font-medium text-navy-900 hover:underline">
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-navy-500">{formatRWF(item.product.price)} each</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))} className="rounded-md border border-sand-300 p-1">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="rounded-md border border-sand-300 p-1">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-navy-900">{formatRWF(item.subtotal)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleCheckout} className="h-fit space-y-4 rounded-lg border border-sand-200 bg-white p-6">
          <h2 className="font-semibold text-navy-900">Checkout</h2>
          <div className="flex justify-between border-b border-sand-100 pb-3 text-sm">
            <span className="text-navy-600">Total</span>
            <span className="font-semibold text-navy-900">{formatRWF(cart.total)}</span>
          </div>
          <Select label="Payment method" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} options={PAYMENT_METHODS} />
          <Input label="Pickup / delivery location" required value={form.shipping_location} onChange={(e) => setForm({ ...form, shipping_location: e.target.value })} />
          <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <p className="text-xs text-navy-500">Online payments aren't live yet — pay in cash on pickup or delivery.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={submitting}>
            Place order
          </Button>
        </form>
      </div>
    </div>
  )
}
