import type { ReactNode } from 'react'
import type { TeachingCase } from '../domain/types'

/** The case on the projector. `compact` shrinks it once the debrief becomes the main thing on screen. */
export function PromptBoard({ teachingCase, aside, compact = false }: { teachingCase: TeachingCase; aside?: ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? 'prompt-board prompt-compact' : 'prompt-board'}>
      <div className="prompt-copy">
        <p className="section-label">Cold open</p>
        <h2>{teachingCase.complaint}</h2>
        <p>{teachingCase.learnerQuestion}</p>
      </div>
      {aside && <div className="timer-card">{aside}</div>}
    </section>
  )
}
