import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { infoLabels, teachingCases, type CaseInfoKey } from './data/cases'
import { toCsv } from './export/csv'
import { downloadCsv } from './export/download'
import { scoreSubmission, summarizeRoom, type Submission } from './scoring/score'

type LearnerLevel = 'M1' | 'M2' | 'M3' | 'M4'

type LevelConfig = {
  label: string
  shortLabel: string
  task: string
  visibleInfo: CaseInfoKey[]
  debriefFocus: string
  placeholder: string
}

/** A finished round, kept so switching cases never destroys collected data. */
type Round = {
  roundId: string
  caseId: string
  level: LearnerLevel
  submissions: Submission[]
}

type StoredSession = {
  version: 2
  sessionId: string
  arm: string
  level: LearnerLevel
  caseId: string
  submissions: Submission[]
  history: Round[]
  secondsRemaining: number
}

const STORAGE_KEY = 'first-thought-ddx-session-v2'
const SESSION_LENGTH_SECONDS = 4 * 60

/** crypto.randomUUID is only defined in a secure context. Classroom laptops on a
 * plain http address would otherwise throw when a student pressed submit. */
const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const levelConfig: Record<LearnerLevel, LevelConfig> = {
  M1: {
    label: 'M1 - cold open',
    shortLabel: 'M1',
    task: 'Generate a broad differential from the chief complaint alone. Include at least one life threat.',
    visibleInfo: [],
    debriefFocus: 'Can the room name plausible causes without getting overwhelmed by case detail?',
    placeholder: 'ACS, PE, pneumonia, GERD, costochondritis...',
  },
  M2: {
    label: 'M2 - organize',
    shortLabel: 'M2',
    task: 'Use the chief complaint plus basic patient context. Group causes by system or mechanism.',
    visibleInfo: ['demographics'],
    debriefFocus: 'Can learners move from a list to categories without anchoring too early?',
    placeholder: 'Cardiac: ACS, myocarditis. Pulm: PE, pneumonia. GI: GERD...',
  },
  M3: {
    label: 'M3 - prioritize',
    shortLabel: 'M3',
    task: 'Add symptom details and past history. Prioritize most likely versus most dangerous.',
    visibleInfo: ['demographics', 'symptomDetails', 'history'],
    debriefFocus: 'Can learners separate likelihood from lethality and explain their first branch point?',
    placeholder: 'Most dangerous: PE, ACS. Most likely: pneumonia, asthma. Need ECG/CXR...',
  },
  M4: {
    label: 'M4 - synthesize',
    shortLabel: 'M4',
    task: 'Use the fuller case frame. Build a prioritized DDx with a first action or disposition concern.',
    visibleInfo: ['demographics', 'symptomDetails', 'history', 'medications', 'riskFactors'],
    debriefFocus: 'Can learners synthesize risk, meds, context, and first action without losing breadth?',
    placeholder: '1. PE - risk factors and pleuritic pain, cannot miss. 2. ACS - ECG/troponin...',
  },
}

const getStoredSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    return parsed.version === 2 ? (parsed as StoredSession) : null
  } catch {
    return null
  }
}

