import { diagnosisById } from '../data/diagnoses'
import { matchDiagnoses } from '../domain/matcher'
import type { ResponseEntry } from '../domain/types'

export function Whiteboard({ responses }: { responses: ResponseEntry[] }) {
  return (
    <section className="panel whiteboard-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Whiteboard</p>
          <h2>What the room generated</h2>
        </div>
      </div>
      {responses.length === 0 ? (
        <div className="empty-state">No answers yet.</div>
      ) : (
        <div className="response-list">
          {responses.map((response, index) => {
            const { matched, unrecognized } = matchDiagnoses(response.text)
            return (
              <article key={response.id} className="response-card">
                <div>
                  <strong>Learner {index + 1}</strong>
                </div>
                <p>{response.text}</p>
                <div className="chip-list read-as">
                  {matched.map((dx) => (
                    <span key={dx} className="chip small-chip">
                      {diagnosisById[dx]?.name ?? dx}
                    </span>
                  ))}
                  {unrecognized.map((item) => (
                    <span key={item} className="chip small-chip unknown-chip" title="Not in the dictionary">
                      ? {item}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
