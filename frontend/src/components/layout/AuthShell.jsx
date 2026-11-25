import { Gift, Recycle, Repeat, ShieldCheck, Smartphone, Wrench } from 'lucide-react'

const FEATURES = [
  { icon: Recycle, title: 'Buy and sell second-hand', text: 'Give good items a second owner.' },
  { icon: Repeat, title: 'Swap instead of spending', text: 'Exchange what you have for what you need.' },
  { icon: Gift, title: 'Donate for free', text: 'Pass things on to neighbours who need them.' },
  { icon: Wrench, title: 'Repair, not replace', text: 'Find local repairers for broken items.' },
]

/**
 * Two-column layout for the login and sign-up pages: a branded green panel
 * on the left (large screens) and the form card on the right.
 */
export default function AuthShell({ title, subtitle, children, footer, aside }) {
  return (
    <div className="mx-auto grid max-w-6xl items-stretch gap-6 py-4 lg:grid-cols-2 lg:gap-10 lg:py-8">
      <BrandPanel />

      <div className="flex flex-col justify-center">
        <div className="glass-card w-full rounded-3xl border border-sand-200 bg-surface p-6 shadow-xl shadow-black/5 sm:p-10">
          <h1 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-navy-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-sand-200 pt-6 text-center text-sm text-navy-600">{footer}</div>}
        </div>
        {aside}
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    // data-theme="dark" keeps this panel deep green with light text in both modes.
    <aside
      data-theme="dark"
      className="relative isolate hidden overflow-hidden rounded-3xl p-10 text-navy-900 lg:flex lg:flex-col"
      style={{ background: 'linear-gradient(140deg, #0b3324 0%, #064e3b 55%, #0f766e 100%)' }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-teal-400/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-teal-300">
        <Recycle size={14} /> Rwanda's circular marketplace
      </span>
      <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white">
        Give products <span className="text-teal-300">another life.</span>
      </h2>
      <p className="mt-4 max-w-md text-base text-white/75">
        Join neighbours across Rwanda who buy, swap, donate and repair instead of throwing things away.
      </p>

      <ul className="mt-10 grid gap-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
              <Icon size={20} />
            </span>
            <span>
              <span className="block font-semibold text-white">{title}</span>
              <span className="block text-sm text-white/65">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-10 text-sm text-white/70">
        <span className="flex items-center gap-1.5"><Smartphone size={16} className="text-teal-300" /> Pay with MTN MoMo</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-teal-300" /> Free to join</span>
      </div>
    </aside>
  )
}
