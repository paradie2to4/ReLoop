import { CONDITIONS, LOCATIONS, TRANSACTION_TYPES } from '../../utils/constants'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

export default function FilterSidebar({ categories, filters, onChange, onClear }) {
  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-64">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-900">Filters</h3>
        <button onClick={onClear} className="text-xs font-medium text-teal-600 hover:underline">
          Clear all
        </button>
      </div>

      <Select
        label="Category"
        placeholder="All categories"
        value={filters.category || ''}
        onChange={(e) => onChange('category', e.target.value)}
        options={categories.map((c) => ({ value: c.slug, label: c.name }))}
      />

      <Select
        label="Transaction type"
        placeholder="Any"
        value={filters.transaction_type || ''}
        onChange={(e) => onChange('transaction_type', e.target.value)}
        options={TRANSACTION_TYPES}
      />

      <Select
        label="Condition"
        placeholder="Any"
        value={filters.condition || ''}
        onChange={(e) => onChange('condition', e.target.value)}
        options={CONDITIONS}
      />

      <Select
        label="Location"
        placeholder="Anywhere"
        value={filters.location || ''}
        onChange={(e) => onChange('location', e.target.value)}
        options={LOCATIONS.map((l) => ({ value: l, label: l }))}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-navy-800">Price range (RWF)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => onChange('min_price', e.target.value)}
          />
          <span className="text-navy-500">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => onChange('max_price', e.target.value)}
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-navy-800">Sort by</p>
        <Select
          value={filters.ordering || '-created_at'}
          onChange={(e) => onChange('ordering', e.target.value)}
          options={[
            { value: '-created_at', label: 'Newest' },
            { value: 'price', label: 'Price: Low to High' },
            { value: '-price', label: 'Price: High to Low' },
            { value: '-views_count', label: 'Most Popular' },
          ]}
        />
      </div>

      <Button variant="outline" className="w-full lg:hidden" onClick={onClear}>
        Reset filters
      </Button>
    </aside>
  )
}
