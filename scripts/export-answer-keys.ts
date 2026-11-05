// Writes docs/review/answer-keys.md: every case, every level, what learners see and what the key expects.
// Run: npm run export:keys
import { writeFileSync } from 'node:fs'
import { teachingCases } from '../src/data/cases'
import { diagnosisById } from '../src/data/diagnoses'
import { infoLabels, levelConfig } from '../src/data/levels'
import { answerKeyFor } from '../src/domain/answerKey'
import { LEARNER_LEVELS } from '../src/domain/types'

const names = (ids: string[]) => (ids.length ? ids.map((id) => diagnosisById[id]?.name ?? id).join('; ') : '(none)')

const lines: string[] = [
  '# First Thought answer keys for clinical review',
  '',
  'Generated from `src/data/cases.ts`. Do not edit by hand; run `npm run export:keys`.',
  '',
]

for (const teachingCase of teachingCases) {
  lines.push(`## ${teachingCase.label}`, '', `Chief complaint: ${teachingCase.complaint}`, '')
  for (const level of LEARNER_LEVELS) {
    const config = levelConfig[level]
    const key = answerKeyFor(teachingCase, level)
    const seen = config.visibleInfo.map((info) => `${infoLabels[info]}: ${teachingCase.info[info]}`)
    lines.push(
      `### ${level}`,
      '',
      `What learners see: ${seen.length ? seen.join(' | ') : 'chief complaint only'}`,
      '',
      `Task: ${config.task}`,
      '',
      '| List | Diagnoses |',
      '| --- | --- |',
      `| Can't miss | ${names(key.cannotMiss)} |`,
      `| Most likely | ${names(key.mostLikely)} |`,
      `| Also consider | ${names(key.alsoConsider)} |`,
      '',
    )
  }
  lines.push(`Teaching pearl: ${teachingCase.pearl}`, '')
}

writeFileSync('docs/review/answer-keys.md', lines.join('\n'))
console.log('Wrote docs/review/answer-keys.md')
