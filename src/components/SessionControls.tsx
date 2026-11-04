import { teachingCases } from '../data/cases'
import { levelConfig } from '../data/levels'
import type { LearnerLevel } from '../domain/types'

type Props = {
  level: LearnerLevel
  caseId: string
  onLevel: (level: LearnerLevel) => void
  onCase: (caseId: string) => void
  onRandomCase: () => void
  onReset: () => void
}

export function SessionControls({ level, caseId, onLevel, onCase, onRandomCase, onReset }: Props) {
  return (
    <section className="control-band" aria-label="Session controls">
      <label>
        Learner level
        <select value={level} onChange={(event) => onLevel(event.target.value as LearnerLevel)}>
          {Object.entries(levelConfig).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Synthetic case
        <select value={caseId} onChange={(event) => onCase(event.target.value)}>
          {teachingCases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={onRandomCase}>
        Random case
      </button>
      <button type="button" className="secondary" onClick={onReset}>
        Reset
      </button>
    </section>
  )
}
