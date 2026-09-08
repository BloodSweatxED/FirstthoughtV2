/**
 * Renders a facilitation card as the one page a facilitator holds during the
 * debrief. Plain text on purpose: it has to survive being printed, photocopied,
 * and read at arm's length in a room.
 *
 * Usage:
 *   npm run card                    list cases and whether each has a card
 *   npm run card -- --case chest-pain
 */
import { diagnosisName } from '../scoring/diagnoses'
import { teachingCases } from '../data/cases'
import { ALL_LEVELS, type LearnerLevel } from '../scoring/types'

const WIDTH = 76

/**
 * Wraps to the page width. `indent` pads every line; `hang` pads only the
 * continuation lines, so a bullet's wrapped text sits under its own text
 * rather than under the bullet.
 */
const wrap = (text: string, indent = 0, hang = 0) => {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  const padFor = (isFirst: boolean) => ' '.repeat(indent + (isFirst ? 0 : hang))
  for (const word of words) {
    const pad = padFor(lines.length === 0)
    if (pad.length + line.length + word.length + 1 > WIDTH) {
      lines.push(pad + line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) {
    lines.push(padFor(lines.length === 0) + line)
  }
  return lines.join('\n')
}

const rule = (label = '') =>
  label ? `${'-'.repeat(3)} ${label} ${'-'.repeat(Math.max(0, WIDTH - 5 - label.length))}` : '-'.repeat(WIDTH)

const argFor = (name: string) =>
  process.argv.slice(2).reduce<string | undefined>((found, token, index, all) => {
    return token === `--${name}` ? all[index + 1] : found
  }, undefined)

const caseId = argFor('case')
const levelArg = argFor('level')

if (!caseId) {
  console.log('\nCases:\n')
  teachingCases.forEach((item) => {
    console.log(`  ${item.id.padEnd(18)} ${item.card ? 'card written' : 'NEEDS A CARD'}`)
  })
  console.log(`\nLevels: ${ALL_LEVELS.join(', ')}. Each prints a different card.`)
  console.log('\nRun with --case <id> --level <M1|M2|M3|M4> to print one.\n')
  process.exit(0)
}

const teachingCase = teachingCases.find((item) => item.id === caseId)
if (!teachingCase) {
  console.error(`\nUnknown case "${caseId}".\n`)
  process.exit(1)
}
if (!teachingCase.card) {
  console.error(`\n"${caseId}" has no facilitation card yet. It cannot be used in the pilot.\n`)
  process.exit(1)
}

const card = teachingCase.card

const level = (levelArg ?? 'M1') as LearnerLevel
if (!ALL_LEVELS.includes(level)) {
  console.error(`\nUnknown level "${levelArg}". Use one of ${ALL_LEVELS.join(', ')}.\n`)
  process.exit(1)
}
const forLevel = card.byLevel[level]

console.log(`\n${'='.repeat(WIDTH)}`)
console.log(`FIRST THOUGHT  ${teachingCase.label.toUpperCase()}  ${level}`)
console.log('='.repeat(WIDTH))

console.log(`\n${rule('WHAT THEY SAW')}`)
console.log(wrap(teachingCase.stems[level]))
console.log(`\n${wrap(teachingCase.learnerQuestion)}`)

console.log(`\n${rule('OPEN')}`)
console.log(wrap(card.opening))

console.log(`\n${rule('ROUND THE ROOM')}`)
console.log(wrap(card.roundRobin.prompt))
console.log(`\n${wrap(`If someone says "same as theirs": ${card.roundRobin.whenRepeated}`)}`)

console.log(`\n${rule("THE FIVE YOU CANNOT MISS")}`)
card.cantMissNotes.forEach((note, index) => {
  console.log(`\n${index + 1}. ${diagnosisName(note.id).toUpperCase()}`)
  console.log(wrap(`Why it kills: ${note.whyItKills}`, 3))
  console.log(wrap(`What raises it: ${note.whatRaisesIt}`, 3))
})

console.log(`\n${rule(`WHAT GOOD LOOKS LIKE AT ${level}`)}`)
console.log(wrap(forLevel.emphasis))

console.log(`\n${rule('IF THE ROOM GOES QUIET')}`)
forLevel.probes.forEach((probe) => console.log(wrap(`- ${probe}`, 0, 2)))

console.log(`\n${rule(`THE TRAP AT ${level}`)}`)
console.log(wrap(forLevel.trap))

console.log(`\n${rule('CLOSE (60 SECONDS)')}`)
console.log(wrap(card.close))

console.log(`\n${'='.repeat(WIDTH)}`)
console.log('Do not read this aloud. Talk about the misses, not the hits.')
console.log(`${'='.repeat(WIDTH)}\n`)
