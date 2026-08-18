import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { apiErrorMessage } from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(location.state?.from?.pathname || '/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid email or password.'))
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
        <h1 className="text-xl font-semibold text-navy-900">Welcome back</h1>
        <p className="mt-1 text-sm text-navy-600">Log in to continue giving products another life.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-teal-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-6 w-full rounded-lg border border-dashed border-sand-300 bg-white/60 p-4 text-xs text-navy-600">
        <p className="font-medium text-navy-800">Demo accounts (password: DemoPass123!)</p>
        <p>admin@example.com · seller@example.com · customer@example.com</p>
      </div>
    </div>
  )
}
