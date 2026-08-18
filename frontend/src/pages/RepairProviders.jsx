import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, MapPin, Phone, Wrench } from 'lucide-react'
import Rating from '../components/ui/Rating'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Textarea from '../components/ui/Textarea'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { createRepairRequest, fetchRepairProviders } from '../services/repairs'
import { apiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RepairProviders() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalProvider, setModalProvider] = useState(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchRepairProviders().then((data) => setProviders(data.results || data)).finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isAuthenticated) return navigate('/login')
    setError('')
    setSubmitting(true)
    try {
      await createRepairRequest({ repair_provider: modalProvider.id, problem_description: description })
      setSuccess(`Request sent to ${modalProvider.name}.`)
      setModalProvider(null)
      setDescription('')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send repair request.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Repair Providers</h1>
          <p className="mt-1 text-sm text-navy-600">Fix instead of replace — find a trusted local repair service.</p>
        </div>
      </div>

      {success && <p className="mt-4 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-700">{success}</p>}

      {!providers.length ? (
        <EmptyState icon={Wrench} title="No repair providers available yet" className="mt-6" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <div key={p.id} className="rounded-lg border border-sand-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-navy-900">{p.name}</p>
                  <p className="text-xs text-teal-600">{p.specialization}</p>
                </div>
                <Rating value={p.rating} />
              </div>
              <p className="mt-2 text-sm text-navy-600">{p.description}</p>
              <div className="mt-3 space-y-1 text-xs text-navy-500">
                <p className="flex items-center gap-1"><MapPin size={12} /> {p.location}</p>
                <p className="flex items-center gap-1"><Phone size={12} /> {p.phone}</p>
                {p.email && <p className="flex items-center gap-1"><Mail size={12} /> {p.email}</p>}
              </div>
              <Button size="sm" variant="accent" className="mt-4 w-full" onClick={() => setModalProvider(p)}>
                Request repair
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modalProvider} onClose={() => setModalProvider(null)} title={`Request repair from ${modalProvider?.name || ''}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea label="Describe the problem" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs fixing?" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={submitting}>
            Send request
          </Button>
        </form>
      </Modal>
    </div>
  )
}
