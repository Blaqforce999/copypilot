import {
  CHECKLIST,
  CONFIDENCE_THRESHOLD,
  GUIDE_NAME,
  reviewCopy,
  reviewNode,
  type AuditResult,
  type ChecklistKey,
  type Finding,
  type NodeReview,
  type ReviewSettings,
  type Severity,
  type TermRule,
} from "@copypilot/copy-engine"
import type { LayerInfo, Scope, SelectionSummary, ToPlugin, ToUi } from "./messages"

// ─── State ──────────────────────────────────────────────────────────────────

type Group = {
  key: string
  reviews: NodeReview[]
  layers: LayerInfo[]
  findings: Finding[]
  severity: Severity
  confidence: number
}

const SEV: Severity[] = ["critical", "high", "medium", "low"]
const rank = (s: Severity) => SEV.indexOf(s)

const state = {
  tab: "audit" as "audit" | "rules",
  scope: "selection" as Scope,
  scopeTouched: false,
  summary: { textLayers: 0, label: "Nothing selected" } as SelectionSummary,
  settings: {} as ReviewSettings,
  status: "idle" as "idle" | "running" | "done",
  progress: { done: 0, total: 0 },
  auditScope: "selection" as Scope,
  layers: [] as LayerInfo[],
  skippedHidden: 0,
  result: undefined as AuditResult | undefined,
  groups: [] as Group[],
  filter: "all" as Severity | "all",
  open: undefined as string | undefined,
  editing: undefined as string | undefined,
  draft: "",
  dismissed: new Set<string>(),
  applied: new Map<string, string>(),
  error: undefined as string | undefined,
}

const send = (msg: ToPlugin) => parent.postMessage({ pluginMessage: msg }, "*")

// ─── Helpers ────────────────────────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

const KIND: Record<string, string> = {
  button: "Button", label: "Label", form_field: "Form field", helper_text: "Helper text",
  heading: "Heading", body: "Body text", navigation: "Navigation", tab: "Tab",
  empty_state: "Empty state", error: "Error message", success: "Success message",
  snackbar: "Snackbar", banner: "Banner", dialog: "Dialog", dialog_title: "Dialog title",
  tooltip: "Tooltip", onboarding: "Onboarding", confirmation: "Confirmation",
  notification: "Notification", loading: "Loading", alt_text: "Alt text", unknown: "Text",
}

/** Word-level diff: marks removed words in the original and added words in the suggestion. */
function diff(a: string, b: string): { before: string; after: string } {
  const A = a.split(/(\s+)/)
  const B = b.split(/(\s+)/)
  const dp = Array.from({ length: A.length + 1 }, () => new Array<number>(B.length + 1).fill(0))
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--)
      dp[i]![j] = A[i] === B[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
  let i = 0
  let j = 0
  let before = ""
  let after = ""
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) {
      before += esc(A[i]!)
      after += esc(B[j]!)
      i++
      j++
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      before += /^\s+$/.test(A[i]!) ? esc(A[i]!) : `<del>${esc(A[i]!)}</del>`
      i++
    } else {
      after += /^\s+$/.test(B[j]!) ? esc(B[j]!) : `<ins>${esc(B[j]!)}</ins>`
      j++
    }
  }
  for (; i < A.length; i++) before += /^\s+$/.test(A[i]!) ? esc(A[i]!) : `<del>${esc(A[i]!)}</del>`
  for (; j < B.length; j++) after += /^\s+$/.test(B[j]!) ? esc(B[j]!) : `<ins>${esc(B[j]!)}</ins>`
  return { before, after }
}

// ─── Audit ──────────────────────────────────────────────────────────────────

