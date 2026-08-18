import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './ui/LoadingSpinner'

export default function ProtectedRoute({ requireSeller = false, requireAdmin = false }) {
  const { isAuthenticated, isSeller, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner label="Loading your account..." />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (requireSeller && !isSeller) {
    return <Navigate to="/become-seller" replace />
  }
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
