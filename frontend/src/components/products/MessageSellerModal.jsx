import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import { startConversation } from '../../services/messaging'
import { apiErrorMessage } from '../../services/api'

export default function MessageSellerModal({ open, onClose, product }) {
  const navigate = useNavigate()
  const [text, setText] = useState(`Hi, is "${product.title}" still available?`)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const conversation = await startConversation({
        recipient_id: product.seller.id,
        product_id: product.id,
        text,
      })
      onClose()
      navigate(`/messages/${conversation.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send message.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Message ${product.seller?.full_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea label="Message" required value={text} onChange={(e) => setText(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Send message
        </Button>
      </form>
    </Modal>
  )
}