function buildGroups() {
  const result = reviewCopy(state.layers, state.settings)
  state.result = result
  const byKey = new Map<string, Group>()
  for (const r of result.reviews) {
    if (r.findings.length === 0) continue
    const key = `${r.componentType}|${r.node.text.trim()}`
    const layer = state.layers.find((l) => l.id === r.node.id)!
    const g = byKey.get(key)
    if (g) {
      g.reviews.push(r)
      g.layers.push(layer)
    } else {
      const findings = [...r.findings].sort((a, b) => rank(a.severity) - rank(b.severity))
      byKey.set(key, {
        key,
        reviews: [r],
        layers: [layer],
        findings,
        severity: findings[0]!.severity,
        confidence: Math.max(...findings.map((f) => f.confidence)),
      })
    }
  }
  state.groups = [...byKey.values()].sort(
    (a, b) => rank(a.severity) - rank(b.severity) || b.layers.length - a.layers.length,
  )
}

const suggestionOf = (g: Group) => g.reviews[0]!.suggestion
const validationOf = (g: Group) => g.reviews[0]!.validation

function isSafe(g: Group) {
  const v = validationOf(g)
  return Boolean(
    suggestionOf(g) &&
      v?.passed &&
      g.findings.every((f) => f.autoApplicable) &&
      g.layers.every((l) => !l.mixedStyle && !l.inMainComponent) &&
      g.confidence >= CONFIDENCE_THRESHOLD,
  )
}

const visibleGroups = () => state.groups.filter((g) => !state.dismissed.has(g.key))

function applyGroup(g: Group, text: string) {
  state.applied.set(g.key, text)
  send({ type: "APPLY", changes: g.layers.map((l) => ({ nodeId: l.id, text })) })
}

// ─── Render ─────────────────────────────────────────────────────────────────

const app = document.getElementById("app")!

function render() {
  const scrollEl = app.querySelector(".scroll")
  const scrollTop = scrollEl?.scrollTop ?? 0
  app.innerHTML = `
    <header class="top">
      <div class="brand"><span class="brand-mark"></span>CopyPilot</div>
      <nav class="tabs" role="tablist">
        <button class="tab" role="tab" data-action="tab" data-tab="audit" aria-selected="${state.tab === "audit"}">Audit</button>
        <button class="tab" role="tab" data-action="tab" data-tab="rules" aria-selected="${state.tab === "rules"}">Rules</button>
      </nav>
    </header>
    ${state.error ? `<div class="error-banner">${esc(state.error)}</div>` : ""}
    ${state.tab === "rules" ? renderRules() : state.status === "done" ? renderResults() : renderStart()}
  `
  const next = app.querySelector(".scroll")
  if (next) next.scrollTop = scrollTop
  const ta = app.querySelector<HTMLTextAreaElement>("textarea[data-draft]")
  if (ta && document.activeElement !== ta) {
    ta.focus()
    ta.setSelectionRange(ta.value.length, ta.value.length)
  }
}

function renderStart() {
  const s = state.summary
  const running = state.status === "running"
  const pct = state.progress.total ? Math.round((state.progress.done / state.progress.total) * 100) : 0
  const canRun = state.scope === "page" || s.textLayers > 0
  return `
    <div class="scroll"><div class="pad">
      <p class="section-label">Scope</p>
      <div class="segmented">
        <button data-action="scope" data-scope="selection" aria-pressed="${state.scope === "selection"}">Selection</button>
        <button data-action="scope" data-scope="page" aria-pressed="${state.scope === "page"}">Current page</button>
      </div>
      <div class="selection-card">
        ${
          state.scope === "page"
            ? `<strong>Every text layer on this page</strong><span class="muted small">Hidden layers are skipped</span>`
            : s.textLayers
              ? `<strong>${esc(s.label)}</strong><span class="muted small">${plural(s.textLayers, "text layer")}</span>`
              : `<strong>Nothing to audit yet</strong><span class="muted small">Select a text layer or frame to start an audit.</span>`
        }
      </div>
      <button class="btn btn-primary btn-block" data-action="run" ${!canRun || running ? "disabled" : ""}>
        ${running ? "Reading layers…" : "Run audit"}
      </button>
      ${running ? `<div class="progress"><div style="width:${pct}%"></div></div><p class="muted small">${state.progress.done} of ${state.progress.total} layers</p>` : ""}
      <div class="guide-note">
        <span>ⓘ</span>
        <span>Copy is checked against the ${GUIDE_NAME}. Everything runs inside Figma, and no text leaves your file.</span>
      </div>
    </div></div>`
}

