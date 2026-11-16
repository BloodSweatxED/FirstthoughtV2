import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNow, usePolling } from '../app/hooks'
import { learnerIdFor, openedAtFor, saveAnswer, saveDraft, savedAnswer, savedDraft, saveOpenedAt } from '../app/storage'
import { useRoom } from '../app/useRoom'
import { backend } from '../backend'
import { Countdown } from '../components/Countdown'
import { LearnerFeedback } from '../components/LearnerFeedback'
import { infoLabels, levelConfig } from '../data/levels'
import { aggregateResponses } from '../domain/aggregate'
import { answerKeyFor } from '../domain/answerKey'
import { MAX_RESPONSE_LENGTH, ROUND_SECONDS } from '../domain/rounds'

export function StudentPage({ code }: { code: string }) {
  const { room, round, teachingCase, error, loading } = useRoom(code, 4000)
  const roundId = round?.roundId ?? null

  // Per-round memory: what this device submitted, when it opened the case, and what is typed so far.
  // Each falls back to device storage, so a reload or a locked phone picks up where it left off.
  const [submittedByRound, setSubmittedByRound] = useState<Record<string, string>>({})
  const [openedByRound, setOpenedByRound] = useState<Record<string, number>>({})
  const [draftByRound, setDraftByRound] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const submittedText = roundId ? (submittedByRound[roundId] ?? savedAnswer(code, roundId)) : null
  const openedAt = roundId ? (openedByRound[roundId] ?? openedAtFor(code, roundId)) : null
  const draft = roundId ? (draftByRound[roundId] ?? savedDraft(code, roundId)) : ''
  const learnerId = useMemo(() => (roundId ? learnerIdFor(code, roundId) : null), [code, roundId])

  // A led round that was revealed is readable by everyone, including a learner who did not answer in time.
  const revealedToAll = round?.mode === 'led' && round.revealed
  const loadResponses = useCallback(
    () => backend.getResponses({ code, roundId: roundId!, learnerId: learnerId! }),
    [code, roundId, learnerId],
  )
  const results = usePolling((submittedText || revealedToAll) && roundId ? `responses:${roundId}` : null, loadResponses, 4000)

  if (loading) return <StudentShell title="Joining room...">{null}</StudentShell>
  if (!room || !round || !teachingCase) {
    return (
      <StudentShell title="Room not found">
        <p className="muted">Check the code and try again. {error}</p>
        <a className="button-link" href="/">
          Back
        </a>
      </StudentShell>
    )
  }

  if (round.mode === 'lobby') {
    return (
      <StudentShell title="You're in" meta={<div className="student-meta"><span>{room.label}</span></div>}>
        <p className="waiting">Waiting for your instructor to start the round.</p>
        <p className="muted">Keep this page open. The case appears here by itself. Nothing you write has your name on it.</p>
      </StudentShell>
    )
  }

  const config = levelConfig[round.level]
  const started = round.mode === 'led' || openedAt !== null || Boolean(submittedText)
  const endsAt = round.mode === 'led' ? round.endsAt! : (openedAt ?? 0) + ROUND_SECONDS * 1000

  const setDraft = (text: string) => {
    setDraftByRound((current) => ({ ...current, [round.roundId]: text }))
    saveDraft(code, round.roundId, text)
  }

  const markSubmitted = (text: string) => {
    saveAnswer(code, round.roundId, text)
    setSubmittedByRound((current) => ({ ...current, [round.roundId]: text }))
    setDraft('')
  }

  const submit = async () => {
    const text = draft.trim()
    if (!text || !learnerId) return
    setSending(true)
    setSendError(null)
    try {
      await backend.submit({ code, roundId: round.roundId, learnerId, caseId: round.caseId, level: round.level, text })
      markSubmitted(text)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not send'
      if (/already submitted/i.test(message)) markSubmitted(text)
      // The round closed while they were typing. The page moves on by itself within a few seconds.
      else if (/no longer open|already revealed/i.test(message)) setSendError(`${message}.`)
      else setSendError(`${message}. Your answer is still here; try again.`)
    } finally {
      setSending(false)
    }
  }

  const header = (
    <div className="student-meta">
      <span>{room.label}</span>
      <span>
        {config.shortLabel} · {round.mode === 'led' ? 'Instructor-led' : 'Case of the day'}
      </span>
    </div>
  )

  if (!started) {
    return (
      <StudentShell title="Ready for a cold open?" meta={header}>
        <p>You&apos;ll see a chief complaint{config.visibleInfo.length ? ' and some patient details' : ''}. You get four minutes to write a differential.</p>
        <p className="muted">{config.task}</p>
        <button
          type="button"
          className="big-button"
          onClick={() => {
            const time = Date.now()
            saveOpenedAt(code, round.roundId, time)
            setOpenedByRound((current) => ({ ...current, [round.roundId]: time }))
          }}
        >
          Show me the case
        </button>
      </StudentShell>
    )
  }

  const caseCard = (
    <section className="student-case">
      <h2>{teachingCase.complaint}</h2>
      <p>{teachingCase.learnerQuestion}</p>
      {config.visibleInfo.length > 0 && (
        <dl>
          {config.visibleInfo.map((key) => (
            <div key={key}>
              <dt>{infoLabels[key]}</dt>
              <dd>{teachingCase.info[key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )

  const visible = results.data?.visible ?? false

  if (!submittedText && !revealedToAll) {
    return (
      <StudentShell title="Your differential" meta={header} aside={<Countdown endsAt={endsAt} />}>
        {caseCard}
        <p className="muted student-task">{config.task}</p>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, MAX_RESPONSE_LENGTH))}
          placeholder={config.placeholder}
          rows={6}
          aria-label="Your differential"
        />
        <TimeUpNote endsAt={endsAt} />
        <button type="button" className="big-button" onClick={submit} disabled={sending || !draft.trim()}>
          {sending ? 'Sending...' : 'Submit'}
        </button>
        {sendError && <p className="warning">{sendError}</p>}
        <p className="muted fine-print">Anonymous. One answer per round. Separate items with commas.</p>
      </StudentShell>
    )
  }

  if (!visible) {
    return (
      <StudentShell title={submittedText ? 'Submitted' : 'Round revealed'} meta={header}>
        {submittedText && <p className="your-answer">{submittedText}</p>}
        <p className="waiting">
          {round.mode === 'led' && !round.revealed ? 'Waiting for your instructor to reveal the room.' : 'Loading the room...'}
        </p>
        {results.data && !round.revealed && (
          <p className="muted">
            {results.data.count} {results.data.count === 1 ? 'answer' : 'answers'} in so far.
          </p>
        )}
        {results.error && <p className="warning">Connection problem. Retrying...</p>}
      </StudentShell>
    )
  }

  const key = answerKeyFor(teachingCase, round.level)
  const aggregate = aggregateResponses(results.data!.responses, key)

  return (
    <StudentShell title={submittedText ? 'How you compare' : 'What the room said'} meta={header}>
      {submittedText ? (
        <p className="your-answer">{submittedText}</p>
      ) : (
        <>
          {caseCard}
          <p className="muted">The room was revealed before you sent an answer. Here is what everyone else wrote.</p>
        </>
      )}
      <LearnerFeedback ownText={submittedText} aggregate={aggregate} responses={results.data!.responses} pearl={teachingCase.pearl} />
      {round.mode === 'open' && (
        <p className="muted fine-print">The room keeps growing as more people answer today&apos;s case. Check back later.</p>
      )}
    </StudentShell>
  )
}

/** The clock is a nudge, not a lock. Late answers still count until the instructor reveals. */
function TimeUpNote({ endsAt }: { endsAt: number }) {
  const now = useNow(1000)
  if (now.getTime() < endsAt) return null
  return <p className="time-up">Time is up. Send what you have.</p>
}

function StudentShell({
  title,
  meta,
  aside,
  children,
}: {
  title: string
  meta?: ReactNode
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="student-shell">
      <header className="student-header">
        <div>
          <p className="eyebrow">First Thought</p>
          <h1>{title}</h1>
        </div>
        {aside}
      </header>
      {meta}
      <div className="student-body">{children}</div>
    </main>
  )
}
