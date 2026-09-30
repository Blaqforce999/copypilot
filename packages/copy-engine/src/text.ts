export const normalize = (s: string) => s.replace(/\s+/g, " ").trim()

export const lines = (s: string) =>
  s.split(/\n+/).map((l) => l.trim()).filter(Boolean)

export const sentences = (s: string) =>
  normalize(s).split(/(?<=[.!?…])\s+/).filter(Boolean)

export const words = (s: string) => s.match(/[A-Za-z0-9][A-Za-z0-9’'-]*/g) ?? []

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Keeps the casing of the first letter of `source` when swapping in `replacement`. */
export const matchCase = (source: string, replacement: string) =>
  /^[A-Z]/.test(source) ? capitalize(replacement) : replacement

/** Capitalizes the first letter of the text and of every sentence and line. */
export const fixSentenceStarts = (s: string) =>
  s
    .replace(/^(\s*)([a-z])/, (_, ws: string, c: string) => ws + c.toUpperCase())
    .replace(/([.!?]\s+|\n\s*)([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase())

export const tidy = (s: string) =>
  fixSentenceStarts(
    s
      .replace(/[ \t]{2,}/g, " ")
      .replace(/ +([.,!?])/g, "$1")
      .replace(/^[ \t]+|[ \t]+$/gm, ""),
  )

export const endsWithPunctuation = (s: string) => /[.!?…]$/.test(s.trim())

export const firstWord = (s: string) => (words(s)[0] ?? "").toLowerCase()

export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const phraseRegExp = (phrase: string, flags = "gi") =>
  new RegExp(`(?<![\\w-])${escapeRegExp(phrase).replace(/ /g, "\\s+")}(?![\\w-])`, flags)

const MINOR_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "to", "of", "in", "on", "for", "with", "at", "by",
  "from", "as", "is", "your", "my", "our", "it", "vs",
])

/** "Save Your Changes" → true. Needs at least 2 capitalized words besides the first. */
export const isTitleCase = (s: string) => {
  const ws = words(s)
  if (ws.length < 2) return false
  const rest = ws.slice(1).filter((w) => !MINOR_WORDS.has(w.toLowerCase()) && !/^\d/.test(w))
  if (rest.length < 1) return false
  const capped = rest.filter((w) => /^[A-Z][a-z]/.test(w))
  return capped.length === rest.length && capped.length >= 1 && ws.length >= 2
}

/** Sentence case that keeps acronyms and `keep` words (proper nouns, product terms). */
export const toSentenceCase = (s: string, keep: string[] = []) => {
  const keepSet = new Set(keep.map((k) => k.toLowerCase()))
  let first = true
  return s.replace(/[A-Za-z][A-Za-z’'-]*/g, (w) => {
    const out = first || /^[A-Z0-9]{2,}$/.test(w) || keepSet.has(w.toLowerCase()) ? w : w.toLowerCase()
    first = false
    return out
  })
}

export const isAllCaps = (s: string) => {
  const letters = s.replace(/[^A-Za-z]/g, "")
  return letters.length >= 8 && letters === letters.toUpperCase() && words(s).length >= 2
}

/** Tokens that a rewrite must keep: {placeholders}, %s, and numbers. */
export const protectedTokens = (s: string) => s.match(/\{[^}]+\}|%[sd@]|\$\{[^}]+\}|\d+(?:[.,]\d+)?/g) ?? []