function renderResults() {
  const groups = visibleGroups()
  const layerCount = state.layers.length
  if (groups.length === 0) return renderAllClear(layerCount)

  const count = (s: Severity) => groups.filter((g) => g.severity === s).length
  const shown = groups.filter((g) => state.filter === "all" || g.severity === state.filter)
  const confident = shown.filter((g) => g.confidence >= CONFIDENCE_THRESHOLD)
  const possible = shown.filter((g) => g.confidence < CONFIDENCE_THRESHOLD)
  const safe = groups.filter((g) => isSafe(g) && !state.applied.has(g.key))
  const appliedCount = groups.filter((g) => state.applied.has(g.key)).length

  return `
    <div class="summary">
      <div class="summary-head">
        <h2>${plural(groups.length, "issue")}</h2>
        <span class="muted small">in ${plural(layerCount, "layer")}${state.skippedHidden ? ` · ${state.skippedHidden} hidden skipped` : ""}</span>
        <button class="btn" data-action="rerun" title="Run the audit again">↻ Re-run</button>
      </div>
      <div class="chips">
        <button class="chip" data-action="filter" data-sev="all" aria-pressed="${state.filter === "all"}">All ${groups.length}</button>
        ${SEV.filter((s) => count(s))
          .map((s) => `<button class="chip" data-action="filter" data-sev="${s}" aria-pressed="${state.filter === s}"><span class="dot ${s}"></span>${s[0]!.toUpperCase() + s.slice(1)} ${count(s)}</button>`)
          .join("")}
        <button class="chip" data-action="back">Change scope</button>
      </div>
    </div>
    <div class="scroll">
      ${confident.map(renderRow).join("")}
      ${
        possible.length
          ? `<details class="possible" ${confident.length === 0 ? "open" : ""}><summary>Possible improvements (${possible.length}), where the screen gives too little context for a confident fix</summary>${possible.map(renderRow).join("")}</details>`
          : ""
      }
    </div>
    <div class="footer">
      <button class="btn btn-primary" data-action="apply-safe" ${safe.length ? "" : "disabled"}>Apply ${plural(safe.length, "safe fix")}</button>
      <span class="muted">${appliedCount} of ${groups.length} resolved</span>
    </div>`
}

function renderRow(g: Group) {
  const r = g.reviews[0]!
  const open = state.open === g.key
  const applied = state.applied.get(g.key)
  const top = g.findings[0]!
  const more = g.findings.length - 1
  return `
    <div class="row ${open ? "open" : ""} ${applied ? "applied" : ""}">
      <button class="row-head" data-action="toggle" data-key="${esc(g.key)}">
        <span class="dot ${g.severity}"></span>
        <span class="row-main">
          <span class="row-kind">${KIND[r.componentType] ?? "Text"}${g.layers[0]!.frame ? ` · ${esc(g.layers[0]!.frame!)}` : ""}</span>
          <span class="row-text">${esc(applied ?? r.node.text)}</span>
          ${
            applied
              ? `<span class="applied-tag">✓ Applied · ⌘Z in Figma to undo</span>`
              : `<span class="row-title">${esc(top.title)}${more ? ` · +${more} more` : ""}</span>`
          }
        </span>
        ${g.layers.length > 1 ? `<span class="badge">${g.layers.length} layers</span>` : ""}
        <span class="chev">›</span>
      </button>
      ${open ? renderCard(g) : ""}
    </div>`
}

