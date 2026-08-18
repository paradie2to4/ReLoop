import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 py-12 px-6 text-center">
      <AlertCircle size={28} className="text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-red-700 underline">
          Try again
        </button>
      )}
    </div>
  )
}
