export const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
]

export const TRANSACTION_TYPES = [
  { value: 'FOR_SALE', label: 'For Sale' },
  { value: 'FOR_EXCHANGE', label: 'For Exchange' },
  { value: 'FREE_DONATION', label: 'Free Donation' },
  { value: 'SALE_OR_EXCHANGE', label: 'Sale or Exchange' },
]

export const PRODUCT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'DONATED', label: 'Donated' },
  { value: 'EXCHANGED', label: 'Exchanged' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash on Delivery' },
  { value: 'PAY_ON_PICKUP', label: 'Payment on Pickup' },
]

export const REPORT_REASONS = [
  { value: 'SCAM', label: 'Scam' },
  { value: 'FAKE_PRODUCT', label: 'Fake product' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'WRONG_INFO', label: 'Wrong information' },
  { value: 'OTHER', label: 'Other' },
]

export const LOCATIONS = ['Kigali', 'Huye', 'Musanze', 'Rubavu', 'Muhanga', 'Rusizi']

export const CONDITION_BADGE_STYLES = {
  NEW: 'bg-teal-50 text-teal-700 border-teal-300',
  LIKE_NEW: 'bg-sky-50 text-sky-600 border-sky-300',
  GOOD: 'bg-sand-100 text-navy-700 border-sand-300',
  FAIR: 'bg-amber-50 text-amber-700 border-amber-300',
  NEEDS_REPAIR: 'bg-orange-50 text-orange-700 border-orange-300',
}

export function labelFor(list, value) {
  return list.find((item) => item.value === value)?.label || value
}
