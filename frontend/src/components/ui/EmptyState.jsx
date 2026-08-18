export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-sand-300 py-16 px-6 text-center ${className}`}>
      {Icon && <Icon size={32} className="text-navy-500/60" />}
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-navy-600">{description}</p>}
      {action}
    </div>
  )
}
