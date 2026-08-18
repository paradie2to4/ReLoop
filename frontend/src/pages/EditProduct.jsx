import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ImageUploader from '../components/products/ImageUploader'
import {
  deleteProduct,
  deleteProductImage,
  fetchCategories,
  fetchProduct,
  updateProduct,
  uploadProductImage,
} from '../services/products'
import { apiErrorMessage } from '../services/api'
import { CONDITIONS, LOCATIONS, PRODUCT_STATUSES, TRANSACTION_TYPES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(null)
  const [newImages, setNewImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchProduct(id), fetchCategories()]).then(([p, cats]) => {
      setProduct(p)
      setCategories(cats)
      setForm({
        title: p.title, description: p.description, category: p.category_slug ? cats.find((c) => c.slug === p.category_slug)?.id : '',
        condition: p.condition, transaction_type: p.transaction_type, price: p.price, location: p.location,
        quantity: p.quantity, status: p.status,
      })
    }).catch((err) => setError(apiErrorMessage(err, 'Could not load product.'))).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!product || !form) return <p className="text-sm text-red-600">{error}</p>
  if (user?.id !== product.seller?.id) return <p className="text-sm text-red-600">You don't have permission to edit this listing.</p>

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateProduct(id, form)
      for (let i = 0; i < newImages.length; i++) {
        await uploadProductImage(id, newImages[i], product.images.length === 0 && i === 0)
      }
      navigate(`/products/${id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save changes.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteImage(imageId) {
    await deleteProductImage(id, imageId)
    setProduct({ ...product, images: product.images.filter((img) => img.id !== imageId) })
  }

  async function handleDelete() {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return
    await deleteProduct(id)
    navigate('/seller/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy-900">Edit listing</h1>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          <Trash2 size={14} /> Delete
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-sand-200 bg-white p-6">
        <Input label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} />
        <Textarea label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} />
        <Select label="Category" value={form.category} onChange={(e) => update('category', e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Condition" value={form.condition} onChange={(e) => update('condition', e.target.value)} options={CONDITIONS} />
        <Select label="Transaction type" value={form.transaction_type} onChange={(e) => update('transaction_type', e.target.value)} options={TRANSACTION_TYPES} />
        {['FOR_SALE', 'SALE_OR_EXCHANGE'].includes(form.transaction_type) && (
          <Input label="Price (RWF)" type="number" min="1" value={form.price} onChange={(e) => update('price', e.target.value)} />
        )}
        <Select label="Location" value={form.location} onChange={(e) => update('location', e.target.value)} options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
        <Input label="Quantity" type="number" min="0" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
        <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)} options={PRODUCT_STATUSES} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-navy-800">Current images</p>
          <div className="flex flex-wrap gap-2">
            {product.images.map((img) => (
              <div key={img.id} className="group relative h-16 w-16 overflow-hidden rounded-md border border-sand-200">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => handleDeleteImage(img.id)} className="absolute inset-0 flex items-center justify-center bg-navy-950/60 text-white opacity-0 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-navy-800">Add more images</p>
          <ImageUploader files={newImages} onChange={setNewImages} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={saving} className="w-full">
          Save changes
        </Button>
      </form>
    </div>
  )
}
