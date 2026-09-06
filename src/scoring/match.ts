import { DIAGNOSES } from './diagnoses'
import type { DiagnosisCategory, Mention, ParsedResponse } from './types'

/**
 * Terms that are also ordinary English words. These only count when the student
 * wrote them in capitals, so the sentence "pain radiates to the shoulder as
 * described" does not score as aortic stenosis.
 */
const CASE_SENSITIVE_TERMS = new Set(['as', 'cap'])

/**
 * Words that mean the student ruled the diagnosis out rather than raised it.
 * "rule out" and "r/o" are deliberately absent: naming a dangerous diagnosis in
 * order to exclude it is the behaviour this exercise is trying to teach.
 */
const NEGATION_CUES = new Set(['no', 'not', 'without', 'denies', 'denied', 'doubt', 'doubtful'])

const NEGATION_LOOKBACK = 3

/** Splits on anything that is not a letter or a digit, keeping original case. */
const tokenize = (text: string) => {
  const tokens: { raw: string; lower: string; start: number; end: number }[] = []
  const pattern = /[A-Za-z0-9]+/g
  let match = pattern.exec(text)
  while (match !== null) {
    tokens.push({
      raw: match[0],
      lower: match[0].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length,
    })
    match = pattern.exec(text)
  }
  return tokens
}

type SpanMatch = {
  startToken: number
  endToken: number
  startChar: number
  endChar: number
  diagnosisId: string
  term: string
}

const termTokens = (term: string) => term.split(/[^a-z0-9]+/i).filter(Boolean)

/** All term matches in the text, before overlaps are resolved. */
const findAllSpans = (text: string): SpanMatch[] => {
  const tokens = tokenize(text)
  const spans: SpanMatch[] = []

  for (const diagnosis of DIAGNOSES) {
    for (const term of diagnosis.terms) {
      const needle = termTokens(term.toLowerCase())
      if (needle.length === 0) {
        continue
      }
      const caseSensitive = needle.length === 1 && CASE_SENSITIVE_TERMS.has(needle[0])

      for (let i = 0; i + needle.length <= tokens.length; i += 1) {
        let hit = true
        for (let j = 0; j < needle.length; j += 1) {
          const token = tokens[i + j]
          if (token.lower !== needle[j]) {
            hit = false
            break
          }
          if (caseSensitive && token.raw !== token.raw.toUpperCase()) {
            hit = false
            break
          }
        }
        if (hit) {
          spans.push({
            startToken: i,
            endToken: i + needle.length,
            startChar: tokens[i].start,
            endChar: tokens[i + needle.length - 1].end,
            diagnosisId: diagnosis.id,
            term,
          })
        }
      }
    }
  }

  return spans
}

/**
 * Longest match wins on overlapping spans. This is what keeps "ectopic
 * pregnancy" from also scoring as an intrauterine pregnancy, and "pericardial
 * effusion" from also scoring as a pleural effusion.
 */
const resolveOverlaps = (spans: SpanMatch[]): SpanMatch[] => {
  const ordered = [...spans].sort((a, b) => {
    const lengthDiff = b.endToken - b.startToken - (a.endToken - a.startToken)
    return lengthDiff !== 0 ? lengthDiff : a.startToken - b.startToken
  })

  const taken: SpanMatch[] = []
  for (const span of ordered) {
    const overlaps = taken.some(
      (other) => span.startToken < other.endToken && other.startToken < span.endToken,
    )
    if (!overlaps) {
      taken.push(span)
    }
  }

  return taken.sort((a, b) => a.startToken - b.startToken)
}

const isNegated = (text: string, span: SpanMatch) => {
  const tokens = tokenize(text)
  const from = Math.max(0, span.startToken - NEGATION_LOOKBACK)
  for (let i = from; i < span.startToken; i += 1) {
    if (NEGATION_CUES.has(tokens[i].lower)) {
      return true
    }
  }
  return false
}

/** Fragments the student wrote, used to find answers the registry does not know. */
const splitFragments = (text: string) => {
  const parts: { text: string; start: number }[] = []
  const pattern = /[^,;\n\r|]+/g
  let match = pattern.exec(text)
  while (match !== null) {
    parts.push({ text: match[0], start: match.index })
    match = pattern.exec(text)
  }
  return parts
}

/** Leading list markers and category headers that are not diagnoses. */
const stripFragmentNoise = (fragment: string) =>
  fragment
    .replace(/^\s*[-*•]?\s*\d+[.)]?\s*/, '')
    .replace(/^[^:]{1,24}:\s*/, '')
    .trim()

export const parseResponse = (text: string): ParsedResponse => {
  const spans = resolveOverlaps(findAllSpans(text))

  const mentions: Mention[] = spans.map((span) => {
    const diagnosis = DIAGNOSES.find((entry) => entry.id === span.diagnosisId)!
    return {
      diagnosisId: diagnosis.id,
      name: diagnosis.name,
      category: diagnosis.category,
      matchedTerm: span.term,
      negated: isNegated(text, span),
    }
  })

  const diagnosisIds = Array.from(new Set(mentions.map((mention) => mention.diagnosisId)))
  const categories = Array.from(
    new Set(mentions.map((mention) => mention.category)),
  ) as DiagnosisCategory[]

  const unmatched = splitFragments(text)
    .filter((fragment) => {
      const end = fragment.start + fragment.text.length
      return !spans.some((span) => span.startChar >= fragment.start && span.endChar <= end)
    })
    .map((fragment) => stripFragmentNoise(fragment.text))
    .filter((fragment) => fragment.length >= 3 && /[a-z]/i.test(fragment))

  return { mentions, diagnosisIds, categories, unmatched }
}
