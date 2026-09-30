import { SYNONYM_GROUPS, ref } from "../guide"
import { matchCase, phraseRegExp, tidy } from "../text"
import type { Finding, NodeReview, ReviewSettings } from "../types"
import { defineRule } from "./define"

export const terminology = defineRule({
  id: "PREFERRED_TERM",
  check: ({ text, settings }) =>
    (settings.terms ?? []).flatMap((term) => {
      const flags = term.caseSensitive ? "g" : "gi"
      const used = term.insteadOf.filter((w) => phraseRegExp(w, flags).test(text))
      if (used.length === 0) return []
      return [
        {
          category: "consistency" as const,
          severity: "medium" as const,
          title: "Use the preferred term",
          explanation: `Your terms list says to use "${term.use}" instead of ${used.map((u) => `"${u}"`).join(", ")}.`,
          confidence: 0.95,
          guideRef: ref("Core Principles", "Use consistent terms across the product."),
          checklist: "consistent" as const,
          patch: (s: string) =>
            used.reduce((acc, w) => acc.replace(phraseRegExp(w, flags), (m) => matchCase(m, term.use)), s),
          autoApplicable: true,
        },
      ]
    }),
})

export const avoidWords = defineRule({
  id: "AVOID_WORD",
  check: ({ text, settings }) => {
    const used = (settings.avoid ?? []).filter((w) => phraseRegExp(w).test(text))
    if (used.length === 0) return
    return {
      category: "brand_voice",
      severity: "medium",
      title: "Word on your avoid list",
      explanation: `Your voice settings avoid ${used.map((u) => `"${u}"`).join(", ")}.`,
      confidence: 0.95,
      guideRef: ref("Tone Mapping", "Match tone to context."),
      checklist: "tone",
      patch: (s) => tidy(used.reduce((acc, w) => acc.replace(phraseRegExp(w), ""), s)),
    }
  },
})

export const settingsRules = [terminology, avoidWords]

/**
 * Audit-wide check: the same concept named two ways ("Sign in" on one screen, "Log in" on another).
 * The preferred variant is the one in the terms list, otherwise the most used, otherwise the guide's default.
 */
export function inconsistentTerms(
  reviews: NodeReview[],
  settings: ReviewSettings,
): Array<{ finding: Finding; patch: (s: string) => string }> {
  const findings: Array<{ finding: Finding; patch: (s: string) => string }> = []
  for (const group of SYNONYM_GROUPS) {
    const configured = (settings.terms ?? []).some((t) => group.includes(t.use.toLowerCase()))
    if (configured) continue
    const usage = group.map((variant) => ({
      variant,
      nodes: reviews.filter((r) => phraseRegExp(variant).test(r.node.text)),
    }))
    const used = usage.filter((u) => u.nodes.length > 0)
    if (used.length < 2) continue
    const preferred = [...used].sort((a, b) => b.nodes.length - a.nodes.length || group.indexOf(a.variant) - group.indexOf(b.variant))[0]!
    for (const other of used) {
      if (other === preferred) continue
      for (const r of other.nodes) {
        const patch = (s: string) => s.replace(phraseRegExp(other.variant), (m) => matchCase(m, preferred.variant))
        const suggestion = patch(r.node.text)
        findings.push({ patch, finding: {
          id: `${r.node.id}:INCONSISTENT_TERM:${other.variant}`,
          nodeId: r.node.id,
          ruleId: "INCONSISTENT_TERM",
          category: "consistency",
          severity: "medium",
          title: "Inconsistent term",
          explanation: `This audit uses both "${preferred.variant}" (${preferred.nodes.length}×) and "${other.variant}" (${other.nodes.length}×). Pick one and use it everywhere.`,
          originalText: r.node.text,
          suggestion,
          confidence: 0.8,
          guideRef: ref("Core Principles", "Use consistent terms across the product."),
          checklist: "consistent",
          autoApplicable: false,
        } })
      }
    }
  }
  return findings
}
