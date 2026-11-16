import type { DxTally, RoomAggregate } from '../domain/aggregate'

const formatCount = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

const listNames = (items: DxTally[]) => {
  const names = items.map((item) => item.name)
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`
}

function VersusColumn({
  title,
  hint,
  tone,
  items,
  total,
  sharedIds,
}: {
  title: string
  hint: string
  tone: 'dangerous' | 'likely'
  items: DxTally[]
  total: number
  sharedIds: Set<string>
}) {
  // Most-named first, so the gaps collect at the bottom of each column.
  const sorted = [...items].sort((a, b) => b.count - a.count)
  return (
    <div className={`versus-column versus-${tone}`}>
      <h3>{title}</h3>
      <p className="versus-hint">{hint}</p>
      <ul>
        {sorted.map((item) => (
          <li key={item.dx} className={item.count === 0 ? 'versus-row versus-none' : 'versus-row'}>
            <span className="versus-name">
              {item.name}
              {sharedIds.has(item.dx) && <em>on both lists</em>}
            </span>
            <span className="versus-bar" aria-hidden="true">
              <span style={{ width: `${total ? (item.count / total) * 100 : 0}%` }} />
            </span>
            <span className="versus-count">{item.count === 0 ? 'nobody' : `${item.count} of ${total}`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The reveal headline: what the room thought was likely, next to what could kill the patient. */
export function DebriefHeadline({ aggregate }: { aggregate: RoomAggregate }) {
  const total = aggregate.responseCount
  const keyed = aggregate.cannotMiss.length
  const roomNamed = aggregate.cannotMiss.filter((item) => item.count > 0).length
  const missed = aggregate.cannotMiss.filter((item) => item.count === 0)
  const sharedIds = new Set(
    aggregate.cannotMiss.filter((item) => aggregate.mostLikely.some((likely) => likely.dx === item.dx)).map((item) => item.dx),
  )

  if (total === 0) {
    return (
      <section className="panel debrief-headline">
        <p className="section-label">Most likely vs. most dangerous</p>
        <p className="muted">No answers yet.</p>
      </section>
    )
  }

  return (
    <section className="panel debrief-headline" aria-label="Most likely versus most dangerous">
      <p className="section-label">Most likely vs. most dangerous</p>
      <div className="headline-stats">
        <div>
          <strong>
            {roomNamed} of {keyed}
          </strong>
          <span>can&apos;t-miss diagnoses named by the room</span>
        </div>
        <div>
          <strong>
            {formatCount(aggregate.medianLearnerCoverage * keyed)} of {keyed}
          </strong>
          <span>named by the typical learner</span>
        </div>
        <div>
          <strong>
            {aggregate.learnersNamingCannotMiss} of {total}
          </strong>
          <span>learners named at least one</span>
        </div>
      </div>

      <p className={missed.length ? 'headline-gap' : 'headline-gap headline-clear'}>
        {missed.length ? (
          <>
            Nobody named <strong>{listNames(missed)}</strong>.
          </>
        ) : (
          'Someone in the room named every can’t-miss diagnosis.'
        )}
      </p>

      <div className="versus">
        <VersusColumn
          title="Most dangerous"
          hint="Changes what you do next if missed"
          tone="dangerous"
          items={aggregate.cannotMiss}
          total={total}
          sharedIds={sharedIds}
        />
        <VersusColumn
          title="Most likely"
          hint="The common explanations at this level"
          tone="likely"
          items={aggregate.mostLikely}
          total={total}
          sharedIds={sharedIds}
        />
      </div>
    </section>
  )
}
