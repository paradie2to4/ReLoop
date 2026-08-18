import Badge from '../ui/Badge'
import { CONDITIONS, labelFor } from '../../utils/constants'

const TONE_BY_CONDITION = {
  NEW: 'teal',
  LIKE_NEW: 'sky',
  GOOD: 'neutral',
  FAIR: 'amber',
  NEEDS_REPAIR: 'red',
}

export default function ConditionBadge({ condition }) {
  return <Badge tone={TONE_BY_CONDITION[condition] || 'neutral'}>{labelFor(CONDITIONS, condition)}</Badge>
}
