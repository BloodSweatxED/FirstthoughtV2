import { infoLabels, levelConfig } from '../data/levels'
import type { LearnerLevel, TeachingCase } from '../domain/types'

export function LevelBand({ level, teachingCase }: { level: LearnerLevel; teachingCase: TeachingCase }) {
  const config = levelConfig[level]

  return (
    <section className="level-band" aria-label="Level-specific learner view">
      <div>
        <p className="section-label">Visible learner information</p>
        <h2>{config.shortLabel} task</h2>
        <p>{config.task}</p>
      </div>
      {config.visibleInfo.length === 0 ? (
        <div className="info-card empty-info">Chief complaint only. The low-information discomfort is the point.</div>
      ) : (
        <div className="info-grid">
          {config.visibleInfo.map((key) => (
            <article key={key} className="info-card">
              <span>{infoLabels[key]}</span>
              <p>{teachingCase.info[key]}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