function App() {
  const stored = useMemo(() => getStoredSession(), [])
  const [sessionId, setSessionId] = useState(stored?.sessionId ?? makeId().slice(0, 8))
  const [arm, setArm] = useState(stored?.arm ?? '')
  const [level, setLevel] = useState<LearnerLevel>(stored?.level ?? 'M1')
  const [caseId, setCaseId] = useState(stored?.caseId ?? teachingCases[0].id)
  const [submissions, setSubmissions] = useState<Submission[]>(stored?.submissions ?? [])
  const [history, setHistory] = useState<Round[]>(stored?.history ?? [])
  const [participantId, setParticipantId] = useState('')
  const [draft, setDraft] = useState('')
  const [secondsRemaining, setSecondsRemaining] = useState(
    stored?.secondsRemaining ?? SESSION_LENGTH_SECONDS,
  )
  const [timerRunning, setTimerRunning] = useState(false)

  const teachingCase = useMemo(
    () => teachingCases.find((item) => item.id === caseId) ?? teachingCases[0],
    [caseId],
  )
  const activeLevel = levelConfig[level]
  const visibleInfo = activeLevel.visibleInfo.map((key) => ({
    key,
    label: infoLabels[key],
    value: teachingCase.info[key],
  }))

  useEffect(() => {
    const session: StoredSession = {
      version: 2,
      sessionId,
      arm,
      level,
      caseId,
      submissions,
      history,
      secondsRemaining,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // A full or blocked store must not take the session down mid class.
    }
  }, [arm, caseId, history, level, secondsRemaining, sessionId, submissions])

  useEffect(() => {
    if (!timerRunning || secondsRemaining <= 0) {
      return undefined
    }
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [secondsRemaining, timerRunning])

  const scores = useMemo(
    () => submissions.map((submission) => scoreSubmission(submission, teachingCase.cantMissIds)),
    [submissions, teachingCase],
  )
  const summary = useMemo(
    () => summarizeRoom(scores, teachingCase.cantMissIds),
    [scores, teachingCase],
  )
  const importantMissSummary = useMemo(
    () => summarizeRoom(scores, teachingCase.importantMissIds),
    [scores, teachingCase],
  )
  const missingCategories = useMemo(
    () =>
      teachingCase.expectedCategories.filter(
        (category) => !summary.categoryTally.some((entry) => entry.category === category),
      ),
    [summary, teachingCase],
  )

  const totalCollected = submissions.length + history.reduce((sum, r) => sum + r.submissions.length, 0)
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = String(secondsRemaining % 60).padStart(2, '0')

  const archiveCurrentRound = () => {
    if (submissions.length > 0) {
      setHistory((current) => [
        ...current,
        { roundId: makeId().slice(0, 8), caseId, level, submissions },
      ])
    }
    setSubmissions([])
    setDraft('')
    setSecondsRemaining(SESSION_LENGTH_SECONDS)
    setTimerRunning(false)
  }

  const changeCase = (nextCaseId: string) => {
    archiveCurrentRound()
    setCaseId(nextCaseId)
  }

  const addSubmission = (text: string) => {
    const cleanText = text.trim()
    if (!cleanText) {
      return
    }
    setSubmissions((current) => [
      ...current,
      {
        id: makeId(),
        participantId: participantId.trim() || `anon-${current.length + 1}`,
        text: cleanText,
        submittedAt: new Date().toISOString(),
      },
    ])
    setDraft('')
    setParticipantId('')
  }

  const addSample = () => {
    const used = new Set(submissions.map((submission) => submission.text))
    const sample =
      teachingCase.sampleResponses.find((response) => !used.has(response)) ??
      teachingCase.sampleResponses[submissions.length % teachingCase.sampleResponses.length]
    addSubmission(sample)
  }

  const chooseRandomCase = () => {
    const options = teachingCases.filter((item) => item.id !== caseId)
    changeCase(options[Math.floor(Math.random() * options.length)].id)
  }

  const exportAll = () => {
    const rounds: Round[] = [...history, { roundId: 'current', caseId, level, submissions }]
    const scoredRows = rounds.flatMap((round) => {
      const roundCase = teachingCases.find((item) => item.id === round.caseId) ?? teachingCases[0]
      return round.submissions.map((submission) => ({
        score: scoreSubmission(submission, roundCase.cantMissIds),
        round,
      }))
    })

    if (scoredRows.length === 0) {
      return
    }

    // One header, then every round's rows underneath it, so the whole block is
    // a single file the analyst can open directly.
    const [header, ...firstRows] = toCsv(
      [scoredRows[0].score],
      { sessionId, arm, caseId: scoredRows[0].round.caseId, level: scoredRows[0].round.level },
    ).split('\n')

    const remainingRows = scoredRows
      .slice(1)
      .flatMap(({ score, round }) =>
        toCsv([score], { sessionId, arm, caseId: round.caseId, level: round.level }).split('\n').slice(1),
      )

    const csv = [header, ...firstRows, ...remainingRows].join('\n')
    downloadCsv(csv, `first-thought-${sessionId}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Rapid Microskills for Clinical Reasoning</p>
          <h1>First Thought V2</h1>
          <p className="subtitle">
            A four-minute, low-information differential whiteboard for formative teaching.
          </p>
        </div>
        <div className="privacy-badge">
          <span>Clinician in the loop</span>
          <strong>No PHI. No names. Keyword scoring, not a language model.</strong>
        </div>
      </header>

      <section className="control-band" aria-label="Session controls">
        <label>
          Learner level
          <select value={level} onChange={(event) => setLevel(event.target.value as LearnerLevel)}>
            {Object.entries(levelConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Synthetic case
          <select value={caseId} onChange={(event) => changeCase(event.target.value)}>
            {teachingCases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Session ID
          <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
        </label>

        <label>
          Arm
          <input
            value={arm}
            placeholder="blank outside a pilot"
            onChange={(event) => setArm(event.target.value)}
          />
        </label>

        <button type="button" onClick={chooseRandomCase}>
          Random case
        </button>
        <button type="button" className="secondary" onClick={archiveCurrentRound}>
          End round
        </button>
        <button type="button" className="secondary" onClick={exportAll} disabled={totalCollected === 0}>
          Export CSV ({totalCollected})
        </button>
      </section>

      <section className="prompt-board">
        <div className="prompt-copy">
          <p className="section-label">Cold open</p>
          <h2>{teachingCase.complaint}</h2>
          <p>{teachingCase.learnerQuestion}</p>
        </div>
        <div className="timer-card" aria-live="polite">
          <span>{`${minutes}:${seconds}`}</span>
          <div className="timer-actions">
            <button type="button" onClick={() => setTimerRunning((current) => !current)}>
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSecondsRemaining(SESSION_LENGTH_SECONDS)
                setTimerRunning(false)
              }}
            >
              4 min
            </button>
          </div>
        </div>
      </section>

      <section className="level-band" aria-label="Level-specific learner view">
        <div>
          <p className="section-label">Visible learner information</p>
          <h2>{activeLevel.shortLabel} task</h2>
          <p>{activeLevel.task}</p>
        </div>

        {visibleInfo.length === 0 ? (
          <div className="info-card empty-info">
            Chief complaint only. The low-information discomfort is the point.
          </div>
        ) : (
          <div className="info-grid">
            {visibleInfo.map((item) => (
              <article key={item.key} className="info-card">
                <span>{item.label}</span>
                <p>{item.value}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="workspace-grid">
        <section className="panel response-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Student input</p>
              <h2>Anonymous DDx submissions</h2>
            </div>
            <span>{submissions.length} this round</span>
          </div>
          <label className="field-label">
            Study ID
            <input
              value={participantId}
              placeholder="the number on the student's card"
              onChange={(event) => setParticipantId(event.target.value)}
            />
          </label>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={activeLevel.placeholder}
            rows={5}
          />
          <div className="button-row">
            <button type="button" onClick={() => addSubmission(draft)}>
              Add response
            </button>
            <button type="button" className="secondary" onClick={addSample}>
              Add sample
            </button>
          </div>
          <p className="helper-copy">
            Study IDs never leave this browser and are not linked to a name anywhere in the app. The
            crosswalk between a study ID and a student is held outside the app by the data custodian.
          </p>
        </section>

        <section className="panel whiteboard-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Whiteboard</p>
              <h2>What the room generated</h2>
            </div>
          </div>
          {scores.length === 0 ? (
            <div className="empty-state">
              Add a response or sample to populate the room-level differential.
            </div>
          ) : (
            <div className="response-list">
              {scores.map((score) => (
                <article key={score.submissionId} className="response-card">
                  <div>
                    <strong>{score.participantId}</strong>
                    <span>
                      {score.breadth} dx · {score.categoryCount} systems ·{' '}
                      {score.cantMissNamed.length}/{teachingCase.cantMissIds.length} can&apos;t-miss
                    </span>
                  </div>
                  <p>{score.rawText}</p>
                  {score.parsed.unmatched.length > 0 && (
                    <p className="unmatched-note">
                      Not recognised: {score.parsed.unmatched.join(', ')}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel assistant-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Aggregate summary</p>
              <h2>Instructor-facing synthesis</h2>
            </div>
          </div>

          <div className="metric-grid">
            <div>
              <strong>{summary.n}</strong>
              <span>students this round</span>
            </div>
            <div>
              <strong>{summary.meanIndividualCoveragePct}%</strong>
              <span>mean individual can&apos;t-miss coverage</span>
            </div>
            <div>
              <strong>{summary.medianBreadth}</strong>
              <span>median diagnoses per student</span>
            </div>
            <div>
              <strong>{summary.roomCoveragePct}%</strong>
              <span>named by at least one student</span>
            </div>
          </div>

          <p className="metric-note">
            The room number rises automatically as more students submit. Compare groups on the mean
            individual score, not on the room number.
          </p>

          <div className="assistant-section">
            <h3>Can&apos;t-miss coverage</h3>
            {summary.n === 0 ? (
              <span className="muted">Waiting for responses</span>
            ) : (
              <ul className="tally-list">
                {summary.cantMissTally.map((entry) => (
                  <li key={entry.id} className={entry.namedByCount === 0 ? 'warning' : undefined}>
                    <span>{entry.name}</span>
                    <strong>
                      {entry.namedByCount} of {summary.n} ({entry.namedByPct}%)
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="assistant-section">
            <h3>Important misses to probe</h3>
            {importantMissSummary.n === 0 ? (
              <span className="muted">Waiting for responses</span>
            ) : (
              <ul className="tally-list">
                {importantMissSummary.cantMissTally.map((entry) => (
                  <li key={entry.id} className={entry.namedByCount === 0 ? 'warning' : undefined}>
                    <span>{entry.name}</span>
                    <strong>
                      {entry.namedByCount} of {importantMissSummary.n}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="assistant-section">
            <h3>Systems not represented</h3>
            <div className="chip-list">
              {missingCategories.length > 0 ? (
                missingCategories.map((category) => (
                  <span key={category} className="chip quiet-chip">
                    {category}
                  </span>
                ))
              ) : (
                <span className="positive">Broad pass</span>
              )}
            </div>
          </div>

          {summary.unmatched.length > 0 && (
            <div className="assistant-section">
              <h3>Not recognised by the term table</h3>
              <p className="metric-note">
                Check these before the debrief. A real answer sitting here is a gap in the term
                table, not a student error.
              </p>
              <div className="chip-list">
                {summary.unmatched.slice(0, 12).map((fragment) => (
                  <span key={fragment} className="chip quiet-chip">
                    {fragment}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="teaching-pearl">
            <span>One-minute pearl</span>
            <p>{teachingCase.pearl}</p>
          </div>

          <div className="debrief-card">
            <span>Faculty probe</span>
            <p>{activeLevel.debriefFocus}</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