function renderCard(g: Group) {
  const r = g.reviews[0]!
  const original = r.node.text
  const suggestion = suggestionOf(g)
  const validation = validationOf(g)
  const editing = state.editing === g.key
  const applied = state.applied.has(g.key)
  const alts = [...new Set(g.findings.flatMap((f) => f.alternatives ?? []))]

  const issues = g.findings
    .map(
      (f) => `
      <div class="issue">
        <div class="issue-title"><span class="sev ${f.severity}">${f.severity}</span>${esc(f.title)}</div>
        <p>${esc(f.explanation)}</p>
        <div class="guide-ref">Guide · ${esc(f.guideRef.section)} · ${Math.round(f.confidence * 100)}%</div>
      </div>`,
    )
    .join("")

  let body: string
  if (editing) {
    const check = reviewNode({ ...r.node, text: state.draft, componentType: r.componentType }, state.settings)
    const d = diff(original, state.draft)
    body = `
      <textarea data-draft>${esc(state.draft)}</textarea>
      <div class="diff"><div class="after"><span class="lbl">Change</span>${d.after || "&nbsp;"}</div></div>
      <p class="note ${check.findings.length ? "" : "ok"}">${
        check.findings.length
          ? `Still flagged: ${esc(check.findings.map((f) => f.title.toLowerCase()).join(", "))}`
          : "✓ Meets the guide"
      }</p>
      <div class="actions">
        <button class="btn btn-primary" data-action="apply-draft" data-key="${esc(g.key)}" ${state.draft.trim() ? "" : "disabled"}>Apply${g.layers.length > 1 ? ` to ${g.layers.length} layers` : ""}</button>
        <button class="btn btn-ghost" data-action="cancel-edit">Cancel</button>
      </div>`
  } else {
    const d = suggestion ? diff(original, suggestion) : undefined
    const notes: string[] = []
    if (validation && !validation.passed)
      notes.push(`<p class="note bad">Not applied automatically: ${esc(validation.reasons.join("; "))}. Edit it first.</p>`)
    if (g.layers.some((l) => l.mixedStyle))
      notes.push(`<p class="note">This layer mixes text styles. Applying uses the first character's style for all of it.</p>`)
    if (g.layers.some((l) => l.inMainComponent))
      notes.push(`<p class="note">This text is in a main component, so the change reaches every instance.</p>`)
    body = `
      ${
        d
          ? `<div class="diff">
               <div class="before"><span class="lbl">Current</span>${d.before}</div>
               <div class="after"><span class="lbl">Suggested</span>${d.after}</div>
             </div>`
          : `<p class="muted small">No automatic rewrite: fixing this needs details about the screen only you know. Use Edit to write your own.</p>`
      }
      ${alts.length ? `<p class="section-label">Examples from the guide</p><div class="alts">${alts.map((a) => `<button data-action="use-alt" data-key="${esc(g.key)}" data-text="${esc(a)}">${esc(a.replace(/\n/g, " / "))}</button>`).join("")}</div>` : ""}
      ${notes.join("")}
      <div class="actions">
        <button class="btn btn-primary" data-action="apply" data-key="${esc(g.key)}" ${suggestion && validation?.passed && !applied ? "" : "disabled"}>${applied ? "Applied" : `Apply${g.layers.length > 1 ? ` to ${g.layers.length} layers` : ""}`}</button>
        <button class="btn" data-action="edit" data-key="${esc(g.key)}">Edit</button>
        <button class="btn" data-action="select" data-key="${esc(g.key)}">Select in canvas</button>
        <button class="btn btn-ghost" data-action="dismiss" data-key="${esc(g.key)}">Dismiss</button>
      </div>`
  }
  return `<div class="card">${issues}${body}</div>`
}

