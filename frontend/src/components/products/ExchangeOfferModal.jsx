import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import { fetchProducts } from '../../services/products'
import { createExchange } from '../../services/exchanges'
import { apiErrorMessage } from '../../services/api'

export default function ExchangeOfferModal({ open, onClose, requestedProduct, onSuccess }) {
  const [myProducts, setMyProducts] = useState([])
  const [form, setForm] = useState({ offered_product: '', additional_cash: '0', message: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchProducts({ mine: true }).then((data) => {
      setMyProducts(
        data.results.filter(
          (p) =>
            p.id !== requestedProduct.id &&
            p.status === 'ACTIVE' &&
            ['FOR_EXCHANGE', 'SALE_OR_EXCHANGE'].includes(p.transaction_type),
        ),
      )
    })
  }, [open, requestedProduct])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.offered_product) {
      setError('Select one of your products to offer.')
      return
    }
    setLoading(true)
    try {
      await createExchange({
        offered_product: form.offered_product,
        requested_product: requestedProduct.id,
        additional_cash: form.additional_cash || 0,
        message: form.message,
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send exchange offer.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Offer an exchange for "${requestedProduct.title}"`}>
      {myProducts.length === 0 ? (
        <p className="text-sm text-navy-600">
          You need an active listing marked "For Exchange" or "Sale or Exchange" before you can make an offer.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Your product to offer"
            placeholder="Choose one of your listings"
            value={form.offered_product}
            onChange={(e) => setForm({ ...form, offered_product: e.target.value })}
            options={myProducts.map((p) => ({ value: p.id, label: p.title }))}
          />
          <Input
            label="Additional cash (optional, RWF)"
            type="number"
            min="0"
            value={form.additional_cash}
            onChange={(e) => setForm({ ...form, additional_cash: e.target.value })}
          />
          <Textarea
            label="Message"
            placeholder="Tell the seller why this is a fair swap..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Send exchange offer
          </Button>
        </form>
      )}
    </Modal>
  )
}
