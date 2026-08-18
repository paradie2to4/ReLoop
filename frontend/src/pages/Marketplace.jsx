import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '../components/ui/SearchBar'
import FilterSidebar from '../components/products/FilterSidebar'
import ProductGrid from '../components/products/ProductGrid'
import Pagination from '../components/ui/Pagination'
import { fetchCategories, fetchProducts } from '../services/products'
import { apiErrorMessage } from '../services/api'

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [count, setCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const page = Number(searchParams.get('page') || 1)
  const filters = Object.fromEntries(searchParams.entries())

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchProducts(filters)
      .then((data) => {
        if (!active) return
        setProducts(data.results)
        setCount(data.count)
        setHasNext(!!data.next)
        setHasPrevious(!!data.previous)
      })
      .catch((err) => active && setError(apiErrorMessage(err, 'Could not load products.')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [searchParams.toString()])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function clearFilters() {
    setSearchParams({})
    setSearchInput('')
  }

  function goToPage(newPage) {
    const next = new URLSearchParams(searchParams)
    next.set('page', newPage)
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-navy-900">Marketplace</h1>
        <p className="mt-1 text-sm text-navy-600">Browse everything the ReLoop community is sharing.</p>
      </div>

      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={(value) => updateFilter('search', value)}
        className="mb-6"
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterSidebar categories={categories} filters={filters} onChange={updateFilter} onClear={clearFilters} />

        <div className="flex-1">
          <p className="mb-4 text-sm text-navy-600">{loading ? 'Searching...' : `${count} result${count === 1 ? '' : 's'}`}</p>
          <ProductGrid products={products} loading={loading} error={error} onRetry={() => setSearchParams(searchParams)} />
          <Pagination page={page} hasNext={hasNext} hasPrevious={hasPrevious} onChange={goToPage} totalCount={count} />
        </div>
      </div>
    </div>
  )
}
