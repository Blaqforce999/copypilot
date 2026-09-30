import type { CopyNode, ReviewSettings } from "@copypilot/copy-engine"

export type Scope = "selection" | "page"

export type LayerInfo = CopyNode & {
  /** Frame the layer sits in, for grouping and display. */
  frame?: string
  /** Mixed fonts or colors: applying new text resets them to the first character's style. */
  mixedStyle: boolean
  /** Text lives in a main component, so a change affects every instance. */
  inMainComponent: boolean
}

export type SelectionSummary = {
  textLayers: number
  label: string
}

/** UI → plugin */
export type ToPlugin =
  | { type: "AUDIT"; scope: Scope }
  | { type: "FOCUS"; nodeIds: string[] }
  | { type: "APPLY"; changes: Array<{ nodeId: string; text: string }> }
  | { type: "SAVE_SETTINGS"; settings: ReviewSettings }
  | { type: "RESIZE"; width: number; height: number }

/** Plugin → UI */
export type ToUi =
  | { type: "SELECTION"; summary: SelectionSummary }
  | { type: "SETTINGS"; settings: ReviewSettings }
  | { type: "AUDIT_PROGRESS"; done: number; total: number }
  | { type: "AUDIT_RESULT"; layers: LayerInfo[]; skippedHidden: number; scope: Scope }
  | { type: "APPLY_RESULT"; applied: string[]; failed: Array<{ nodeId: string; reason: string }> }
  | { type: "ERROR"; message: string }
