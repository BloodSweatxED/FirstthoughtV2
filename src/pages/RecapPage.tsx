import { useCallback, useState } from 'react'
import { usePolling } from '../app/hooks'
import { hostPath } from '../app/routes'
import { hostKeyFor } from '../app/storage'
import { useRoom } from '../app/useRoom'
import { backend } from '../backend'
import { matchDiagnoses } from '../domain/matcher'
import { isSampleLearner, responsesOn, sessionCsv, sessionDates, summarizeSession, type RoundSummary } from '../domain/session'

const percent = (value: number) => `${Math.round(value * 100)}%`

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

const download = (filename: string, text: string) => {
  // The byte-order mark makes Excel read the file as UTF-8.
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function CompareBars({ room, typical }: { room: number; typical: number }) {
  return (
    <div className="compare-bars">
      <div className="compare-row">
        <span>The room</span>
        <span className="compare-track" aria-hidden="true">
          <span className="compare-fill compare-room" style={{ width: percent(room) }} />
        </span>
        <strong>{percent(room)}</strong>
      </div>
      <div className="compare-row">
        <span>Typical learner</span>
        <span className="compare-track" aria-hidden="true">
          <span className="compare-fill compare-typical" style={{ width: percent(typical) }} />
        </span>
        <strong>{percent(typical)}</strong>
      </div>
    </div>
  )
}

function RoundCard({ round, index }: { round: RoundSummary; index: number }) {
  const { aggregate } = round
  const missed = aggregate.cannotMiss.filter((item) => item.count === 0)
  return (
    <article className="panel recap-round">
      <header>
        <p className="section-label">
          Round {index + 1} · {formatTime(round.startedAt)} · {round.mode === 'led' ? 'Instructor-led' : 'Self-run'}
        </p>
        <h2>
          {round.teachingCase.label}, {round.level}
        </h2>
        <p className="muted">
          {aggregate.responseCount} {aggregate.responseCount === 1 ? 'answer' : 'answers'} · {aggregate.distinctDiagnoses} different diagnoses
        </p>
      </header>
      <CompareBars room={aggregate.roomCoverage} typical={aggregate.medianLearnerCoverage} />
      <p className={missed.length ? 'recap-missed' : 'recap-missed recap-clear'}>
        {missed.length ? (
          <>
            Nobody named: <strong>{missed.map((item) => item.name).join(', ')}</strong>
          </>
        ) : (
          'Every can’t-miss diagnosis was named by someone.'
        )}
      </p>
    </article>
  )
}

export function RecapPage({ code }: { code: string }) {
  const hostKey = hostKeyFor(code)
  const { room } = useRoom(code, 60000)
  const load = useCallback(() => backend.getHistory({ code, hostKey: hostKey! }), [code, hostKey])
  const history = usePolling(hostKey ? `history:${code}` : null, load, 15000)
  const [pickedDate, setPickedDate] = useState<string | null>(null)
  const [hideSamples, setHideSamples] = useState(false)

  if (!hostKey || (history.error && !history.data)) {
    return (
      <main className="app-shell narrow">
        <h1>Session recap</h1>
        <p className="muted">
          {hostKey ? `Could not load this room's answers: ${history.error}.` : 'The recap needs the room’s host key.'} Open{' '}
          <a href={hostPath(code)}>the host view</a> on this device first.
        </p>
      </main>
    )
  }
  if (!history.data) return <main className="app-shell"><p className="muted">Loading the recap...</p></main>

  const all = history.data
  const dates = sessionDates(all)
  const date = pickedDate ?? dates[0] ?? null
  const day = date ? responsesOn(all, date) : []
  const sampleCount = day.filter((item) => isSampleLearner(item.learnerId)).length
  const shown = hideSamples ? day.filter((item) => !isSampleLearner(item.learnerId)) : day
  const summary = summarizeSession(shown)
  const unrecognized = Array.from(new Set(shown.flatMap((item) => matchDiagnoses(item.text).unrecognized)))

  return (
    <main className="app-shell recap-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">First Thought · Session recap</p>
          <h1>{room?.label ?? `Room ${code}`}</h1>
          <p className="subtitle">{date ? formatDate(date) : 'No answers yet'}</p>
        </div>
        <nav className="host-links no-print">
          {dates.length > 1 && (
            <select value={date ?? ''} onChange={(event) => setPickedDate(event.target.value)} aria-label="Session date">
              {dates.map((item) => (
                <option key={item} value={item}>
                  {formatDate(item)}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="secondary" disabled={!shown.length} onClick={() => download(`first-thought-${code}-${date}.csv`, sessionCsv(shown))}>
            Download this session (CSV)
          </button>
          <button type="button" className="secondary" disabled={!all.length} onClick={() => download(`first-thought-${code}-all.csv`, sessionCsv(all))}>
            Download everything
          </button>
          <button type="button" className="secondary" onClick={() => window.print()}>
            Print
          </button>
          <a className="button-link secondary" href={hostPath(code)}>
            Host view
          </a>
        </nav>
      </header>

      {sampleCount > 0 && (
        <p className="mode-banner no-print">
          This session includes {sampleCount} sample {sampleCount === 1 ? 'answer' : 'answers'} from rehearsal.{' '}
          <label className="inline-check">
            <input type="checkbox" checked={hideSamples} onChange={(event) => setHideSamples(event.target.checked)} /> Leave them out
          </label>
        </p>
      )}

      {summary.rounds.length === 0 ? (
        <section className="panel empty-state">No answers to show for this session yet.</section>
      ) : (
        <>
          <section className="panel recap-hero">
            <div className="recap-claim">
              <p className="section-label">Can&apos;t-miss diagnoses caught</p>
              <h2>
                The room caught {summary.cannotMissNamed} of {summary.cannotMissTotal}. The typical learner caught{' '}
                {percent(summary.medianLearnerCoverage)} of them alone.
              </h2>
              <CompareBars
                room={summary.cannotMissTotal ? summary.cannotMissNamed / summary.cannotMissTotal : 0}
                typical={summary.medianLearnerCoverage}
              />
            </div>
            <div className="recap-stats">
              <div>
                <strong>{summary.rounds.length}</strong>
                <span>{summary.rounds.length === 1 ? 'round' : 'rounds'}</span>
              </div>
              <div>
                <strong>{summary.responseCount}</strong>
                <span>anonymous answers</span>
              </div>
              <div>
                <strong>{summary.distinctDiagnoses}</strong>
                <span>different diagnoses named</span>
              </div>
              <div>
                <strong>{percent(summary.anyCannotMissShare)}</strong>
                <span>of answers named at least one life threat</span>
              </div>
            </div>
          </section>

          <div className="recap-rounds">
            {summary.rounds.map((round, index) => (
              <RoundCard key={round.roundId} round={round} index={index} />
            ))}
          </div>

          {unrecognized.length > 0 && (
            <section className="panel recap-unknown">
              <p className="section-label">Not in the dictionary</p>
              <p className="muted">Text the matcher could not read. Real diagnoses here should be added before the next session.</p>
              <div className="chip-list">
                {unrecognized.map((item) => (
                  <span key={item} className="chip small-chip unknown-chip">
                    ? {item}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="home-footnote">
        Synthetic cases. No names. Each learner gets a new random id every round, so answers cannot be linked across rounds.
      </p>
      {history.error && <p className="warning no-print">Connection problem: {history.error}. Showing the last good copy.</p>}
    </main>
  )
}