function renderAllClear(layerCount: number) {
  const failed = new Set<ChecklistKey>()
  const keys = Object.keys(CHECKLIST) as ChecklistKey[]
  return `
    <div class="scroll"><div class="clear">
      <div style="font-size:24px">✓</div>
      <h2>No issues found in ${plural(layerCount, "layer")}</h2>
      <p class="muted">${state.dismissed.size ? `${plural(state.dismissed.size, "issue")} dismissed. ` : ""}This copy meets the ${GUIDE_NAME}.</p>
      <ul class="checks">${keys.map((k) => `<li><span class="${failed.has(k) ? "no" : "ok"}">✓</span>${CHECKLIST[k]}</li>`).join("")}</ul>
      <div class="actions" style="justify-content:center;margin-top:16px">
        <button class="btn" data-action="back">Audit something else</button>
        ${state.auditScope === "selection" ? `<button class="btn btn-primary" data-action="run-page">Run on page</button>` : ""}
      </div>
    </div></div>`
}

function renderRules() {
  const terms = (state.settings.terms ?? []).map((t) => `${t.insteadOf.join(", ")} -> ${t.use}`).join("\n")
  const avoid = (state.settings.avoid ?? []).join(", ")
  return `
    <div class="scroll"><div class="pad">
      <div class="field">
        <label for="terms">Terms</label>
        <div class="hint">One per line: <code>Instead of -> Use</code>. Separate several variants with commas, e.g. <code>Log in, Login -> Sign in</code>.</div>
        <textarea id="terms" rows="6" placeholder="Log in, Login -> Sign in&#10;E-mail -> Email">${esc(terms)}</textarea>
      </div>
      <div class="field">
        <label for="avoid">Words to avoid</label>
        <div class="hint">Comma-separated.</div>
        <input type="text" id="avoid" placeholder="oops, whoops, kindly" value="${esc(avoid)}" />
      </div>
      <button class="btn btn-primary" data-action="save-rules">Save rules</button>
      <span class="muted small" id="saved"></span>
      <div class="guide-note" style="flex-direction:column">
        <strong style="color:var(--text)">${GUIDE_NAME}</strong>
        <span>Every audit checks copy against this checklist:</span>
        <ul class="checks" style="margin:4px 0 0">${(Object.keys(CHECKLIST) as ChecklistKey[]).map((k) => `<li><span class="ok">✓</span>${CHECKLIST[k]}</li>`).join("")}</ul>
      </div>
    </div></div>`
}

function parseTerms(src: string): TermRule[] {
  return src
    .split("\n")
    .map((line) => line.split(/->|→/))
    .filter((parts) => parts.length === 2 && parts[0]!.trim() && parts[1]!.trim())
    .map(([from, to]) => ({
      insteadOf: from!.split(",").map((s) => s.trim()).filter(Boolean),
      use: to!.trim(),
    }))
}

// ─── Events ─────────────────────────────────────────────────────────────────

const groupByKey = (key?: string) => state.groups.find((g) => g.key === key)

function run(scope: Scope) {
  state.status = "running"
  state.auditScope = scope
  state.progress = { done: 0, total: 0 }
  state.open = undefined
  state.editing = undefined
  state.dismissed.clear()
  state.applied.clear()
  state.error = undefined
  send({ type: "AUDIT", scope })
  render()
}

