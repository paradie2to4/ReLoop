const TONES = {
  neutral: 'bg-sand-100 text-navy-700 border-sand-300',
  teal: 'bg-teal-50 text-teal-700 border-teal-300',
  sky: 'bg-sky-50 text-sky-600 border-sky-300',
  amber: 'bg-amber-50 text-amber-700 border-amber-300',
  red: 'bg-red-50 text-red-700 border-red-300',
  navy: 'bg-navy-900 text-sand-50 border-navy-900',
}

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
