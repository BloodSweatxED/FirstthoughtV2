import type { ReactNode } from 'react'
import type { TeachingCase } from '../domain/types'

export function PromptBoard({ teachingCase, aside }: { teachingCase: TeachingCase; aside?: ReactNode }) {
  return (
    <section className="prompt-board">
      <div className="prompt-copy">
        <p className="section-label">Cold open</p>
        <h2>{teachingCase.complaint}</h2>
        <p>{teachingCase.learnerQuestion}</p>
      </div>
      {aside && <div className="timer-card">{aside}</div>}
    </section>
  )
}
