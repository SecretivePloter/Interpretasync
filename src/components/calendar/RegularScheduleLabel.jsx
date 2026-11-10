import { isRegularSchedule } from '../../utils/scheduleTypes'

export default function RegularScheduleLabel({ event }) {
  return isRegularSchedule(event) ? <span className="schedule-regular-label" title="Reguler bulanan" aria-label="Reguler bulanan" data-testid="regular-schedule-label">REG</span> : null
}
