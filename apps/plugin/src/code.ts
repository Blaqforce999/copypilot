/// <reference types="@figma/plugin-typings" />
import type { ReviewSettings } from "@copypilot/copy-engine"
import type { LayerInfo, Scope, SelectionSummary, ToPlugin, ToUi } from "./messages"

const SETTINGS_KEY = "copypilot.settings"
const CHUNK = 50

figma.showUI(__html__, { width: 380, height: 640, themeColors: true })

const post = (msg: ToUi) => figma.ui.postMessage(msg)

// ─── Selection ──────────────────────────────────────────────────────────────

function textNodesIn(nodes: readonly SceneNode[]): TextNode[] {
  const out: TextNode[] = []
  for (const n of nodes) {
    if (n.type === "TEXT") out.push(n)
    else if ("findAllWithCriteria" in n) out.push(...n.findAllWithCriteria({ types: ["TEXT"] }))
  }
  return out
}

function summarize(): SelectionSummary {
  const sel = figma.currentPage.selection
  if (sel.length === 0) {
    return { textLayers: 0, label: "Nothing selected" }
  }
  const count = textNodesIn(sel).length
  const label = sel.length === 1 ? sel[0]!.name : `${sel.length} layers`
  return { textLayers: count, label }
}

figma.on("selectionchange", () => post({ type: "SELECTION", summary: summarize() }))

// ─── Extraction ─────────────────────────────────────────────────────────────

const isHidden = (node: BaseNode) => {
  for (let n: BaseNode | null = node; n && n.type !== "PAGE"; n = n.parent) {
    if ("visible" in n && !n.visible) return true
  }
  return false
}

function nearestFrame(node: BaseNode): BaseNode | undefined {
  let last: BaseNode | undefined
  for (let n = node.parent; n && n.type !== "PAGE"; n = n.parent) {
    if (n.type === "FRAME" || n.type === "COMPONENT" || n.type === "INSTANCE" || n.type === "SECTION") last = n
  }
  return last
}

function ancestor(node: BaseNode, type: NodeType) {
  for (let n = node.parent; n && n.type !== "PAGE"; n = n.parent) if (n.type === type) return n
  return undefined
}

/** Nearby copy, nearest first: siblings, then the rest of the parent's parent, then the frame name. */
function surrounding(node: TextNode): string[] {
  const seen = new Set<string>([node.characters])
  const out: string[] = []
  const add = (s: string) => {
    const t = s.trim()
    if (t && !seen.has(t) && out.length < 12) {
      seen.add(t)
      out.push(t)
    }
  }
  let scope: BaseNode | null = node.parent
  for (let level = 0; level < 3 && scope && scope.type !== "PAGE"; level++) {
    if ("findAllWithCriteria" in scope) {
      for (const t of (scope as FrameNode).findAllWithCriteria({ types: ["TEXT"] })) if (!isHidden(t)) add(t.characters)
    }
    scope = scope.parent
  }
  const frame = nearestFrame(node)
  if (frame) add(frame.name)
  return out
}

function toLayer(node: TextNode): LayerInfo {
  const frame = nearestFrame(node)
  const parentName = node.parent && node.parent.type !== "PAGE" ? node.parent.name : ""
  return {
    id: node.id,
    text: node.characters,
    // The layer name plus its parent's name ("Button/Primary", "Error banner") guides classification.
    name: [node.name !== node.characters ? node.name : "", parentName].filter(Boolean).join(" / "),
    surroundingText: surrounding(node),
    frame: frame?.name,
    mixedStyle: node.fontName === figma.mixed || node.fills === figma.mixed || node.fontSize === figma.mixed,
    inMainComponent: Boolean(ancestor(node, "COMPONENT")),
  }
}

const tick = () => new Promise((r) => setTimeout(r, 0))

async function audit(scope: Scope) {
  const roots = scope === "selection" ? figma.currentPage.selection : figma.currentPage.children
  if (scope === "selection" && roots.length === 0) {
    post({ type: "ERROR", message: "Select a text layer or frame to start an audit." })
    return
  }
  const all = textNodesIn(roots)
  const visible = all.filter((n) => !isHidden(n) && n.characters.trim())
  const layers: LayerInfo[] = []
  for (let i = 0; i < visible.length; i += CHUNK) {
    for (const n of visible.slice(i, i + CHUNK)) layers.push(toLayer(n))
    post({ type: "AUDIT_PROGRESS", done: Math.min(i + CHUNK, visible.length), total: visible.length })
    await tick() // keep Figma responsive on big pages
  }
  post({ type: "AUDIT_RESULT", layers, skippedHidden: all.length - visible.length, scope })
}

// ─── Writing ────────────────────────────────────────────────────────────────

async function applyText(nodeId: string, text: string) {
  const node = await figma.getNodeByIdAsync(nodeId)
  if (!node || node.type !== "TEXT") throw new Error("Layer no longer exists")
  if (node.hasMissingFont) throw new Error("A font in this layer isn't available")
  await Promise.all(node.getRangeAllFontNames(0, node.characters.length).map((f) => figma.loadFontAsync(f)))

  // Text driven by a component property must be changed on the instance, or the edit won't stick.
  const propKey = node.componentPropertyReferences?.characters
  const instance = propKey ? (ancestor(node, "INSTANCE") as InstanceNode | undefined) : undefined
  if (propKey && instance) {
    instance.setProperties({ [propKey]: text })
  } else {
    node.characters = text
  }
}

async function apply(changes: Array<{ nodeId: string; text: string }>) {
  const applied: string[] = []
  const failed: Array<{ nodeId: string; reason: string }> = []
  for (const c of changes) {
    try {
      await applyText(c.nodeId, c.text)
      applied.push(c.nodeId)
    } catch (e) {
      failed.push({ nodeId: c.nodeId, reason: e instanceof Error ? e.message : String(e) })
    }
  }
  figma.commitUndo() // one ⌘Z reverts this apply
  post({ type: "APPLY_RESULT", applied, failed })
  if (applied.length) figma.notify(`Applied to ${applied.length} layer${applied.length > 1 ? "s" : ""}. ⌘Z to undo.`)
}

async function focus(ids: string[]) {
  const nodes = (await Promise.all(ids.map((id) => figma.getNodeByIdAsync(id)))).filter(
    (n): n is SceneNode => Boolean(n) && n!.type !== "PAGE" && n!.type !== "DOCUMENT",
  )
  if (nodes.length === 0) return
  figma.currentPage.selection = nodes
  figma.viewport.scrollAndZoomIntoView(nodes)
}

// ─── Messages ───────────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg: ToPlugin) => {
  try {
    switch (msg.type) {
      case "AUDIT":
        await audit(msg.scope)
        break
      case "FOCUS":
        await focus(msg.nodeIds)
        break
      case "APPLY":
        await apply(msg.changes)
        break
      case "SAVE_SETTINGS":
        await figma.clientStorage.setAsync(SETTINGS_KEY, msg.settings)
        break
      case "RESIZE":
        figma.ui.resize(msg.width, msg.height)
        break
    }
  } catch (e) {
    post({ type: "ERROR", message: e instanceof Error ? e.message : String(e) })
  }
}

;(async () => {
  const settings = ((await figma.clientStorage.getAsync(SETTINGS_KEY)) as ReviewSettings | undefined) ?? {}
  post({ type: "SETTINGS", settings })
  post({ type: "SELECTION", summary: summarize() })
})()
