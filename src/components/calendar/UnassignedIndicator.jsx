import { isUnassignedInterpreter } from '../../utils/unassignedInterpreter'

export default function UnassignedIndicator({ event, interpreter }) {
  if (!isUnassignedInterpreter(event, interpreter)) return null
  return <span className="unassigned-indicator" role="img" aria-label="Belum ada interpreter" title="Belum ada interpreter" data-testid="unassigned-indicator">
    <span aria-hidden="true">!</span>
  </span>
}
