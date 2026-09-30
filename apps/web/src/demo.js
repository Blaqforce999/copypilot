// Stands in for Figma: answers the plugin UI's messages the way apps/plugin/src/code.ts does,
// using the sample screen on the left as the "document".
;(() => {
  const iframe = document.getElementById("plugin")
  const screen = document.getElementById("screen")
  const stage = document.getElementById("stage")
  const original = new Map()
  let selection = [screen]
  let undo = []

  for (const el of screen.querySelectorAll(".layer")) original.set(el.dataset.id, el.textContent)

  const repo = document.querySelector('meta[name="repo"]')?.content
  if (repo) document.getElementById("repo-link").href = repo

  const post = (msg) => iframe.contentWindow.postMessage({ pluginMessage: msg }, "*")
  const layersIn = (nodes) =>
    nodes.flatMap((n) => (n.classList.contains("layer") ? [n] : [...n.querySelectorAll(".layer")]))

  function summary() {
    if (selection.length === 0) return { textLayers: 0, label: "Nothing selected" }
    const count = layersIn(selection).length
    const label = selection.length === 1 ? (selection[0] === screen ? "Profile settings" : selection[0].dataset.name) : `${selection.length} layers`
    return { textLayers: count, label }
  }

  function setSelection(nodes) {
    selection = nodes
    for (const el of document.querySelectorAll(".selected")) el.classList.remove("selected")
    for (const n of nodes) n.classList.add("selected")
    post({ type: "SELECTION", summary: summary() })
  }

  /** Nearby copy, nearest first: the same group, then the rest of the screen. */
  function surrounding(el) {
    const group = el.closest("[data-group]")
    const near = group ? [...group.parentElement.querySelectorAll(`[data-group="${group.dataset.group}"] .layer`)] : []
    const rest = [...screen.querySelectorAll(".layer")]
    const seen = new Set([el.textContent])
    const out = []
    for (const other of [...near, ...rest]) {
      const t = other.textContent.trim()
      if (other !== el && t && !seen.has(t)) {
        seen.add(t)
        out.push(t)
      }
    }
    return [...out.slice(0, 11), screen.dataset.frame]
  }

  function audit(scope) {
    const els = scope === "page" ? [...screen.querySelectorAll(".layer")] : layersIn(selection)
    if (els.length === 0) return post({ type: "ERROR", message: "Select a text layer or frame to start an audit." })
    post({ type: "AUDIT_PROGRESS", done: els.length, total: els.length })
    setTimeout(() => {
      post({
        type: "AUDIT_RESULT",
        scope,
        skippedHidden: 0,
        layers: els.map((el) => ({
          id: el.dataset.id,
          text: el.textContent,
          name: el.dataset.name,
          surroundingText: surrounding(el),
          frame: screen.dataset.frame,
          mixedStyle: false,
          inMainComponent: false,
        })),
      })
    }, 250)
  }

  const byId = (id) => screen.querySelector(`[data-id="${CSS.escape(id)}"]`)

  window.addEventListener("message", (e) => {
    if (e.source && e.source !== iframe.contentWindow) return
    const msg = e.data?.pluginMessage
    if (!msg) return
    switch (msg.type) {
      case "AUDIT":
        return audit(msg.scope)
      case "FOCUS": {
        const nodes = msg.nodeIds.map(byId).filter(Boolean)
        if (nodes.length) {
          setSelection(nodes)
          nodes[0].scrollIntoView({ block: "center", behavior: "smooth" })
        }
        return
      }
      case "APPLY": {
        const applied = []
        const batch = []
        for (const c of msg.changes) {
          const el = byId(c.nodeId)
          if (!el) continue
          batch.push([el, el.textContent])
          el.textContent = c.text
          el.classList.remove("flash")
          void el.offsetWidth
          el.classList.add("flash")
          applied.push(c.nodeId)
        }
        undo.push(batch)
        return post({ type: "APPLY_RESULT", applied, failed: [] })
      }
      case "SAVE_SETTINGS":
        try { localStorage.setItem("copypilot.settings", JSON.stringify(msg.settings)) } catch {}
        return
    }
  })

  function init() {
    let settings = {}
    try { settings = JSON.parse(localStorage.getItem("copypilot.settings") || "{}") } catch {}
    post({ type: "SETTINGS", settings })
    setSelection([screen])
  }
  // The panel may finish loading before or after this script runs.
  iframe.addEventListener("load", init)
  const doc = iframe.contentDocument
  if (doc && doc.readyState === "complete" && doc.URL !== "about:blank") init()

  // Canvas selection: click a layer, or empty canvas for the whole screen.
  stage.addEventListener("click", (e) => {
    const layer = e.target.closest(".layer")
    setSelection([layer ?? screen])
  })

  // ⌘Z / Ctrl+Z undoes the last apply, as in Figma.
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "z" && undo.length) {
      for (const [el, text] of undo.pop()) el.textContent = text
      e.preventDefault()
    }
  })

  document.getElementById("reset").addEventListener("click", () => {
    for (const [id, text] of original) byId(id).textContent = text
    undo = []
    iframe.contentWindow.location.reload()
  })
})()
