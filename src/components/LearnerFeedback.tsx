import type { RoomAggregate } from '../domain/aggregate'
import { matchDiagnoses } from '../domain/matcher'
import { diagnosisById } from '../data/diagnoses'
import type { ResponseEntry } from '../domain/types'

type Props = {
  /** Null when the learner did not answer before the reveal. They see the room only. */
  ownText: string | null
  aggregate: RoomAggregate
  responses: ResponseEntry[]
  pearl: string
}

/** What a learner sees after the reveal: their answer against the key and against the room. */
export function LearnerFeedback({ ownText, aggregate, responses, pearl }: Props) {
  const answered = ownText !== null
  const mine = new Set(answered ? matchDiagnoses(ownText).matched : [])
  const mineCannotMiss = aggregate.cannotMiss.filter((item) => mine.has(item.dx)).length
  const roomCannotMiss = aggregate.cannotMiss.filter((item) => item.count > 0).length
  const total = aggregate.cannotMiss.length
  const learners = aggregate.responseCount

  const row = (item: { dx: string; name: string; count: number }) => (
    <li key={item.dx} className={mine.has(item.dx) ? 'mine' : item.count > 0 ? 'room-only' : 'nobody'}>
      <span className="feedback-mark" aria-hidden="true">
        {mine.has(item.dx) ? '✓' : '·'}
      </span>
      <span className="feedback-name">{item.name}</span>
      <span className="feedback-count">{item.count > 0 ? `${item.count} of ${learners}` : 'nobody'}</span>
    </li>
  )

  return (
    <div className="feedback">
      <div className="feedback-score">
        <strong>
          {answered ? mineCannotMiss : roomCannotMiss} of {total}
        </strong>
        <span>
          {answered
            ? `can’t-miss diagnoses named by you. The room named ${roomCannotMiss} of ${total}`
            : 'can’t-miss diagnoses named by the room'}
          {learners > 1 ? ` across ${learners} learners` : ''}.
        </span>
      </div>

      <section>
        <h3>Most dangerous</h3>
        <ul className="feedback-list">{aggregate.cannotMiss.map(row)}</ul>
      </section>
      <section>
        <h3>Most likely</h3>
        <ul className="feedback-list">{aggregate.mostLikely.map(row)}</ul>
      </section>

      <div className="teaching-pearl">
        <span>Pearl</span>
        <p>{pearl}</p>
      </div>

      {responses.length > (answered ? 1 : 0) && (
        <section>
          <h3>What the room wrote</h3>
          <ul className="room-answers">
            {responses.map((response) => (
              <li key={response.id}>{response.text}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="muted feedback-legend">
        {answered && '✓ you named it. '}Counts show how many learners named each one.
        {answered && mine.size === 0 && ' None of your answer matched a known diagnosis. Try full names or common abbreviations.'}
      </p>
      {answered && <p className="sr-only">You named: {Array.from(mine).map((dx) => diagnosisById[dx]?.name).join(', ')}</p>}
    </div>
  )
}
