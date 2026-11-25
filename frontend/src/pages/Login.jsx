import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/layout/AuthShell'
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
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue giving products another life."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-teal-600 hover:underline">
            Sign up free
          </Link>
        </>
      }
      aside={
        <div className="mt-4 w-full rounded-2xl border border-dashed border-sand-300 bg-surface/60 p-4 text-xs text-navy-600">
          <p className="font-semibold text-navy-800">Try a demo account (password: DemoPass123!)</p>
          <p className="mt-1">admin@example.com · seller@example.com · customer@example.com</p>
        </div>
      }
    >
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <Button type="submit" variant="accent" size="lg" className="w-full" loading={loading}>
            Log in
          </Button>
        </form>
    </AuthShell>
  )
}