app.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]")
  if (!el) return
  const g = groupByKey(el.dataset.key)
  switch (el.dataset.action) {
    case "tab":
      state.tab = el.dataset.tab as "audit" | "rules"
      break
    case "scope":
      state.scope = el.dataset.scope as Scope
      state.scopeTouched = true
      break
    case "run":
      return run(state.scope)
    case "rerun":
      return run(state.auditScope)
    case "run-page":
      state.scope = "page"
      return run("page")
    case "back":
      state.status = "idle"
      break
    case "filter":
      state.filter = el.dataset.sev as Severity | "all"
      break
    case "toggle":
      state.open = state.open === el.dataset.key ? undefined : el.dataset.key
      state.editing = undefined
      if (state.open && g) send({ type: "FOCUS", nodeIds: g.layers.map((l) => l.id) })
      break
    case "select":
      if (g) send({ type: "FOCUS", nodeIds: g.layers.map((l) => l.id) })
      return
    case "apply": {
      const text = g && suggestionOf(g)
      if (g && text) applyGroup(g, text)
      break
    }
    case "apply-safe":
      for (const sg of visibleGroups().filter((x) => isSafe(x) && !state.applied.has(x.key))) state.applied.set(sg.key, suggestionOf(sg)!)
      send({
        type: "APPLY",
        changes: visibleGroups()
          .filter((x) => state.applied.has(x.key) && isSafe(x))
          .flatMap((x) => x.layers.map((l) => ({ nodeId: l.id, text: state.applied.get(x.key)! }))),
      })
      break
    case "edit":
      if (!g) return
      state.editing = g.key
      state.draft = suggestionOf(g) ?? g.reviews[0]!.node.text
      break
    case "use-alt":
      if (!g) return
      state.editing = g.key
      state.draft = el.dataset.text ?? ""
      break
    case "cancel-edit":
      state.editing = undefined
      break
    case "apply-draft":
      if (g && state.draft.trim()) {
        applyGroup(g, state.draft)
        state.editing = undefined
      }
      break
    case "dismiss":
      if (el.dataset.key) state.dismissed.add(el.dataset.key)
      state.open = undefined
      break
    case "save-rules": {
      const terms = parseTerms((document.getElementById("terms") as HTMLTextAreaElement).value)
      const avoid = (document.getElementById("avoid") as HTMLInputElement).value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      state.settings = { terms, avoid }
      send({ type: "SAVE_SETTINGS", settings: state.settings })
      if (state.layers.length) buildGroups()
      render()
      document.getElementById("saved")!.textContent = `  Saved ${plural(terms.length, "term")}, ${plural(avoid.length, "word")} to avoid.`
      return
    }
  }
  render()
})

app.addEventListener("input", (e) => {
  const t = e.target as HTMLElement
  if (t.matches("textarea[data-draft]")) {
    state.draft = (t as HTMLTextAreaElement).value
    // Re-render only the live check below the textarea, keeping focus in it.
    const card = t.closest(".card")
    const g = groupByKey(state.editing)
    if (!card || !g) return
    const r = g.reviews[0]!
    const check = reviewNode({ ...r.node, text: state.draft, componentType: r.componentType }, state.settings)
    const d = diff(r.node.text, state.draft)
    card.querySelector(".diff .after")!.innerHTML = `<span class="lbl">Change</span>${d.after || "&nbsp;"}`
    card.querySelector(".note")!.textContent = check.findings.length
      ? `Still flagged: ${check.findings.map((f) => f.title.toLowerCase()).join(", ")}`
      : "✓ Meets the guide"
    card.querySelector<HTMLButtonElement>("[data-action=apply-draft]")!.disabled = !state.draft.trim()
  }
})

window.onmessage = (e: MessageEvent) => {
  const msg = e.data?.pluginMessage as ToUi | undefined
  if (!msg) return
  switch (msg.type) {
    case "SELECTION":
      state.summary = msg.summary
      if (!state.scopeTouched) state.scope = msg.summary.textLayers ? "selection" : "page"
      if (state.status === "idle") render()
      return
    case "SETTINGS":
      state.settings = msg.settings
      return
    case "AUDIT_PROGRESS":
      state.progress = { done: msg.done, total: msg.total }
      break
    case "AUDIT_RESULT":
      state.layers = msg.layers
      state.skippedHidden = msg.skippedHidden
      state.auditScope = msg.scope
      state.filter = "all"
      buildGroups()
      state.status = "done"
      break
    case "APPLY_RESULT":
      for (const f of msg.failed) {
        const g = state.groups.find((x) => x.layers.some((l) => l.id === f.nodeId))
        if (g) state.applied.delete(g.key)
      }
      state.error = msg.failed.length
        ? `Couldn't apply to ${plural(msg.failed.length, "layer")}: ${[...new Set(msg.failed.map((f) => f.reason))].join("; ")}.`
        : undefined
      break
    case "ERROR":
      state.error = msg.message
      if (state.status === "running") state.status = "idle"
      break
  }
  render()
}

render()
