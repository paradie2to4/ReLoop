import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gift, Recycle, Repeat, Search, Smartphone, TrendingUp, Wrench } from 'lucide-react'
import ProductRow from '../components/home/ProductRow'
import Button from '../components/ui/Button'
import { fetchHomeSection } from '../services/products'
import { useAuth } from '../context/AuthContext'

const SECTIONS = [
  { key: 'trending', title: 'Trending Products', subtitle: 'Popular items other people are loving right now.', link: '/marketplace?ordering=-views_count' },
  { key: 'recent', title: 'Recently Added', subtitle: 'Fresh listings from the ReLoop community.', link: '/marketplace?ordering=-created_at' },
  { key: 'donations', title: 'Give It Another Life', subtitle: 'Free items donated by generous neighbors.', link: '/marketplace?transaction_type=FREE_DONATION' },
  { key: 'exchange', title: 'Exchange Instead of Buying', subtitle: 'Swap what you have for something you need.', link: '/marketplace?transaction_type=FOR_EXCHANGE' },
]

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const [sections, setSections] = useState({})
  const [loading, setLoading] = useState({})

  useEffect(() => {
    SECTIONS.forEach(async ({ key }) => {
      setLoading((l) => ({ ...l, [key]: true }))
      try {
        const data = await fetchHomeSection(key)
        setSections((s) => ({ ...s, [key]: data }))
      } finally {
        setLoading((l) => ({ ...l, [key]: false }))
      }
    })

    if (user?.location) {
      setLoading((l) => ({ ...l, near: true }))
      fetchHomeSection('near', { location: user.location })
        .then((data) => setSections((s) => ({ ...s, near: data })))
        .finally(() => setLoading((l) => ({ ...l, near: false })))
    }
  }, [user?.location])

  return (
    <div>
      <section className="relative isolate grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-10 -z-10 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            <Recycle size={14} /> Rwanda's circular marketplace
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-navy-900 sm:text-6xl">
            Give products <span className="text-teal-600">another life.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-navy-600">
            Buy, sell, swap, donate and repair second-hand items near you. Save money and cut waste.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/marketplace" size="lg" variant="accent">
              <Search size={18} /> Explore marketplace
            </Button>
            <Button as={Link} to={isAuthenticated ? '/sell' : '/register'} size="lg" variant="outline">
              Sell an item
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-navy-600">
            <span className="flex items-center gap-1.5"><Smartphone size={15} className="text-teal-600" /> Pay with MTN MoMo</span>
            <span className="flex items-center gap-1.5"><Gift size={15} className="text-teal-600" /> Free donations</span>
            <span className="flex items-center gap-1.5"><Wrench size={15} className="text-teal-600" /> Local repairers</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Recycle} label="Buy &amp; Sell" description="Give used items a second owner." />
          <StatCard icon={Repeat} label="Exchange" description="Swap items instead of spending." />
          <StatCard icon={Gift} label="Donate" description="Pass things on for free." />
          <StatCard icon={Wrench} label="Repair" description="Fix instead of replace." />
        </div>
      </section>

      <ProductRow title={SECTIONS[0].title} subtitle={SECTIONS[0].subtitle} products={sections.trending} loading={loading.trending} viewAllLink={SECTIONS[0].link} />
      <ProductRow title={SECTIONS[1].title} subtitle={SECTIONS[1].subtitle} products={sections.recent} loading={loading.recent} viewAllLink={SECTIONS[1].link} />
      <ProductRow title={SECTIONS[2].title} subtitle={SECTIONS[2].subtitle} products={sections.donations} loading={loading.donations} viewAllLink={SECTIONS[2].link} />
      <ProductRow title={SECTIONS[3].title} subtitle={SECTIONS[3].subtitle} products={sections.exchange} loading={loading.exchange} viewAllLink={SECTIONS[3].link} />
      {user?.location && (
        <ProductRow title={`Near You in ${user.location}`} subtitle="Listings close to your saved location." products={sections.near} loading={loading.near} viewAllLink={`/marketplace?location=${user.location}`} />
      )}

      <section
        id="impact"
        data-theme="dark"
        className="relative my-16 overflow-hidden rounded-3xl border border-sand-200 bg-sand-100 px-6 py-12 text-navy-900 sm:px-12"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-300">
              <TrendingUp size={14} /> Your impact
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">Every reused item counts.</h2>
            <p className="mt-3 max-w-md text-navy-600">
              Buying, exchanging or donating a used item instead of a new one avoids manufacturing waste and
              carbon emissions. ReLoop estimates the weight and CO₂ savings of every transaction on your
              personal Impact Dashboard.
            </p>
            <Button as={Link} to={isAuthenticated ? '/impact' : '/register'} variant="accent" className="mt-6">
              View your Impact Dashboard
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImpactFact value="Electronics" detail="~4.5kg waste & 25kg CO₂ avoided per reused item" />
            <ImpactFact value="Furniture" detail="~18kg waste & 15kg CO₂ avoided per reused item" />
            <ImpactFact value="Clothing" detail="~0.5kg waste & 3.5kg CO₂ avoided per reused item" />
            <ImpactFact value="Vehicles" detail="~120kg waste & 90kg CO₂ avoided per reused item" />
          </div>
          <p className="text-xs text-navy-500 lg:col-span-2">
            Estimated impact — figures are configurable, illustrative averages by category, not scientifically precise measurements.
          </p>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, description }) {
  return (
    <div className="glass-card group rounded-2xl border border-sand-200 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-teal-400/60">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-on-accent">
        <Icon size={20} />
      </span>
      <p className="mt-4 font-display font-bold text-navy-900">{label}</p>
      <p className="mt-1 text-sm text-navy-600">{description}</p>
    </div>
  )
}

function ImpactFact({ value, detail }) {
  return (
    <div className="glass-card rounded-2xl border border-sand-200 bg-surface p-4">
      <p className="font-display text-lg font-bold text-teal-300">{value}</p>
      <p className="mt-1 text-xs text-navy-600">{detail}</p>
    </div>
  )
}
