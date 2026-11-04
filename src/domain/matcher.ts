import { diagnoses as defaultDictionary } from '../data/diagnoses'
import type { Diagnosis } from './types'

export type MatchResult = {
  /** Diagnosis ids found, in the order the learner wrote them. No duplicates. */
  matched: string[]
  /** List items that contained no recognized diagnosis. Useful for growing the dictionary. */
  unrecognized: string[]
}

/** Anything that turns free text into diagnosis ids. The rules matcher is one; an LLM pass could be another. */
export type Matcher = (text: string) => MatchResult

type Pattern = { tokens: string[]; dx: string }

/** Lowercase, drop apostrophes, turn every other non-alphanumeric run into a single space. */
export const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const tokenize = (value: string) => {
  const normalized = normalize(value)
  return normalized ? normalized.split(' ') : []
}

/** Words that label a list rather than name a diagnosis. Items made only of these are ignored. */
const FILLER = new Set([
  'most', 'likely', 'dangerous', 'least', 'common', 'cant', 'miss', 'cannot', 'must', 'not', 'rule', 'out', 'r', 'o',
  'ro', 'ddx', 'differential', 'vs', 'versus', 'or', 'and', 'also', 'maybe', 'possible', 'probably', 'consider',
  'cardiac', 'cardio', 'pulm', 'pulmonary', 'gi', 'neuro', 'id', 'infectious', 'renal', 'gu', 'gyn', 'ob', 'psych',
  'tox', 'endo', 'metabolic', 'heme', 'other', 'misc', 'the', 'a', 'an', 'of', 'with', 'w', 'etc',
])

/** Plurals and possessives: "migraines", "seizures", "boerhaaves", "pes". */
const tokenMatches = (token: string, target: string) =>
  token === target || (token.length > target.length && token === `${target}s`)

const compilePatterns = (dictionary: Diagnosis[]): Pattern[] =>
  dictionary
    .flatMap((diagnosis) =>
      diagnosis.synonyms.map((synonym) => ({ tokens: tokenize(synonym), dx: diagnosis.id })),
    )
    .filter((pattern) => pattern.tokens.length > 0)
    // Longest phrase first, so "cervical artery dissection" claims its words before "dissection" can.
    .sort(
      (a, b) =>
        b.tokens.length - a.tokens.length || b.tokens.join(' ').length - a.tokens.join(' ').length,
    )

/** Split a free-text answer into list items: commas, semicolons, newlines, slashes, and numbering. */
export const splitItems = (text: string) =>
  text
    .split(/[,;\n/]|\s\d+[.)]\s|\band\b|\bvs\.?\b|\bversus\b/i)
    .map((item) => item.replace(/^\s*\d+[.)]?\s*/, '').trim())
    .filter(Boolean)

const matchItem = (item: string, patterns: Pattern[]) => {
  const tokens = tokenize(item)
  const consumed = new Array<boolean>(tokens.length).fill(false)
  const hits: { dx: string; position: number }[] = []

  for (const pattern of patterns) {
    const width = pattern.tokens.length
    for (let start = 0; start + width <= tokens.length; start += 1) {
      let fits = true
      for (let offset = 0; offset < width; offset += 1) {
        if (consumed[start + offset] || !tokenMatches(tokens[start + offset], pattern.tokens[offset])) {
          fits = false
          break
        }
      }
      if (fits) {
        for (let offset = 0; offset < width; offset += 1) consumed[start + offset] = true
        hits.push({ dx: pattern.dx, position: start })
      }
    }
  }

  const meaningful = tokens.some((token) => !FILLER.has(token))
  return { hits: hits.sort((a, b) => a.position - b.position), meaningful }
}

export const createRulesMatcher = (dictionary: Diagnosis[] = defaultDictionary): Matcher => {
  const patterns = compilePatterns(dictionary)

  return (text) => {
    const matched: string[] = []
    const unrecognized: string[] = []

    for (const item of splitItems(text)) {
      const { hits, meaningful } = matchItem(item, patterns)
      if (hits.length === 0) {
        if (meaningful) unrecognized.push(item)
        continue
      }
      for (const hit of hits) {
        if (!matched.includes(hit.dx)) matched.push(hit.dx)
      }
    }

    return { matched, unrecognized }
  }
}

export const matchDiagnoses = createRulesMatcher()
