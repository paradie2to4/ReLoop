import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import * as authService from '../services/auth'
import Button from '../components/ui/Button'

export default function BecomeSeller() {
  const { refreshUser, isSeller } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleBecomeSeller() {
    setLoading(true)
    try {
      await authService.becomeSeller()
      await refreshUser()
      navigate('/sell')
    } finally {
      setLoading(false)
    }
  }

  if (isSeller) {
    navigate('/sell')
    return null
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-lg border border-sand-200 bg-white p-10 text-center">
      <Store size={36} className="text-teal-600" />
      <h1 className="text-xl font-semibold text-navy-900">Become a ReLoop seller</h1>
      <p className="text-sm text-navy-600">
        Unlock the ability to list products for sale, exchange or donation. It only takes a second — no fees to get started.
      </p>
      <Button onClick={handleBecomeSeller} loading={loading} variant="accent">
        Enable selling
      </Button>
    </div>
  )
}
