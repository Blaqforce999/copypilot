"use strict";
(() => {
  // src/code.ts
  var SETTINGS_KEY = "copypilot.settings";
  var CHUNK = 50;
  figma.showUI(__html__, { width: 380, height: 640, themeColors: true });
  var post = (msg) => figma.ui.postMessage(msg);
  function textNodesIn(nodes) {
    const out = [];
    for (const n of nodes) {
      if (n.type === "TEXT") out.push(n);
      else if ("findAllWithCriteria" in n) out.push(...n.findAllWithCriteria({ types: ["TEXT"] }));
    }
    return out;
  }
  function summarize() {
    const sel = figma.currentPage.selection;
    if (sel.length === 0) {
      return { textLayers: 0, label: "Nothing selected" };
    }
    const count = textNodesIn(sel).length;
    const label = sel.length === 1 ? sel[0].name : `${sel.length} layers`;
    return { textLayers: count, label };
  }
  figma.on("selectionchange", () => post({ type: "SELECTION", summary: summarize() }));
  var isHidden = (node) => {
    for (let n = node; n && n.type !== "PAGE"; n = n.parent) {
      if ("visible" in n && !n.visible) return true;
    }
    return false;
  };
  function nearestFrame(node) {
    let last;
    for (let n = node.parent; n && n.type !== "PAGE"; n = n.parent) {
      if (n.type === "FRAME" || n.type === "COMPONENT" || n.type === "INSTANCE" || n.type === "SECTION") last = n;
    }
    return last;
  }
  function ancestor(node, type) {
    for (let n = node.parent; n && n.type !== "PAGE"; n = n.parent) if (n.type === type) return n;
    return void 0;
  }
  function surrounding(node) {
    const seen = /* @__PURE__ */ new Set([node.characters]);
    const out = [];
    const add = (s) => {
      const t = s.trim();
      if (t && !seen.has(t) && out.length < 12) {
        seen.add(t);
        out.push(t);
      }
    };
    let scope = node.parent;
    for (let level = 0; level < 3 && scope && scope.type !== "PAGE"; level++) {
      if ("findAllWithCriteria" in scope) {
        for (const t of scope.findAllWithCriteria({ types: ["TEXT"] })) if (!isHidden(t)) add(t.characters);
      }
      scope = scope.parent;
    }
    const frame = nearestFrame(node);
    if (frame) add(frame.name);
    return out;
  }
  function toLayer(node) {
    const frame = nearestFrame(node);
    const parentName = node.parent && node.parent.type !== "PAGE" ? node.parent.name : "";
    return {
      id: node.id,
      text: node.characters,
      // The layer name plus its parent's name ("Button/Primary", "Error banner") guides classification.
      name: [node.name !== node.characters ? node.name : "", parentName].filter(Boolean).join(" / "),
      surroundingText: surrounding(node),
      frame: frame == null ? void 0 : frame.name,
      mixedStyle: node.fontName === figma.mixed || node.fills === figma.mixed || node.fontSize === figma.mixed,
      inMainComponent: Boolean(ancestor(node, "COMPONENT"))
    };
  }
  var tick = () => new Promise((r) => setTimeout(r, 0));
  async function audit(scope) {
    const roots = scope === "selection" ? figma.currentPage.selection : figma.currentPage.children;
    if (scope === "selection" && roots.length === 0) {
      post({ type: "ERROR", message: "Select a text layer or frame to start an audit." });
      return;
    }
    const all = textNodesIn(roots);
    const visible = all.filter((n) => !isHidden(n) && n.characters.trim());
    const layers = [];
    for (let i = 0; i < visible.length; i += CHUNK) {
      for (const n of visible.slice(i, i + CHUNK)) layers.push(toLayer(n));
      post({ type: "AUDIT_PROGRESS", done: Math.min(i + CHUNK, visible.length), total: visible.length });
      await tick();
    }
    post({ type: "AUDIT_RESULT", layers, skippedHidden: all.length - visible.length, scope });
  }
  async function applyText(nodeId, text) {
    var _a;
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || node.type !== "TEXT") throw new Error("Layer no longer exists");
    if (node.hasMissingFont) throw new Error("A font in this layer isn't available");
    await Promise.all(node.getRangeAllFontNames(0, node.characters.length).map((f) => figma.loadFontAsync(f)));
    const propKey = (_a = node.componentPropertyReferences) == null ? void 0 : _a.characters;
    const instance = propKey ? ancestor(node, "INSTANCE") : void 0;
    if (propKey && instance) {
      instance.setProperties({ [propKey]: text });
    } else {
      node.characters = text;
    }
  }
  async function apply(changes) {
    const applied = [];
    const failed = [];
    for (const c of changes) {
      try {
        await applyText(c.nodeId, c.text);
        applied.push(c.nodeId);
      } catch (e) {
        failed.push({ nodeId: c.nodeId, reason: e instanceof Error ? e.message : String(e) });
      }
    }
    figma.commitUndo();
    post({ type: "APPLY_RESULT", applied, failed });
    if (applied.length) figma.notify(`Applied to ${applied.length} layer${applied.length > 1 ? "s" : ""}. \u2318Z to undo.`);
  }
  async function focus(ids) {
    const nodes = (await Promise.all(ids.map((id) => figma.getNodeByIdAsync(id)))).filter(
      (n) => Boolean(n) && n.type !== "PAGE" && n.type !== "DOCUMENT"
    );
    if (nodes.length === 0) return;
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }
  figma.ui.onmessage = async (msg) => {
    try {
      switch (msg.type) {
        case "AUDIT":
          await audit(msg.scope);
          break;
        case "FOCUS":
          await focus(msg.nodeIds);
          break;
        case "APPLY":
          await apply(msg.changes);
          break;
        case "SAVE_SETTINGS":
          await figma.clientStorage.setAsync(SETTINGS_KEY, msg.settings);
          break;
        case "RESIZE":
          figma.ui.resize(msg.width, msg.height);
          break;
      }
    } catch (e) {
      post({ type: "ERROR", message: e instanceof Error ? e.message : String(e) });
    }
  };
  (async () => {
    var _a;
    const settings = (_a = await figma.clientStorage.getAsync(SETTINGS_KEY)) != null ? _a : {};
    post({ type: "SETTINGS", settings });
    post({ type: "SELECTION", summary: summarize() });
  })();
})();
