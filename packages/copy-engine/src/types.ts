export type ComponentType =
  | "button"
  | "label"
  | "form_field"
  | "helper_text"
  | "heading"
  | "body"
  | "navigation"
  | "tab"
  | "empty_state"
  | "error"
  | "success"
  | "snackbar"
  | "banner"
  | "dialog"
  | "dialog_title"
  | "tooltip"
  | "onboarding"
  | "confirmation"
  | "notification"
  | "loading"
  | "alt_text"
  | "unknown"

export type Severity = "critical" | "high" | "medium" | "low"

export type FindingCategory =
  | "language"
  | "ux_writing"
  | "product_ux"
  | "consistency"
  | "accessibility"
  | "brand_voice"

/** Items of the "UX Copy Audit Checklist" in the ux-writing skill. */
export type ChecklistKey =
  | "task"
  | "clear"
  | "concise"
  | "tone"
  | "familiar"
  | "jargon"
  | "consistent"
  | "consequences"
  | "next_step"
  | "accessible"

export type CopyNode = {
  id: string
  text: string
  name?: string
  componentType?: ComponentType
  /** Nearby copy, nearest first: sibling text, the parent frame title, and so on. */
  surroundingText?: string[]
  maxCharacters?: number
}

export type TermRule = {
  insteadOf: string[]
  use: string
  caseSensitive?: boolean
}

export type ReviewSettings = {
  terms?: TermRule[]
  avoid?: string[]
}

export type GuideRef = {
  /** Section of the ux-writing skill this rule comes from. */
  section: string
  principle: string
}

export type Finding = {
  id: string
  nodeId: string
  ruleId: string
  category: FindingCategory
  severity: Severity
  title: string
  explanation: string
  originalText: string
  suggestion?: string
  alternatives?: string[]
  confidence: number
  guideRef: GuideRef
  checklist: ChecklistKey
  /** Safe to include in "Apply safe fixes": mechanical, meaning-preserving. */
  autoApplicable: boolean
  /** The reviewer can't write a good fix without knowing more about the screen. */
  needsContext?: boolean
}

export type Validation = {
  passed: boolean
  reasons: string[]
}

export type NodeReview = {
  node: CopyNode
  componentType: ComponentType
  /** True when the component type was guessed from the text alone. */
  componentInferred: boolean
  findings: Finding[]
  /** Best combined rewrite of the whole layer, if the reviewer can make one. */
  suggestion?: string
  confidence: number
  validation?: Validation
  checklist: Record<ChecklistKey, boolean>
}

export type AuditResult = {
  reviews: NodeReview[]
  findings: Finding[]
  counts: Record<Severity, number>
  /** Checklist items no layer failed — shown as "passed checks". */
  passedChecks: ChecklistKey[]
}
