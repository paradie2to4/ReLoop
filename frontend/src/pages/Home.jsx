import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gift, Recycle, Repeat, Search, TrendingUp, Wrench } from 'lucide-react'
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
      <section className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            <Recycle size={14} /> Circular marketplace
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-navy-900 sm:text-5xl">
            Give products another life.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-navy-700">
            Buy less new. Reuse more. Save money. Reduce waste.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/marketplace" size="lg" variant="primary">
              <Search size={18} /> Explore Marketplace
            </Button>
            <Button as={Link} to={isAuthenticated ? '/sell' : '/register'} size="lg" variant="accent">
              Sell an Item
            </Button>
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

      <section id="impact" className="my-16 rounded-2xl bg-navy-900 px-6 py-12 text-sand-50 sm:px-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300">
              <TrendingUp size={14} /> Your Impact
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold">Every reused item counts.</h2>
            <p className="mt-3 max-w-md text-sand-100/80">
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
          <p className="text-xs text-sand-100/50 lg:col-span-2">
            Estimated impact — figures are configurable, illustrative averages by category, not scientifically precise measurements.
          </p>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, description }) {
  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <Icon size={22} className="text-teal-600" />
      <p className="mt-3 font-semibold text-navy-900">{label}</p>
      <p className="mt-1 text-xs text-navy-600">{description}</p>
    </div>
  )
}

function ImpactFact({ value, detail }) {
  return (
    <div className="rounded-lg bg-white/5 p-4">
      <p className="font-display text-lg font-semibold text-teal-300">{value}</p>
      <p className="mt-1 text-xs text-sand-100/70">{detail}</p>
    </div>
  )
}
