import type { RoomAggregate, DxTally } from '../domain/aggregate'

type Props = {
  aggregate: RoomAggregate
  pearl: string
  debriefFocus: string
}

const percent = (value: number) => `${Math.round(value * 100)}%`

function TallyList({ items, emptyLabel }: { items: DxTally[]; emptyLabel: string }) {
  if (items.length === 0) return <p className="muted">{emptyLabel}</p>
  return (
    <ul className="tally-list">
      {items.map((item) => (
        <li key={item.dx} className={item.count > 0 ? 'named' : 'missed'}>
          <span>{item.name}</span>
          <strong>{item.count > 0 ? `${item.count}` : 'missed'}</strong>
        </li>
      ))}
    </ul>
  )
}

export function SynthesisPanel({ aggregate, pearl, debriefFocus }: Props) {
  const total = aggregate.responseCount

  return (
    <section className="panel assistant-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Room synthesis</p>
          <h2>Instructor-facing debrief</h2>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <strong>{percent(aggregate.roomCoverage)}</strong>
          <span>of can&apos;t-miss diagnoses named by someone in the room</span>
        </div>
        <div>
          <strong>{total ? percent(aggregate.medianLearnerCoverage) : '-'}</strong>
          <span>named by the typical (median) learner</span>
        </div>
      </div>

      <div className="assistant-section">
        <div className="split-list">
          <div>
            <span className="mini-label">Most dangerous</span>
            <TallyList items={aggregate.cannotMiss} emptyLabel="None at this level" />
          </div>
          <div>
            <span className="mini-label">Most likely</span>
            <TallyList items={aggregate.mostLikely} emptyLabel="None at this level" />
          </div>
        </div>
        {total > 0 && <p className="muted tally-note">Numbers show how many of {total} learners named it.</p>}
      </div>

      <div className="assistant-section">
        <h3>Systems the room skipped</h3>
        <div className="chip-list">
          {aggregate.categoriesMissing.length > 0 ? (
            aggregate.categoriesMissing.map((category) => (
              <span key={category} className="chip quiet-chip">
                {category}
              </span>
            ))
          ) : (
            <span className="positive">{total ? 'Broad pass' : 'Waiting for responses'}</span>
          )}
        </div>
      </div>

      <div className="assistant-section">
        <h3>Also worth probing</h3>
        <TallyList items={aggregate.alsoConsider} emptyLabel="Nothing extra at this level" />
      </div>

      {(aggregate.offKey.length > 0 || aggregate.unrecognized.length > 0) && (
        <div className="assistant-section">
          <h3>Outside the key</h3>
          <div className="chip-list">
            {aggregate.offKey.map((item) => (
              <span key={item.dx} className="chip small-chip">
                {item.name} · {item.count}
              </span>
            ))}
            {aggregate.unrecognized.map((item, index) => (
              <span key={`${item}-${index}`} className="chip small-chip unknown-chip">
                ? {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="teaching-pearl">
        <span>One-minute pearl</span>
        <p>{pearl}</p>
      </div>
      <div className="debrief-card">
        <span>Faculty probe</span>
        <p>{debriefFocus}</p>
      </div>
    </section>
  )
}
