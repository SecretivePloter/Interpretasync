import { Star } from 'lucide-react'
import { calendarChangeDescription, isRecentCalendarChange } from '../../utils/calendarChanges'

export default function RecentChangeIndicator({ event, now }) {
  if (!isRecentCalendarChange(event, now)) return null
  const description = calendarChangeDescription(event)
  return <span className="calendar-change-indicator" role="img" aria-label={description} title={description} data-testid="recent-change-indicator">
    <Star size={11} strokeWidth={2} aria-hidden="true" />
  </span>
}
