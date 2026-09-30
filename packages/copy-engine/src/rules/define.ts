import type {
  ChecklistKey,
  ComponentType,
  CopyNode,
  FindingCategory,
  GuideRef,
  ReviewSettings,
  Severity,
} from "../types"

export type RuleContext = {
  node: CopyNode
  type: ComponentType
  /** Original layer text. */
  text: string
  settings: ReviewSettings
}

/** What a rule reports. The engine adds ids and turns `patch` or `rewrite` into a suggestion. */
export type Draft = {
  category: FindingCategory
  severity: Severity
  title: string
  explanation: string
  confidence: number
  guideRef: GuideRef
  checklist: ChecklistKey
  /** Mechanical edit that can be combined with other patches. */
  patch?: (text: string) => string
  /** Whole-layer replacement (takes precedence over patches). */
  rewrite?: string
  alternatives?: string[]
  autoApplicable?: boolean
  needsContext?: boolean
}

export type Rule = {
  id: string
  /** Component types the rule runs on; omitted = all. */
  on?: ComponentType[]
  /** Component types the rule skips. */
  skip?: ComponentType[]
  check: (ctx: RuleContext) => Draft | Draft[] | undefined
}

export const defineRule = (rule: Rule) => rule

export const SHORT_UI: ComponentType[] = ["button", "label", "navigation", "tab", "heading", "dialog_title", "form_field"]
export const CRITICAL_STATES: ComponentType[] = ["error", "dialog", "dialog_title", "banner", "confirmation"]
