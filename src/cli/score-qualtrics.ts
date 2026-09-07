/**
 * Scores a Qualtrics export of student differentials.
 *
 * Students submit through a Qualtrics form on their own device. Qualtrics is
 * already approved and backed up by the institution, so no student data touches
 * this application's own storage. This script turns an export into the analysis
 * file, using exactly the same scoring code the classroom display uses.
 *
 * Usage:
 *   npm run score -- --input export.csv --list-columns
 *   npm run score -- --input export.csv --id-column Q1 --response-column Q2 \
 *     --case chest-pain --level M1 --arm intervention --session w03 --out scored.csv
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { teachingCases } from '../data/cases'
import { toCsv } from '../export/csv'
import { readQualtricsExport } from '../scoring/csv'
import { scoreSubmission, summarizeRoom, type Submission } from '../scoring/score'

type Args = Record<string, string | boolean>

const parseArgs = (argv: string[]): Args => {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) {
      continue
    }
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = next
      i += 1
    }
  }
  return args
}

const fail = (message: string): never => {
  console.error(`\nError: ${message}\n`)
  process.exit(1)
}

const main = () => {
  const args = parseArgs(process.argv.slice(2))
  const inputPath = typeof args.input === 'string' ? args.input : undefined
  if (!inputPath) {
    fail('--input is required. Point it at a Qualtrics CSV export.')
    return
  }

  const parsed = readQualtricsExport(readFileSync(inputPath, 'utf8'))

  if (parsed.droppedIdentifiers.length > 0) {
    console.log(
      `Dropped ${parsed.droppedIdentifiers.length} identifying column(s) from the export: ` +
        `${parsed.droppedIdentifiers.join(', ')}. These never reach the analysis file.`,
    )
  }

  if (args['list-columns']) {
    console.log(`\n${parsed.rows.length} responses. Columns:\n`)
    parsed.columns.forEach((column) => {
      const question = parsed.questionText[column]
      console.log(`  ${column}${question ? `  ${question.slice(0, 70)}` : ''}`)
    })
    console.log('\nRe-run with --id-column and --response-column to score.\n')
    return
  }

  const idColumn = typeof args['id-column'] === 'string' ? args['id-column'] : undefined
  const responseColumn =
    typeof args['response-column'] === 'string' ? args['response-column'] : undefined
  const caseId = typeof args.case === 'string' ? args.case : undefined

  if (!idColumn || !responseColumn || !caseId) {
    fail('--id-column, --response-column and --case are all required. Use --list-columns first.')
    return
  }

  const teachingCase = teachingCases.find((item) => item.id === caseId)
  if (!teachingCase) {
    fail(`Unknown case "${caseId}". Known cases: ${teachingCases.map((c) => c.id).join(', ')}`)
    return
  }

  for (const column of [idColumn, responseColumn]) {
    if (!parsed.columns.includes(column)) {
      fail(`Column "${column}" is not in the export. Use --list-columns to see what is.`)
    }
  }

  const submissions: Submission[] = parsed.rows
    .filter((row) => (row[responseColumn] ?? '').trim().length > 0)
    .map((row, index) => ({
      id: row.ResponseId || `row-${index + 1}`,
      participantId: (row[idColumn] ?? '').trim() || `missing-id-${index + 1}`,
      text: row[responseColumn],
      submittedAt: row.RecordedDate || row.EndDate || '',
    }))

  if (submissions.length === 0) {
    fail(`No non-empty responses found in column "${responseColumn}".`)
    return
  }

  const missingIds = submissions.filter((s) => s.participantId.startsWith('missing-id-')).length
  if (missingIds > 0) {
    console.log(
      `Warning: ${missingIds} response(s) had no study ID. They are kept but cannot be linked ` +
        'to an outcome, so decide before analysis whether to exclude them.',
    )
  }

  const scores = submissions.map((submission) =>
    scoreSubmission(submission, teachingCase.cantMissIds),
  )
  const summary = summarizeRoom(scores, teachingCase.cantMissIds)

  console.log(`\nCase: ${teachingCase.label}   Responses: ${summary.n}`)
  console.log(`Mean individual can't-miss coverage: ${summary.meanIndividualCoveragePct}%`)
  console.log(`Median diagnoses per student:        ${summary.medianBreadth}`)
  console.log('\nNamed by:')
  summary.cantMissTally.forEach((entry) => {
    console.log(
      `  ${entry.name.padEnd(34)} ${String(entry.namedByCount).padStart(3)} of ${summary.n} (${entry.namedByPct}%)`,
    )
  })

  if (summary.unmatched.length > 0) {
    console.log(
      `\n${summary.unmatched.length} answer(s) the term table did not recognise. Review these ` +
        'and add the real diagnoses to src/scoring/diagnoses.ts before analysis:',
    )
    summary.unmatched.slice(0, 25).forEach((fragment) => console.log(`  ${fragment}`))
  }

  const outPath = typeof args.out === 'string' ? args.out : undefined
  if (outPath) {
    const csv = toCsv(scores, {
      sessionId: typeof args.session === 'string' ? args.session : '',
      arm: typeof args.arm === 'string' ? args.arm : '',
      caseId: teachingCase.id,
      level: typeof args.level === 'string' ? args.level : '',
    })
    writeFileSync(outPath, `${csv}\n`, 'utf8')
    console.log(`\nWrote ${scores.length} scored rows to ${outPath}\n`)
  } else {
    console.log('\nAdd --out scored.csv to write the analysis file.\n')
  }
}

main()
