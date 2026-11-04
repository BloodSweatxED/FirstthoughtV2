import type { TeachingCase } from '../domain/types'

type Props = {
  teachingCase: TeachingCase
  secondsRemaining: number
  timerRunning: boolean
  onToggleTimer: () => void
  onResetTimer: () => void
}

export function PromptBoard({ teachingCase, secondsRemaining, timerRunning, onToggleTimer, onResetTimer }: Props) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = String(secondsRemaining % 60).padStart(2, '0')

  return (
    <section className="prompt-board">
      <div className="prompt-copy">
        <p className="section-label">Cold open</p>
        <h2>{teachingCase.complaint}</h2>
        <p>{teachingCase.learnerQuestion}</p>
      </div>
      <div className={`timer-card${secondsRemaining === 0 ? ' timer-done' : ''}`} aria-live="polite">
        <span>{secondsRemaining === 0 ? 'Time' : `${minutes}:${seconds}`}</span>
        <div className="timer-actions">
          <button type="button" onClick={onToggleTimer} disabled={secondsRemaining === 0}>
            {timerRunning ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="secondary" onClick={onResetTimer}>
            4 min
          </button>
        </div>
      </div>
    </section>
  )
}
