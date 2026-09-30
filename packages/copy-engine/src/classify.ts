import { ACTION_VERBS, ALLOWED_LABELS, ALT_PREFIX, SOFT_CTAS, VAGUE_CTAS, VAGUE_EMPTY } from "./guide"
import { endsWithPunctuation, firstWord, isTitleCase, lines, normalize, words } from "./text"
import type { ComponentType } from "./types"

const NAME_HINTS: Array<[RegExp, ComponentType]> = [
  [/\b(btn|button|cta)\b/i, "button"],
  [/\b(error|alert[- ]?error|invalid)\b/i, "error"],
  [/\b(success)\b/i, "success"],
  [/\b(toast|snackbar)\b/i, "snackbar"],
  [/\bbanner\b/i, "banner"],
  [/\b(dialog|modal)\b.*\btitle\b/i, "dialog_title"],
  [/\b(dialog|modal)\b/i, "dialog"],
  [/\btooltip\b/i, "tooltip"],
  [/\b(empty)\b/i, "empty_state"],
  [/\b(helper|hint|caption)\b/i, "helper_text"],
  [/\b(label)\b/i, "label"],
  [/\b(placeholder|input|field)\b/i, "form_field"],
  [/\b(tab)\b/i, "tab"],
  [/\b(nav|menu)\b/i, "navigation"],
  [/\b(heading|title|h[1-6])\b/i, "heading"],
  [/\b(loading|spinner|progress)\b/i, "loading"],
  [/\balt\b/i, "alt_text"],
]

/**
 * Fallback classifier for when the Figma side hasn't classified a layer.
 * The layer name wins; after that, the text's own shape decides.
 */
export function classify(text: string, name?: string): { type: ComponentType; inferred: boolean } {
  if (name) {
    for (const [re, type] of NAME_HINTS) if (re.test(name)) return { type, inferred: true }
  }
  const t = normalize(text)
  const lower = t.toLowerCase().replace(/[.!?]+$/, "")
  const ls = lines(text)
  const ws = words(t)

  if (ALT_PREFIX.test(t)) return { type: "alt_text", inferred: true }
  if (/\b(went wrong|couldn[’']t|could not|failed|error|invalid|unable to)\b/i.test(t)) return { type: "error", inferred: true }
  if (VAGUE_EMPTY.test(t) || /^no \w+( \w+)? yet\b/i.test(t)) return { type: "empty_state", inferred: true }
  if (/\?$/.test(ls[0] ?? "") && ls.length > 1) return { type: "dialog", inferred: true }
  if (/^are you sure/i.test(t)) return { type: "dialog_title", inferred: true }
  if (/…$|\.\.\.$/.test(ls[0] ?? "") && /ing\b/.test(ls[0] ?? "")) return { type: "loading", inferred: true }
  if (/\b(saved|sent|completed|copied|updated|deleted|added|success(fully)?)\b/i.test(t) && ws.length <= 10)
    return { type: "success", inferred: true }
  // "Manage Your Account Settings": multi-word Title Case is almost always a heading.
  if (ws.length >= 3 && ws.length <= 8 && isTitleCase(t) && !endsWithPunctuation(t)) return { type: "heading", inferred: true }
  if (
    ws.length <= 4 &&
    !endsWithPunctuation(t) &&
    (VAGUE_CTAS.includes(lower) || SOFT_CTAS.includes(lower) || ALLOWED_LABELS.includes(lower) || ACTION_VERBS.has(firstWord(t)))
  )
    return { type: "button", inferred: true }
  if (ws.length <= 6 && !endsWithPunctuation(t)) return { type: "heading", inferred: true }
  return { type: "body", inferred: true }
}
