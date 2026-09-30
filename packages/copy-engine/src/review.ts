import { classify } from "./classify"
import { CHECKLIST } from "./guide"
import { componentRules } from "./rules/components"
import type { Draft, Rule, RuleContext } from "./rules/define"
import { languageRules } from "./rules/language"
import { inconsistentTerms, settingsRules } from "./rules/settings"
import { normalize, phraseRegExp, protectedTokens, tidy } from "./text"
import type {
  AuditResult,
  ChecklistKey,
  ComponentType,
  CopyNode,
  Finding,
  NodeReview,
  ReviewSettings,
  Severity,
  Validation,
} from "./types"

export const RULES: Rule[] = [...componentRules, ...languageRules, ...settingsRules]

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }

/** Findings below this confidence are shown under "Possible improvements". */
export const CONFIDENCE_THRESHOLD = 0.6

type Drafted = Draft & { ruleId: string }

function runRules(ctx: RuleContext): Drafted[] {
  const out: Drafted[] = []
  for (const rule of RULES) {
    if (rule.on && !rule.on.includes(ctx.type)) continue
    if (rule.skip?.includes(ctx.type)) continue
    const result = rule.check(ctx)
    if (!result) continue
    for (const d of Array.isArray(result) ? result : [result]) out.push({ ...d, ruleId: rule.id })
  }
  return out
}

const same = (a: string, b: string) => normalize(a) === normalize(b)

/**
 * Builds one rewrite for the layer: start from the strongest whole-layer rewrite (or the
 * original), then apply mechanical patches until no rule has anything left to patch.
 */
function combine(drafts: Drafted[], ctx: RuleContext): string | undefined {
  const rewrite = [...drafts]
    .filter((d) => d.rewrite)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0]?.rewrite
  let text = rewrite ?? ctx.text
  let pending = rewrite ? runRules({ ...ctx, text }) : drafts
  for (let pass = 0; pass < 3; pass++) {
    const patches = pending.filter((d) => d.patch)
    if (patches.length === 0) break
    const next = tidy(patches.reduce((acc, d) => d.patch!(acc), text))
    if (next === text) break
    text = next
    pending = runRules({ ...ctx, text })
  }
  return same(text, ctx.text) ? undefined : text
}

/** Re-reviews a suggestion before it can be applied (architecture.md §11). */
export function validate(original: string, suggestion: string, node: CopyNode, type: ComponentType, settings: ReviewSettings): Validation {
  const reasons: string[] = []
  const remaining = runRules({ node, type, text: suggestion, settings }).filter(
    (d) => (d.severity === "critical" || d.severity === "high") && !d.needsContext,
  )
  for (const d of remaining) reasons.push(`Still has an issue: ${d.title.toLowerCase()}`)
  if (node.maxCharacters && suggestion.length > node.maxCharacters)
    reasons.push(`Longer than the ${node.maxCharacters}-character space`)
  const missing = protectedTokens(original).filter((t) => !suggestion.includes(t))
  if (missing.length) reasons.push(`Drops ${missing.map((m) => `"${m}"`).join(", ")} from the original`)
  for (const w of settings.avoid ?? []) if (phraseRegExp(w).test(suggestion)) reasons.push(`Uses "${w}" from your avoid list`)
  for (const t of settings.terms ?? [])
    for (const w of t.insteadOf)
      if (phraseRegExp(w, t.caseSensitive ? "g" : "gi").test(suggestion)) reasons.push(`Uses "${w}" instead of "${t.use}"`)
  return { passed: reasons.length === 0, reasons }
}

const emptyChecklist = () =>
  Object.fromEntries(Object.keys(CHECKLIST).map((k) => [k, true])) as Record<ChecklistKey, boolean>

export function reviewNode(node: CopyNode, settings: ReviewSettings = {}): NodeReview {
  const classified = node.componentType ? { type: node.componentType, inferred: false } : classify(node.text, node.name)
  const ctx: RuleContext = { node, type: classified.type, text: node.text, settings }
  const drafts = runRules(ctx)

  const findings: Finding[] = drafts.map((d, i) => {
    const own = d.rewrite ?? (d.patch ? tidy(d.patch(node.text)) : undefined)
    return {
      id: `${node.id}:${d.ruleId}:${i}`,
      nodeId: node.id,
      ruleId: d.ruleId,
      category: d.category,
      severity: d.severity,
      title: d.title,
      explanation: d.explanation,
      originalText: node.text,
      suggestion: own && !same(own, node.text) ? own : undefined,
      alternatives: d.alternatives,
      confidence: d.confidence,
      guideRef: d.guideRef,
      checklist: d.checklist,
      autoApplicable: Boolean(d.autoApplicable),
      needsContext: d.needsContext,
    }
  })

  const checklist = emptyChecklist()
  for (const f of findings) checklist[f.checklist] = false

  const suggestion = combine(drafts, ctx)
  const contributing = findings.filter((f) => f.suggestion)
  let confidence = contributing.length
    ? contributing.reduce((sum, f) => sum + f.confidence, 0) / contributing.length
    : 0
  const validation = suggestion ? validate(node.text, suggestion, node, classified.type, settings) : undefined
  if (validation && !validation.passed) confidence = Math.min(confidence, 0.5)

  return {
    node,
    componentType: classified.type,
    componentInferred: classified.inferred,
    findings,
    suggestion,
    confidence: Math.round(confidence * 100) / 100,
    validation,
    checklist,
  }
}

export function reviewCopy(nodes: CopyNode[], settings: ReviewSettings = {}): AuditResult {
  const reviews = nodes.filter((n) => n.text.trim()).map((n) => reviewNode(n, settings))

  for (const { finding, patch } of inconsistentTerms(reviews, settings)) {
    const r = reviews.find((rv) => rv.node.id === finding.nodeId)!
    r.findings.push(finding)
    r.checklist.consistent = false
    r.suggestion = patch(r.suggestion ?? r.node.text)
    r.confidence = r.confidence || finding.confidence
  }

  const findings = reviews
    .flatMap((r) => r.findings)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.confidence - a.confidence)

  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const f of findings) counts[f.severity]++

  const failed = new Set(findings.map((f) => f.checklist))
  const passedChecks = (Object.keys(CHECKLIST) as ChecklistKey[]).filter((k) => !failed.has(k))

  return { reviews, findings, counts, passedChecks }
}
