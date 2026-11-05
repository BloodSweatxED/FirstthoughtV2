import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { usePolling } from '../app/hooks'
import { learnerIdFor, saveAnswer, savedAnswer } from '../app/storage'
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

  // Per-round memory: what this device submitted and when it opened the case.
  const [submittedByRound, setSubmittedByRound] = useState<Record<string, string>>({})
  const [openedAt, setOpenedAt] = useState<Record<string, number>>({})
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const submittedText = roundId ? (submittedByRound[roundId] ?? savedAnswer(code, roundId)) : null
  const learnerId = useMemo(() => (roundId ? learnerIdFor(code, roundId) : null), [code, roundId])

  const loadResponses = useCallback(
    () => backend.getResponses({ code, roundId: roundId!, learnerId: learnerId! }),
    [code, roundId, learnerId],
  )
  const results = usePolling(submittedText && roundId ? `responses:${roundId}` : null, loadResponses, 4000)

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

  const config = levelConfig[round.level]
  const started = round.mode === 'led' || openedAt[round.roundId] !== undefined || Boolean(submittedText)
  const endsAt = round.mode === 'led' ? round.endsAt! : (openedAt[round.roundId] ?? 0) + ROUND_SECONDS * 1000

  const submit = async () => {
    const text = draft.trim()
    if (!text || !learnerId) return
    setSending(true)
    setSendError(null)
    try {
      await backend.submit({ code, roundId: round.roundId, learnerId, caseId: round.caseId, level: round.level, text })
      saveAnswer(code, round.roundId, text)
      setSubmittedByRound((current) => ({ ...current, [round.roundId]: text }))
      setDraft('')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not send'
      if (/already submitted/i.test(message)) {
        saveAnswer(code, round.roundId, text)
        setSubmittedByRound((current) => ({ ...current, [round.roundId]: text }))
      } else {
        setSendError(`${message}. Your answer is still here; try again.`)
      }
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
        <button type="button" className="big-button" onClick={() => setOpenedAt((current) => ({ ...current, [round.roundId]: Date.now() }))}>
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

  if (!submittedText) {
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
        <button type="button" className="big-button" onClick={submit} disabled={sending || !draft.trim()}>
          {sending ? 'Sending...' : 'Submit'}
        </button>
        {sendError && <p className="warning">{sendError}</p>}
        <p className="muted fine-print">Anonymous. One answer per round. Separate items with commas.</p>
      </StudentShell>
    )
  }

  const visible = results.data?.visible ?? false
  if (!visible) {
    return (
      <StudentShell title="Submitted" meta={header}>
        <p className="your-answer">{submittedText}</p>
        <p className="waiting">
          {round.mode === 'led'
            ? 'Waiting for your instructor to reveal the room.'
            : 'Loading the room...'}
        </p>
        {results.data && <p className="muted">{results.data.count} answers in so far.</p>}
        {results.error && <p className="warning">Connection problem. Retrying...</p>}
      </StudentShell>
    )
  }

  const key = answerKeyFor(teachingCase, round.level)
  const aggregate = aggregateResponses(results.data!.responses, key)

  return (
    <StudentShell title="How you compare" meta={header}>
      <p className="your-answer">{submittedText}</p>
      <LearnerFeedback ownText={submittedText} aggregate={aggregate} responses={results.data!.responses} pearl={teachingCase.pearl} />
      {round.mode === 'open' && (
        <p className="muted fine-print">The room keeps growing as more people answer today&apos;s case. Check back later.</p>
      )}
    </StudentShell>
  )
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
