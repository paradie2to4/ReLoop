import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from '../components/ui/StepIndicator'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import ImageUploader from '../components/products/ImageUploader'
import ConditionBadge from '../components/products/ConditionBadge'
import PriceTag from '../components/products/PriceTag'
import { createProduct, fetchCategories, uploadProductImage } from '../services/products'
import { apiErrorMessage } from '../services/api'
import { CONDITIONS, LOCATIONS, TRANSACTION_TYPES } from '../utils/constants'

const STEPS = ['Basic Info', 'Condition', 'Transaction', 'Price', 'Location', 'Images', 'Preview']

const INITIAL_FORM = {
  title: '', description: '', category: '', condition: '', transaction_type: '', price: '', location: '', quantity: 1,
}

export default function SellItem() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [images, setImages] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validateStep() {
    if (step === 0 && (!form.title.trim() || !form.description.trim() || !form.category)) {
      return 'Please fill in title, description and category.'
    }
    if (step === 1 && !form.condition) return 'Please select a condition.'
    if (step === 2 && !form.transaction_type) return 'Please select a transaction type.'
    if (step === 3 && ['FOR_SALE', 'SALE_OR_EXCHANGE'].includes(form.transaction_type) && (!form.price || Number(form.price) <= 0)) {
      return 'Please enter a price greater than 0.'
    }
    if (step === 4 && !form.location) return 'Please select a location.'
    return ''
  }

  function next() {
    const validationError = validateStep()
    if (validationError) return setError(validationError)
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handlePublish() {
    setSubmitting(true)
    setError('')
    try {
      const product = await createProduct({
        ...form,
        price: ['FOR_SALE', 'SALE_OR_EXCHANGE'].includes(form.transaction_type) ? form.price : 0,
      })
      for (let i = 0; i < images.length; i++) {
        await uploadProductImage(product.id, images[i], i === 0)
      }
      navigate(`/products/${product.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not publish listing.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-navy-900">Sell, exchange or donate an item</h1>
      <p className="mt-1 text-sm text-navy-600">Give your product another life instead of throwing it away.</p>

      <StepIndicator steps={STEPS} current={step} />

      <div className="rounded-lg border border-sand-200 bg-white p-6">
        {step === 0 && (
          <div className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Used Mountain Bicycle" />
            <Textarea label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the item, any flaws, why you're letting it go..." rows={5} />
            <Select label="Category" placeholder="Select a category" value={form.category} onChange={(e) => update('category', e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => update('condition', c.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  form.condition === c.value ? 'border-teal-500 bg-teal-50' : 'border-sand-200 hover:border-navy-300'
                }`}
              >
                <ConditionBadge condition={c.value} />
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {TRANSACTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update('transaction_type', t.value)}
                className={`block w-full rounded-lg border p-4 text-left transition-colors ${
                  form.transaction_type === t.value ? 'border-teal-500 bg-teal-50' : 'border-sand-200 hover:border-navy-300'
                }`}
              >
                <p className="text-sm font-medium text-navy-900">{t.label}</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            {['FOR_SALE', 'SALE_OR_EXCHANGE'].includes(form.transaction_type) ? (
              <Input label="Price (RWF)" type="number" min="1" value={form.price} onChange={(e) => update('price', e.target.value)} />
            ) : (
              <p className="rounded-md bg-sand-100 p-4 text-sm text-navy-700">
                This transaction type doesn't require a price — it's free.
              </p>
            )}
            <Input label="Quantity available" type="number" min="1" className="mt-4" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
          </div>
        )}

        {step === 4 && (
          <Select label="Location" placeholder="Select your city" value={form.location} onChange={(e) => update('location', e.target.value)} options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
        )}

        {step === 5 && <ImageUploader files={images} onChange={setImages} />}

        {step === 6 && (
          <div>
            <p className="mb-4 text-sm text-navy-600">Review your listing before publishing.</p>
            <div className="overflow-hidden rounded-lg border border-sand-200">
              {images[0] && <img src={URL.createObjectURL(images[0])} alt="" className="aspect-[4/3] w-full object-cover" />}
              <div className="p-4">
                <h3 className="font-medium text-navy-900">{form.title}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <PriceTag price={form.price} transactionType={form.transaction_type} />
                  <ConditionBadge condition={form.condition} />
                </div>
                <p className="mt-2 text-sm text-navy-600">{form.location}</p>
                <p className="mt-3 whitespace-pre-line text-sm text-navy-700">{form.description}</p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={handlePublish} loading={submitting} variant="accent">
              Publish listing
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
