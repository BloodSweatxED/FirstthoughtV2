import { useMemo } from 'react'
import './App.css'
import { LevelBand } from './components/LevelBand'
import { PromptBoard } from './components/PromptBoard'
import { ResponsePanel } from './components/ResponsePanel'
import { SessionControls } from './components/SessionControls'
import { SynthesisPanel } from './components/SynthesisPanel'
import { useSessionState } from './components/useSessionState'
import { Whiteboard } from './components/Whiteboard'
import { teachingCases } from './data/cases'
import { levelConfig } from './data/levels'
import { aggregateResponses } from './domain/aggregate'
import { answerKeyFor } from './domain/answerKey'

function App() {
  const session = useSessionState()
  const teachingCase = teachingCases.find((item) => item.id === session.caseId) ?? teachingCases[0]
  const config = levelConfig[session.level]

  const aggregate = useMemo(
    () => aggregateResponses(session.responses, answerKeyFor(teachingCase, session.level)),
    [session.responses, session.level, teachingCase],
  )

  const addSample = () => {
    const used = new Set(session.responses.map((response) => response.text))
    const samples = teachingCase.sampleResponses
    session.addResponse(samples.find((sample) => !used.has(sample)) ?? samples[session.responses.length % samples.length])
  }

  const chooseRandomCase = () => {
    const options = teachingCases.filter((item) => item.id !== session.caseId)
    session.setCaseId(options[Math.floor(Math.random() * options.length)].id)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Rapid Microskills for Clinical Reasoning</p>
          <h1>First Thought</h1>
          <p className="subtitle">A four-minute, low-information differential whiteboard for formative teaching.</p>
        </div>
        <div className="privacy-badge">
          <span>Formative only</span>
          <strong>No PHI. No names. Aggregate patterns only.</strong>
        </div>
      </header>

      <SessionControls
        level={session.level}
        caseId={session.caseId}
        onLevel={session.setLevel}
        onCase={session.setCaseId}
        onRandomCase={chooseRandomCase}
        onReset={session.resetRound}
      />
      <PromptBoard
        teachingCase={teachingCase}
        secondsRemaining={session.secondsRemaining}
        timerRunning={session.timerRunning}
        onToggleTimer={session.toggleTimer}
        onResetTimer={session.resetTimer}
      />
      <LevelBand level={session.level} teachingCase={teachingCase} />

      <div className="workspace-grid">
        <ResponsePanel
          count={session.responses.length}
          placeholder={config.placeholder}
          onSubmit={session.addResponse}
          onSample={addSample}
        />
        <Whiteboard responses={session.responses} />
        <SynthesisPanel aggregate={aggregate} pearl={teachingCase.pearl} debriefFocus={config.debriefFocus} />
      </div>
    </main>
  )
}

export default App
