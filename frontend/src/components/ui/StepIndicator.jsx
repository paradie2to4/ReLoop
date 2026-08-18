import { Check } from 'lucide-react'

export default function StepIndicator({ steps, current }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo'
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                state === 'done'
                  ? 'bg-teal-600 text-white'
                  : state === 'active'
                    ? 'bg-navy-900 text-sand-50'
                    : 'bg-sand-200 text-navy-500'
              }`}
            >
              {state === 'done' ? <Check size={12} /> : i + 1}
            </span>
            <span className={`text-xs font-medium ${state === 'todo' ? 'text-navy-500' : 'text-navy-900'}`}>{step}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-sand-300 sm:w-8" />}
          </li>
        )
      })}
    </ol>
  )
}
