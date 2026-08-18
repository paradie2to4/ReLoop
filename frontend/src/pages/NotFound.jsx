import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="font-display text-6xl font-semibold text-navy-900">404</p>
      <h1 className="text-lg font-semibold text-navy-900">Page not found</h1>
      <p className="max-w-sm text-sm text-navy-600">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button as={Link} to="/">
        Back to home
      </Button>
    </div>
  )
}
