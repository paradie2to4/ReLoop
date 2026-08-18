import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import { apiErrorMessage } from '../services/api'
import { LOCATIONS } from '../utils/constants'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', password2: '', location: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    if (form.password !== form.password2) {
      setErrors({ password2: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        setErrors(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      } else {
        setErrors({ non_field_errors: apiErrorMessage(err) })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12">
      <Link to="/" className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-navy-900">
        <Leaf className="text-teal-600" /> ReLoop
      </Link>
      <div className="w-full rounded-lg border border-sand-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-navy-900">Create your account</h1>
        <p className="mt-1 text-sm text-navy-600">Join the circular marketplace — it's free.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="Full name" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} error={errors.full_name} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} />
          <Select
            label="Location"
            placeholder="Select your city"
            required
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            options={LOCATIONS.map((l) => ({ value: l, label: l }))}
            error={errors.location}
          />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} hint="At least 8 characters." />
          <Input label="Confirm password" type="password" required value={form.password2} onChange={(e) => update('password2', e.target.value)} error={errors.password2} />
          {errors.non_field_errors && <p className="text-sm text-red-600">{errors.non_field_errors}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-teal-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
