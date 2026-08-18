import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-navy-600 hover:bg-sand-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-sand-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
