import { useState } from 'react'
import Modal from '../ui/Modal'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import { requestDonation } from '../../services/donations'
import { apiErrorMessage } from '../../services/api'

export default function DonationRequestModal({ open, onClose, product, onSuccess }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestDonation({ product: product.id, message })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send donation request.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request "${product.title}"`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-navy-600">
          Let the donor know why you'd like this item and when you could pick it up.
        </p>
        <Textarea
          label="Message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi! I'd love to give this a new home..."
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Send request
        </Button>
      </form>
    </Modal>
  )
}
