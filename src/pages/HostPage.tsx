import { useCallback, useState } from 'react'
import { useNow, usePolling } from '../app/hooks'
import { absoluteUrl, hostPath, posterPath, studentPath } from '../app/routes'
import { hostKeyFor, saveHostKey } from '../app/storage'
import { useRoom } from '../app/useRoom'
import { backend } from '../backend'
import { Countdown } from '../components/Countdown'
import { LevelBand } from '../components/LevelBand'
import { PromptBoard } from '../components/PromptBoard'
import { SynthesisPanel } from '../components/SynthesisPanel'
import { Whiteboard } from '../components/Whiteboard'
import { teachingCases } from '../data/cases'
import { levelConfig } from '../data/levels'
import { aggregateResponses } from '../domain/aggregate'
import { answerKeyFor } from '../domain/answerKey'
import { startLedRound, type RoomPatch } from '../domain/rounds'
import type { LearnerLevel } from '../domain/types'

/** Pull ?key= from a shared host link into this device, then drop it from the address bar. */
const initialHostKey = (code: string) => {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('key')
  if (fromUrl) {
    saveHostKey(code, fromUrl)
    window.history.replaceState(null, '', hostPath(code))
    return fromUrl
  }
  return hostKeyFor(code)
}

export function HostPage({ code }: { code: string }) {
  const [hostKey, setHostKey] = useState(() => initialHostKey(code))
  const [keyDraft, setKeyDraft] = useState('')
  const { room, round, teachingCase, error, loading, refresh } = useRoom(code, 3000)

  const verify = useCallback(() => backend.verifyHost(code, hostKey ?? ''), [code, hostKey])
  const verified = usePolling(hostKey ? `verify:${code}:${hostKey}` : null, verify, 5 * 60 * 1000)

  const roundId = round?.roundId ?? null
  const loadResponses = useCallback(
    () => backend.getResponses({ code, roundId: roundId!, hostKey: hostKey! }),
    [code, roundId, hostKey],
  )
  const responses = usePolling(roundId && hostKey ? `responses:${roundId}` : null, loadResponses, 3000)

  const [next, setNext] = useState<{ caseId: string; level: LearnerLevel } | null>(null)
  const [showOpenAnswers, setShowOpenAnswers] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const now = useNow(1000)

  if (loading) return <main className="app-shell"><p className="muted">Loading room {code}...</p></main>
  if (!room || !round || !teachingCase) {
    return (
      <main className="app-shell">
        <h1>Room {code} not found</h1>
        <p className="muted">{error}</p>
        <a href="/">Back</a>
      </main>
    )
  }

  if (!hostKey || verified.data === false) {
    return (
      <main className="app-shell narrow">
        <h1>Host {room.label}</h1>
        <p className="muted">
          {verified.data === false ? 'That host key did not work.' : 'Enter the host key for this room.'} Learners
          should use <a href={studentPath(code)}>the learner page</a> instead.
        </p>
        <form
          className="key-form"
          onSubmit={(event) => {
            event.preventDefault()
            saveHostKey(code, keyDraft.trim())
            setHostKey(keyDraft.trim())
          }}
        >
          <input value={keyDraft} onChange={(event) => setKeyDraft(event.target.value)} placeholder="Host key" />
          <button type="submit">Continue</button>
        </form>
      </main>
    )
  }

  const plan = next ?? { caseId: round.caseId, level: round.level }
  const led = round.mode === 'led'
  const answersShown = led ? round.revealed : showOpenAnswers
  const roundResponses = responses.data?.responses ?? []
  const count = responses.data?.count ?? 0
  const aggregate = aggregateResponses(roundResponses, answerKeyFor(teachingCase, round.level))
  const timeUp = led && round.endsAt !== null && now.getTime() >= round.endsAt

  const act = async (patch: RoomPatch) => {
    setBusy(true)
    setActionError(null)
    try {
      await backend.updateRoom({ code, hostKey, patch })
      setNext(null)
      refresh()
      responses.refresh()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'That did not work')
    } finally {
      setBusy(false)
    }
  }

  const addSampleLearner = async () => {
    const used = new Set(roundResponses.map((item) => item.text))
    const samples = teachingCase.sampleResponses
    const text = samples.find((sample) => !used.has(sample)) ?? samples[count % samples.length]
    try {
      await backend.submit({
        code,
        roundId: round.roundId,
        learnerId: `sample-${Math.random().toString(36).slice(2, 8)}`,
        caseId: round.caseId,
        level: round.level,
        text,
      })
      responses.refresh()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Could not add sample')
    }
  }

  const copyHostLink = async () => {
    try {
      await navigator.clipboard.writeText(`${absoluteUrl(hostPath(code))}?key=${hostKey}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setActionError(`Copy failed. Host key: ${hostKey}`)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">First Thought · Host view</p>
          <h1>{room.label}</h1>
          <p className="subtitle">
            Learners join at <strong>{absoluteUrl(studentPath(code)).replace(/^https?:\/\//, '')}</strong> or room code{' '}
            <strong>{code}</strong>
          </p>
        </div>
        <nav className="host-links">
          <a className="button-link secondary" href={posterPath(code)}>
            QR poster
          </a>
          <a className="button-link secondary" href={studentPath(code)} target="_blank" rel="noreferrer">
            Learner view
          </a>
          <button type="button" className="secondary" onClick={copyHostLink}>
            {copied ? 'Copied' : 'Copy host link'}
          </button>
        </nav>
      </header>

      {backend.kind === 'local' && (
        <p className="mode-banner">Demo mode: this browser only. Open the learner view in another tab to rehearse.</p>
      )}

      <section className={`status-band ${led ? 'status-led' : 'status-open'}`} aria-live="polite">
        <div>
          <strong>{led ? (round.revealed ? 'Revealed' : timeUp ? 'Time is up' : 'Round running') : 'Self-run'}</strong>
          <span>
            {led
              ? `Instructor-led round: ${teachingCase.label}, ${round.level}. Learners see answers when you reveal.`
              : `No one is leading. Learners get today's case (${teachingCase.label}, ${round.level}) and see the room after they submit.`}
          </span>
        </div>
        <div className="status-count">
          <strong>{count}</strong>
          <span>{count === 1 ? 'answer' : 'answers'}</span>
        </div>
      </section>

      <section className="control-band" aria-label="Round controls">
        <label>
          {led ? 'Next round level' : 'Level'}
          <select value={plan.level} onChange={(event) => setNext({ ...plan, level: event.target.value as LearnerLevel })}>
            {Object.entries(levelConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {led ? 'Next round case' : 'Case'}
          <select value={plan.caseId} onChange={(event) => setNext({ ...plan, caseId: event.target.value })}>
            {teachingCases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={busy} onClick={() => act(startLedRound(plan.caseId, plan.level))}>
          {led ? 'New 4-min round' : 'Start 4-min round'}
        </button>
        {led && !round.revealed && (
          <button type="button" className="reveal-button" disabled={busy} onClick={() => act({ revealed: true })}>
            Reveal to room
          </button>
        )}
        {led ? (
          <button type="button" className="secondary" disabled={busy} onClick={() => act({ mode: 'open' })}>
            End, back to self-run
          </button>
        ) : (
          <button
            type="button"
            className="secondary"
            disabled={busy || plan.level === room.level}
            onClick={() => act({ level: plan.level })}
            title="Changes the level learners get when no one is leading"
          >
            Set self-run level
          </button>
        )}
      </section>
      {actionError && <p className="warning">{actionError}</p>}

      <PromptBoard
        teachingCase={teachingCase}
        aside={
          led && round.endsAt ? (
            <Countdown endsAt={round.endsAt} />
          ) : (
            <span className="timer-note">Each learner gets their own 4 minutes</span>
          )
        }
      />
      <LevelBand level={round.level} teachingCase={teachingCase} />

      {answersShown ? (
        <div className="workspace-grid two-up">
          <Whiteboard responses={roundResponses} />
          <SynthesisPanel aggregate={aggregate} pearl={teachingCase.pearl} debriefFocus={levelConfig[round.level].debriefFocus} />
        </div>
      ) : (
        <section className="panel hidden-answers">
          <strong>{count}</strong>
          <p>{count === 1 ? 'answer is in.' : 'answers are in.'} They stay hidden so no one anchors on the first one.</p>
          <div className="button-row">
            {led ? (
              <button type="button" className="reveal-button" disabled={busy} onClick={() => act({ revealed: true })}>
                Reveal to room
              </button>
            ) : (
              <button type="button" onClick={() => setShowOpenAnswers(true)}>
                Show answers on this screen
              </button>
            )}
            <button type="button" className="secondary" onClick={addSampleLearner}>
              Add sample learner
            </button>
          </div>
        </section>
      )}
      {answersShown && (
        <div className="button-row host-footer">
          {!led && (
            <button type="button" className="secondary" onClick={() => setShowOpenAnswers(false)}>
              Hide answers
            </button>
          )}
          <button type="button" className="secondary" onClick={addSampleLearner}>
            Add sample learner
          </button>
        </div>
      )}
      {responses.error && <p className="warning">Connection problem: {responses.error}. Retrying.</p>}
    </main>
  )
}
