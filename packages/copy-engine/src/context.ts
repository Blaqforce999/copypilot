import { ACTION_HINTS, ACTION_VERBS, ALLOWED_LABELS, SOFT_CTAS, VAGUE_CTAS, type ActionHint } from "./guide"
import { capitalize, firstWord, normalize, words } from "./text"
import type { CopyNode } from "./types"

/** Context strings, nearest first, then the layer name. */
export const contextOf = (node: CopyNode) => [...(node.surroundingText ?? []), node.name ?? ""].filter(Boolean)

/** What the screen is about, e.g. "save your changes" for a profile settings form. */
export function inferAction(node: CopyNode): ActionHint | undefined {
  for (const ctx of contextOf(node)) {
    const hit = ACTION_HINTS.find((h) => h.match.test(ctx))
    if (hit) return hit
  }
  return undefined
}

const DETERMINERS = new Set(["this", "the", "your", "my", "a", "an", "these", "those", "our"])

/**
 * A specific button label from the screen, e.g. "Delete this project?" → "Delete project",
 * "Create account" heading → "Create account", "Payment details" → "Continue to payment".
 */
export function inferCta(node: CopyNode): string | undefined {
  for (const ctx of contextOf(node)) {
    const ws = words(ctx)
    if (ws.length === 0 || ws.length > 6) continue
    // Other buttons on the screen ("Cancel", "Back") aren't a description of this one.
    const l = normalize(ctx).toLowerCase().replace(/[.!?]+$/, "")
    if (ALLOWED_LABELS.includes(l) || VAGUE_CTAS.includes(l) || SOFT_CTAS.includes(l) || l === normalize(node.text).toLowerCase()) continue
    if (ACTION_VERBS.has(firstWord(ctx)) && !["continue", "submit", "go", "try"].includes(firstWord(ctx))) {
      const object = ws.slice(1).filter((w) => !DETERMINERS.has(w.toLowerCase())).slice(0, 2)
      return capitalize([ws[0]!.toLowerCase(), ...object.map((w) => w.toLowerCase())].join(" "))
    }
  }
  return inferAction(node)?.cta
}
