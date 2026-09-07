import { describe, expect, it } from 'vitest'
import { parseCsv, readQualtricsExport } from './csv'

describe('csv parser', () => {
  it('reads plain rows', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('keeps commas inside quoted cells, which student answers always contain', () => {
    expect(parseCsv('id,ddx\n0417,"ACS, PE, GERD"')).toEqual([
      ['id', 'ddx'],
      ['0417', 'ACS, PE, GERD'],
    ])
  })

  it('keeps line breaks inside quoted cells', () => {
    const rows = parseCsv('id,ddx\n0417,"1. PE\n2. ACS"')
    expect(rows).toHaveLength(2)
    expect(rows[1][1]).toBe('1. PE\n2. ACS')
  })

  it('unescapes doubled quotes', () => {
    expect(parseCsv('a\n"he said ""PE"""')[1][0]).toBe('he said "PE"')
  })

  it('handles CRLF line endings, which Qualtrics writes on Windows', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('strips a UTF-8 byte order mark', () => {
    expect(parseCsv('﻿id,ddx\n1,PE')[0][0]).toBe('id')
  })
})

const qualtricsFixture = [
  'StartDate,EndDate,ResponseId,IPAddress,RecipientEmail,LocationLatitude,RecordedDate,Q1,Q2',
  '"Start Date","End Date","Response ID","IP Address","Recipient Email","Location Latitude","Recorded Date","Your study ID","Your differential"',
  // Qualtrics CSV-quotes this row, so the inner quotes arrive doubled.
  [
    '"{""ImportId"":""startDate""}"',
    '"{""ImportId"":""endDate""}"',
    '"{""ImportId"":""_recordId""}"',
    '"{""ImportId"":""ipAddress""}"',
    '"{""ImportId"":""recipientEmail""}"',
    '"{""ImportId"":""locationLatitude""}"',
    '"{""ImportId"":""recordedDate""}"',
    '"{""ImportId"":""QID1""}"',
    '"{""ImportId"":""QID2""}"',
  ].join(','),
  '2027-01-12 10:00,2027-01-12 10:04,R_001,10.0.0.1,student@school.edu,41.8,2027-01-12 10:04,0417,"ACS, PE, GERD"',
  '2027-01-12 10:00,2027-01-12 10:04,R_002,10.0.0.2,other@school.edu,41.8,2027-01-12 10:04,0982,"migraine, anxiety"',
].join('\n')

describe('qualtrics export reader', () => {
  it('skips the two extra header rows Qualtrics writes', () => {
    const parsed = readQualtricsExport(qualtricsFixture)
    expect(parsed.rows).toHaveLength(2)
    expect(parsed.rows[0].Q1).toBe('0417')
    expect(parsed.rows[0].Q2).toBe('ACS, PE, GERD')
  })

  it('drops every identifying column Qualtrics adds by default', () => {
    const parsed = readQualtricsExport(qualtricsFixture)
    expect(parsed.droppedIdentifiers).toEqual(['IPAddress', 'RecipientEmail', 'LocationLatitude'])
    expect(parsed.columns).not.toContain('IPAddress')
    expect(parsed.columns).not.toContain('RecipientEmail')
    expect(JSON.stringify(parsed.rows)).not.toContain('student@school.edu')
    expect(JSON.stringify(parsed.rows)).not.toContain('10.0.0.1')
  })

  it('keeps the question text so columns can be identified by hand', () => {
    const parsed = readQualtricsExport(qualtricsFixture)
    expect(parsed.questionText.Q2).toBe('Your differential')
  })

  it('reads a plain csv that is not a Qualtrics export', () => {
    const parsed = readQualtricsExport('id,ddx\n0417,"ACS, PE"')
    expect(parsed.rows).toEqual([{ id: '0417', ddx: 'ACS, PE' }])
  })
})
