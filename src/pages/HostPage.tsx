import { useCallback, useEffect, useState } from 'react'
import { useNow, usePolling } from '../app/hooks'
import { absoluteUrl, hostPath, posterPath, recapPath, studentPath } from '../app/routes'
import { hostKeyFor, saveHostKey } from '../app/storage'
import { useRoom } from '../app/useRoom'
import { backend } from '../backend'
import { Countdown } from '../components/Countdown'
import { DebriefHeadline } from '../components/DebriefHeadline'
import { LevelBand } from '../components/LevelBand'
import { PromptBoard } from '../components/PromptBoard'
import { QrCode } from '../components/QrCode'
import { SynthesisPanel } from '../components/SynthesisPanel'
import { Whiteboard } from '../components/Whiteboard'
import { teachingCases } from '../data/cases'
import { levelConfig } from '../data/levels'
import { aggregateResponses } from '../domain/aggregate'
import { answerKeyFor } from '../domain/answerKey'
import { openLobby, startLedRound, type RoomPatch } from '../domain/rounds'
import { SAMPLE_LEARNER_PREFIX } from '../domain/session'
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
  const inLobby = round?.mode === 'lobby'
  const responses = usePolling(roundId && hostKey && !inLobby ? `responses:${roundId}` : null, loadResponses, 3000)

  const [next, setNext] = useState<{ caseId: string; level: LearnerLevel } | null>(null)
  const [showOpenAnswers, setShowOpenAnswers] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const now = useNow(1000)

  // Leaving full screen with Esc also leaves the presenting layout.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

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
  const lobby = round.mode === 'lobby'
  const answersShown = led ? round.revealed : showOpenAnswers
  const roundResponses = responses.data?.responses ?? []
  const count = responses.data?.count ?? 0
  const aggregate = aggregateResponses(roundResponses, answerKeyFor(teachingCase, round.level))
  const timeUp = led && round.endsAt !== null && now.getTime() >= round.endsAt
  const joinUrl = absoluteUrl(studentPath(code))

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

  /** Rehearsal only. Sample answers are stored like real ones but marked, so the recap can leave them out. */
  const addSamples = async (howMany: number) => {
    const used = new Set(roundResponses.map((item) => item.text))
    const samples = teachingCase.sampleResponses
    const fresh = samples.filter((sample) => !used.has(sample))
    const texts = (fresh.length ? fresh : samples).slice(0, howMany)
    setActionError(null)
    try {
      for (const text of texts) {
        await backend.submit({
          code,
          roundId: round.roundId,
          learnerId: `${SAMPLE_LEARNER_PREFIX}${Math.random().toString(36).slice(2, 8)}`,
          caseId: round.caseId,
          level: round.level,
          text,
        })
        responses.refresh()
      }
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

  const togglePresenting = () => {
    if (presenting) {
      setPresenting(false)
      if (document.fullscreenElement) void document.exitFullscreen()
      return
    }
    setPresenting(true)
    // Full screen is a nicety. Some browsers and embedded views refuse it; the layout still switches.
    document.documentElement.requestFullscreen?.().catch(() => undefined)
  }

  return (
    <main className={presenting ? 'app-shell presenting' : 'app-shell'}>
      <header className="topbar">
        <div>
          <p className="eyebrow">First Thought · Host view</p>
          <h1>{room.label}</h1>
          <p className="subtitle">
            Learners join at <strong>{joinUrl.replace(/^https?:\/\//, '')}</strong> or room code <strong>{code}</strong>
          </p>
        </div>
        <nav className="host-links">
          <button type="button" className={presenting ? '' : 'secondary'} onClick={togglePresenting}>
            {presenting ? 'Exit presenting' : 'Present'}
          </button>
          <a className="button-link secondary present-hide" href={recapPath(code)}>
            Session recap
          </a>
          <a className="button-link secondary present-hide" href={posterPath(code)}>
            QR poster
          </a>
          <a className="button-link secondary present-hide" href={studentPath(code)} target="_blank" rel="noreferrer">
            Learner view
          </a>
          <button type="button" className="secondary present-hide" onClick={copyHostLink}>
            {copied ? 'Copied' : 'Copy host link'}
          </button>
        </nav>
      </header>

      {backend.kind === 'local' && (
        <p className="mode-banner present-hide">Demo mode: this browser only. Open the learner view in another tab to rehearse.</p>
      )}

      <section className={`status-band ${led || lobby ? 'status-led' : 'status-open'}`} aria-live="polite">
        <div>
          <strong>
            {lobby ? 'Room held' : led ? (round.revealed ? 'Revealed' : timeUp ? 'Time is up' : 'Round running') : 'Self-run'}
          </strong>
          <span>
            {lobby
              ? 'Learners who join see a waiting screen. Pick a case and start the round when everyone is in.'
              : led
                ? `Instructor-led round: ${teachingCase.label}, ${round.level}. ${round.revealed ? 'Learners see the room on their phones.' : 'Learners see answers when you reveal.'}`
                : `No one is leading. Learners get today's case (${teachingCase.label}, ${round.level}) and see the room after they submit.`}
          </span>
        </div>
        {!lobby && (
          <div className="status-count">
            <strong>{count}</strong>
            <span>{count === 1 ? 'answer' : 'answers'}</span>
          </div>
        )}
      </section>

      <section className="control-band" aria-label="Round controls">
        <label>
          {led || lobby ? 'Next round level' : 'Level'}
          <select value={plan.level} onChange={(event) => setNext({ ...plan, level: event.target.value as LearnerLevel })}>
            {Object.entries(levelConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {led || lobby ? 'Next round case' : 'Case'}
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
        {led || lobby ? (
          <button type="button" className="secondary" disabled={busy} onClick={() => act({ mode: 'open' })}>
            End, back to self-run
          </button>
        ) : (
          <>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => act(openLobby())}
              title="Learners who join wait for you instead of starting today's case"
            >
              Hold room for a session
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy || plan.level === room.level}
              onClick={() => act({ level: plan.level })}
              title="Changes the level learners get when no one is leading"
            >
              Set self-run level
            </button>
          </>
        )}
      </section>
      {actionError && <p className="warning">{actionError}</p>}

      {answersShown ? (
        <>
          <PromptBoard teachingCase={teachingCase} compact />
          {levelConfig[round.level].visibleInfo.length > 0 && <LevelBand level={round.level} teachingCase={teachingCase} />}
          <div className="debrief-wrap">
            <DebriefHeadline aggregate={aggregate} />
          </div>
          <div className="workspace-grid two-up">
            <Whiteboard responses={roundResponses} />
            <SynthesisPanel aggregate={aggregate} pearl={teachingCase.pearl} debriefFocus={levelConfig[round.level].debriefFocus} />
          </div>
          {!led && (
            <div className="button-row host-footer">
              <button type="button" className="secondary" onClick={() => setShowOpenAnswers(false)}>
                Hide answers
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="round-stage">
          <div className="round-stage-main">
            {lobby ? (
              <section className="prompt-board lobby-board">
                <div className="prompt-copy">
                  <p className="section-label">First Thought</p>
                  <h2>Scan the code to join.</h2>
                  <p>One chief complaint. Four minutes. No names. Write every cause you can think of.</p>
                </div>
              </section>
            ) : (
              <>
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
              </>
            )}
          </div>
          <section className="panel join-panel">
            <QrCode value={joinUrl} label={`QR code to join room ${code}`} />
            <p className="join-how">
              Scan to join, or enter code <strong>{code}</strong> at <strong>{window.location.host}</strong>
            </p>
            {!lobby && (
              <>
                <div className="join-count">
                  <strong>{count}</strong>
                  <span>{count === 1 ? 'answer in' : 'answers in'}</span>
                </div>
                <p className="join-note">Answers stay hidden so no one anchors on the first one.</p>
              </>
            )}
            {lobby ? (
              <button type="button" disabled={busy} onClick={() => act(startLedRound(plan.caseId, plan.level))}>
                Start 4-min round
              </button>
            ) : led ? (
              <button type="button" className="reveal-button" disabled={busy} onClick={() => act({ revealed: true })}>
                Reveal to room
              </button>
            ) : (
              <button type="button" onClick={() => setShowOpenAnswers(true)}>
                Show answers on this screen
              </button>
            )}
          </section>
        </div>
      )}

      {!(led && round.revealed) && !lobby && (
        <details className="rehearsal present-hide">
          <summary>Rehearsal tools</summary>
          <p className="muted">Sample answers let you practice the reveal without learners. They are marked as samples in the recap and export.</p>
          <div className="button-row">
            <button type="button" className="secondary" onClick={() => addSamples(1)}>
              Add one sample learner
            </button>
            <button type="button" className="secondary" onClick={() => addSamples(teachingCase.sampleResponses.length)}>
              Fill a sample room
            </button>
          </div>
        </details>
      )}
      {responses.error && <p className="warning">Connection problem: {responses.error}. Retrying.</p>}
    </main>
  )
}
