import type { RoomAggregate } from '../domain/aggregate'

type Props = {
  aggregate: RoomAggregate
  pearl: string
  debriefFocus: string
}

/** Faculty-facing notes that sit under the headline: what to probe, and what the matcher could not read. */
export function SynthesisPanel({ aggregate, pearl, debriefFocus }: Props) {
  const total = aggregate.responseCount

  return (
    <section className="panel assistant-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Debrief notes</p>
          <h2>What to probe</h2>
        </div>
      </div>

      <div className="teaching-pearl">
        <span>One-minute pearl</span>
        <p>{pearl}</p>
      </div>
      <div className="debrief-card">
        <span>Faculty probe</span>
        <p>{debriefFocus}</p>
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
        {aggregate.alsoConsider.length === 0 ? (
          <p className="muted">Nothing extra at this level</p>
        ) : (
          <ul className="tally-list">
            {aggregate.alsoConsider.map((item) => (
              <li key={item.dx} className={item.count > 0 ? 'named' : 'missed'}>
                <span>{item.name}</span>
                <strong>{item.count > 0 ? `${item.count} of ${total}` : 'nobody'}</strong>
              </li>
            ))}
          </ul>
        )}
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
              <span key={`${item}-${index}`} className="chip small-chip unknown-chip" title="Not in the dictionary">
                ? {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
