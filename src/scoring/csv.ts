/**
 * A small RFC 4180 reader. Qualtrics exports quote any cell containing a comma
 * or a line break, and student free text contains both, so splitting on commas
 * would corrupt rows.
 */
export const parseCsv = (input: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let i = 0

  const text = input.replace(/^\uFEFF/, '')

  while (i < text.length) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      cell += char
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }

    if (char === ',') {
      row.push(cell)
      cell = ''
      i += 1
      continue
    }

    if (char === '\r' || char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i += char === '\r' && text[i + 1] === '\n' ? 2 : 1
      continue
    }

    cell += char
    i += 1
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((entry) => entry.some((value) => value.trim().length > 0))
}

/**
 * Columns a Qualtrics export includes by default that can identify a person.
 * The pilot dataset must never carry these, so ingestion drops them and says so.
 */
export const IDENTIFYING_COLUMNS = [
  'IPAddress',
  'RecipientLastName',
  'RecipientFirstName',
  'RecipientEmail',
  'ExternalReference',
  'ExternalDataReference',
  'LocationLatitude',
  'LocationLongitude',
]

export type QualtricsExport = {
  columns: string[]
  /** The human readable question text Qualtrics puts in its second header row. */
  questionText: Record<string, string>
  rows: Record<string, string>[]
  droppedIdentifiers: string[]
}

/**
 * Reads a Qualtrics CSV export. Qualtrics writes three header rows: column
 * names, question text, then a row of import ids. Only the first is data.
 */
export const readQualtricsExport = (input: string): QualtricsExport => {
  const rows = parseCsv(input)
  if (rows.length === 0) {
    return { columns: [], questionText: {}, rows: [], droppedIdentifiers: [] }
  }

  const columns = rows[0]
  // Qualtrics writes this row as CSV-quoted JSON, so the parser hands it back
  // unescaped. Match on the key rather than on a leading brace.
  const looksLikeQualtrics = rows.length > 2 && /"?ImportId"?\s*:/.test(rows[2][0] ?? '')
  const questionRow = looksLikeQualtrics ? rows[1] : []
  const dataRows = rows.slice(looksLikeQualtrics ? 3 : 1)

  const questionText: Record<string, string> = {}
  columns.forEach((column, index) => {
    questionText[column] = questionRow[index] ?? ''
  })

  const droppedIdentifiers = columns.filter((column) => IDENTIFYING_COLUMNS.includes(column))
  const keptColumns = columns.filter((column) => !IDENTIFYING_COLUMNS.includes(column))

  const parsed = dataRows.map((values) => {
    const record: Record<string, string> = {}
    columns.forEach((column, index) => {
      if (keptColumns.includes(column)) {
        record[column] = values[index] ?? ''
      }
    })
    return record
  })

  return { columns: keptColumns, questionText, rows: parsed, droppedIdentifiers }
}
