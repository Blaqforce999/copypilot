# CopyPilot — UI Research & Build Plan

Sources: [prd.md](prd.md), [architecture.md](architecture.md), and Mobbin research (web, September 2026).

> **Reviewer decision (2026-09-30):** CopyPilot uses no real AI. Findings and rewrites come from a local reviewer built from the ux-writing skill (Google Material communication guidance). It is already built in [packages/copy-engine](packages/copy-engine), and the skill's own examples are its benchmark. There is no server, no API key and no network access. Where Part 1 mentions AI, read it as "the reviewer".

---

## Part 1 — Mobbin research

### Searches run (platform: web)

| Tool | Query | Why (PRD section) |
|---|---|---|
| screens | Writing-assistant side panel with issue cards: category, struck-through original, suggestion, accept/dismiss | §17 Context panel, §18 Apply, §20 Diff |
| screens | Audit results panel with total count, severity breakdown, filterable issue list | §7.3 Page audit grouping, §32 Layout |
| screens | Style guide terminology table: preferred vs avoid, add term | §14 Consistency, §16 Rules |
| screens | Brand voice settings with tone chips and a preview | §15 Brand voice |
| flows | Start scan → progress → results → open issue → apply fix → resolved | §30 Primary user flow |
| screens | Narrow panel with scan progress, partial results, cancel | Arch §15 Performance |

### Pattern clusters

**1. Issue review card (the core of the product)**
- [Grammarly](https://mobbin.com/screens/b727d76e-6475-4a20-a8bd-d0ad05569b30): each card shows a category label and a one-line action ("Clarity · Remove the phrase"), then the change in context with the removed word struck through. The buttons are **Accept** (primary), **Dismiss**, and a `…` menu with *Turn off suggestions like this* and *Incorrect suggestion*. The `…` menu is where the PRD §19 dismissal options belong.
- [WRITER](https://mobbin.com/screens/3c25d19b-f83a-4717-9e7c-5bd41fec39cb): collapsed rows show only a colored dot, the term and a short action ("Correct casing"). One row at a time expands into a full card: the original struck through, an arrow, the suggestion highlighted in green, and a one-line rule explanation. The right rail lists categories with counts, and a ✓ marks categories with no issues.
- [Langdock](https://mobbin.com/screens/879416cc-ee0b-42c9-999b-3f829c041b12): red and green diff with ✓/✗ inline.
- **Takeaway:** keep the list compact and expand one card at a time. A narrow Figma panel can't show 30 full cards, so each row shows only the text layer's type, the issue and the severity, and the diff appears when the row opens.

**2. Audit summary and severity filtering**
- [Vercel accessibility panel](https://mobbin.com/screens/4922a234-9871-493a-b4fe-1dc47f2b4872): this is the closest match to a Figma plugin, a floating panel about 260px wide. It has filter chips (*All / Serious / Moderate*), accordion rules that expand to list the affected elements, refresh, and scan time ("91ms").
- [Lovable](https://mobbin.com/screens/249b76a6-5a99-48a3-823a-1158adade0d6): each issue shows a severity badge, a rule ID (`NO_RLS_POLICIES_CONFIGURED`), a badge for where the finding came from (*LLM Database Check*), **Ignore issue**, and **Try to fix all**. The scan header reads *Up-to-date · Last scan: less than a minute ago*.
- [Supabase Advisors](https://mobbin.com/screens/e3ac7f2c-bdd0-42a4-ac13-76fb893fd06d): tabs for *Errors / Warnings / Info* with counts, a **Rerun linter** button, and a footer asking *"How are these suggestions generated?"*.
- [HubSpot SEO](https://mobbin.com/screens/f8b03286-064d-4a8a-9ce8-c7aa0a3565de) and [Semrush](https://mobbin.com/screens/2b5eb6f7-8884-4c09-aa20-9b2d02bab466) group repeated findings with **"2 pages affected"** plus *How to fix*, so one issue is listed once with a count of places.
- **Takeaway:** the same copy repeats across many layers in Figma ("Continue" can appear 40 times), so repeated findings need the same grouping. Showing each finding's source (the guide section and rule, with a confidence score) fits PRD principle 9, *Make every recommendation explainable*.

**3. Scan lifecycle**
- [Base44 security scan flow](https://mobbin.com/flows/3dc92745-e8f5-4a2c-8fb4-2dfeeba6f2a5): an idle card reads *"Scan typically takes a few minutes"*. Its button turns into **Scanning** in place, then the results show one row per check, **including checks that passed** (✓ *No exposed secrets found*). A toast *"Security scan complete"* and **Apply Fixes** finish the flow.
- [Elicit](https://mobbin.com/screens/232b3136-ccbb-42e7-a45c-412ea436f330) and [AirOps](https://mobbin.com/screens/eb7dfcde-15f6-4a4d-a133-0d10ab331a9f): a step checklist with real counts (*Gather papers · 50 papers found*), the active step marked by a spinner, and the line *"Feel free to navigate away."*
- [HubSpot rescan flow](https://mobbin.com/flows/b78fb66d-43c0-4cc3-96f4-a6c200a5d1bd): *Last scanned 12 days ago · Rescan now*.
- **Takeaway:** the audit pipeline has distinct stages (extract, classify, review, consistency, validation), so show them as a checklist with counts, with findings appearing as each layer finishes. Showing checks that passed makes a clean result feel earned rather than empty.

**4. Terminology and rules**
- [WRITER Terms](https://mobbin.com/screens/ada900c4-cda6-43f4-909c-b85c5c140ad0): a table with *Term · Type (**Approved** / **Don't use**) · Part of speech · Description*. A detail drawer holds ✓/✗ examples, *Common mistakes*, a case-sensitivity setting and toggles.
- [Heidi](https://mobbin.com/screens/96515597-5d03-419f-b26f-ed0742f917a5): a two-column **Instead of → Do this** table with CSV bulk upload and a downloadable example CSV.
- [Ditto](https://mobbin.com/screens/06573124-09f9-4483-ae5a-043c0df64199), a copy tool for designers: its style guide is split into *Foundations · Style & Mechanics · Patterns · Word List*, with **Add rule** and **Add word**.
- **Takeaway:** "Instead of → Use" is the simplest model for terminology in the MVP. Rules can be organized with Ditto's four-section split.

**5. Voice configuration**
- [WRITER Tune voice](https://mobbin.com/screens/b48fded6-b609-42b0-865a-3ea87bbe3a15): trait chips in groups (*Casual vs Formal · Tone · Personality*) with a limit of **3 to 5 traits**, point-of-view toggles (*Use "we"? Yes / No / Don't care*), and a live *"Try out your voice"* preview.
- [Intercom Fin](https://mobbin.com/screens/b08150a4-14d6-4db6-b5f5-278f4407ac07): segmented chips for tone and for *answer length (Concise / Standard / Thorough)*, plus style rules as chips (*Use British English*).
- [Gorgias](https://mobbin.com/screens/202ebb25-7aed-4905-a9e8-fd868fc3e8c0): preset tone cards plus a custom-instructions field and a generated example.
- **Takeaway:** limit the selection so the voice settings stay a clear signal, and show a before/after preview so the tone becomes something designers can see.

### Recommendations for CopyPilot
1. **Expand one card at a time** in a compact list (Grammarly, WRITER).
2. **Group findings by text and rule**, e.g. "Log in → Sign in · 14 layers", with one Apply for all (HubSpot, Semrush).
3. **Show where each finding came from**: a guide-section badge with confidence, e.g. `Errors · 85%`, on every card, with the rule ID in its tooltip (Lovable).
4. **Stream results as each stage finishes**: findings appear layer by layer instead of all at the end (Elicit, Base44).
5. **Show checks that passed** in clean and partially clean results (Base44, WRITER ✓ categories).
6. **Mark results as out of date** when the design changes after an audit (Lovable *Up-to-date*).
7. **Offer bulk apply only for safe fixes** (Lovable *Try to fix all*, Base44 *Apply Fixes*). Only deterministic, validated fixes that keep the text's styling count as safe.
8. **Put the dismissal options in the `…` menu**, not in extra buttons (Grammarly).

---

## Part 2 — UI structure

### Plugin frame
- **Default size 360 × 640**, resizable from 320 to 560 wide via `figma.ui.resize` with a drag handle. Every layout below is designed for 360px width first.
- **Use Figma's own theme colors**: `showUI(__html__, { themeColors: true })` and map Tailwind tokens to `var(--figma-color-*)`. The plugin then matches light and dark mode and feels built into Figma, which fits PRD §32, *a professional design QA tool rather than a chatbot*.
- **Navigation:** a top bar with two tabs, **Audit | Rules**, plus a `⋯` menu (Help, Privacy, Feedback). Skip the sidebar; it doesn't fit 360px.

### Screen map

```text
Audit tab
├── A1 Start          (no audit yet / scope picker)
├── A2 Running        (stage checklist + streaming findings)
├── A3 Results        (summary + grouped list + expanded card)
│    ├── A3a Card expanded (diff, why, source, alternatives)
│    ├── A3b Edit suggestion (inline textarea + live validation)
│    └── A3c Rewrite menu (PRD §12 modes)
├── A4 All clear      (passed checks)
└── A5 Error (extraction failed, fonts missing)

Rules tab
├── R1 Voice          (tone chips ≤3, avoid list, preview)
├── R2 Terms          (Instead of → Use table, CSV import)
├── R3 Rules          (built-in rule toggles + custom rules)
└── R4 Ignored        (manage dismissals)
```

### A1 — Start
```text
┌──────────────────────────────────────┐
│ ◆ CopyPilot        [Audit] Rules   ⋯ │
├──────────────────────────────────────┤
│ Scope                                │
│ [Selection][Frame][Page][File]       │
│                                      │
│ ▢ Checkout / Payment                 │
│   2 frames · 47 text layers          │
│                                      │
│ Checked against the Material     ⓘ   │
│ UX writing guide · runs offline      │
│                                      │
│ [        Run audit  ⌘↵        ]      │
│                                      │
│ Last audit 3 min ago · Out of date   │
└──────────────────────────────────────┘
```
- The scope control changes to match what's selected: with nothing selected it defaults to **Page**, and File is disabled until Phase 2.
- There is no AI toggle: the reviewer always runs, locally, and nothing leaves Figma. The ⓘ opens the "How are suggestions generated?" sheet, which explains the guide and its 10-item checklist.
- With no text layers selected, it shows the architecture doc's copy: *"Select a text layer or frame to start an audit."*

### A2 — Running
```text
│ Auditing 47 layers            Cancel │
│ ✓ Read layers        47 found        │
│ ✓ Classify components 47 typed       │
│ ◌ Review against guide 31 of 47      │
│ ○ Check consistency                  │
│ ○ Validate suggestions               │
│ ──────────────────────────────────── │
│ (findings appear as layers finish)   │
```

### A3 — Results
```text
│ 12 issues · 47 layers checked   ↻    │
│ (All 12)(Critical 3)(High 5)(Low 4)  │
│ Group: Severity ▾        ☐ Select    │
│ ──────────────────────────────────── │
│ ● ERROR MESSAGE                      │
│   Insufficient error context     ▾   │
│ ┌──────────────────────────────────┐ │
│ │ Errors · 85%   Error UX · High    │ │
│ │ Something went wrong.  (struck)   │ │
│ │ → We couldn't save your changes.  │ │
│ │ Doesn't say what failed or what   │ │
│ │ to do next.                       │ │
│ │ ▸ 2 alternatives                  │ │
│ │ [Apply] [Edit] [Rewrite ▾]    ⋯   │ │
│ └──────────────────────────────────┘ │
│ ● BUTTON · 14 layers                 │
│   Log in → Sign in  (Rule)       ▸   │
│ ● BUTTON                             │
│   Generic CTA: "Next"            ▸   │
│ ──────────────────────────────────── │
│ [ Apply 6 safe fixes ]   4/12 done   │
└──────────────────────────────────────┘
```
- **Clicking a row** selects the layer and zooms to it in Figma (`scrollAndZoomIntoView`). For grouped rows, it selects all affected layers.
- **Severity chips** are filters. The *Group by* menu offers Severity, Category or Screen (frame).
- **The `⋯` menu** holds Ignore this instance, Ignore this rule, Ignore this word, Ignore this component type, and Mark as incorrect (a quality signal, PRD §28).
- **After Apply**, the row collapses to `✓ Applied · Undo (⌘Z)` and the progress count in the footer updates.
- **Low-confidence findings** (below 0.6, e.g. a vague button where the screen gives no clue to the action) move into a collapsed *"Possible improvements"* section instead of being mixed into the list. This covers PRD §29: *say so rather than invent*.

### A4 — All clear
Headline: *"No issues found in 47 layers."* Below it, a list of passed checks: ✓ Terminology ✓ Capitalization ✓ CTA clarity ✓ Error recovery, each with a count. It ends with **Run on page** as the next step.

### Rules tab
- **R1 Voice:** tone chips (Clear, Direct, Friendly, Calm, Professional, Conversational, Confident) with at most 3 selected. Below them an **Avoid** chip input (*simply, just, oops, !!*), then a **Preview** that rewrites one sample string with the current settings.
- **R2 Terms:** a table with columns *Instead of · Use · Case-sensitive*, plus **+ Add term** and **Import CSV** (with an example CSV to download). Seed it with PRD §14 pairs as suggestions the user can accept.
- **R3 Rules:** built-in rules grouped as *Language · UX writing · Product UX · Consistency · Accessibility*, each with an on/off toggle and a severity override. Custom rules (Phase 2) go here too.
- **Where settings are stored:** a toggle for **"This file (shared with team)"** vs **"Just me"**. See the storage section below.

---

## Part 3 — Technical decisions the docs don't cover yet

These are Figma-specific constraints that affect the build. Settle them before starting Phase 1.

| Topic | Decision |
|---|---|
| **Single-file UI** | Figma loads the UI as one HTML string. Use Vite + `vite-plugin-singlefile` for `ui.html`, and a separate esbuild/Vite lib build for `code.js`. |
| **Manifest** | `"documentAccess": "dynamic-page"` is required, so use the async APIs (`getNodeByIdAsync`, `loadAllPagesAsync` for file audits). Set `"networkAccess": { "allowedDomains": ["none"] }`, which also tells users in the Figma Community listing that the plugin sends nothing anywhere. Set `editorType: ["figma"]`. |
| **Where the reviewer runs** | In the UI iframe, imported straight from `@copypilot/copy-engine`. `code.ts` only extracts and writes text, so the Figma main thread stays free. |
| **Font loading** | Before any write, `await Promise.all(node.getRangeAllFontNames(0, len).map(figma.loadFontAsync))`. If a font is missing, block Apply with a clear message. |
| **Mixed-style text** | Setting `characters` flattens mixed styles (a bold word, a link color). Detect this with `getStyledTextSegments`. Such text is **not safe** for bulk apply: its card shows "Formatting will be reset" and requires a single, deliberate Apply. |
| **Components** | Text in a **main component** changes every instance, so warn and show the instance count. Text in an **instance** is an override, so apply there. If a text layer is driven by a component text property (`componentPropertyReferences.characters`), write through `setProperties` on the instance instead. |
| **Locked / hidden / off-canvas layers** | Skip them during extraction by default, with a count shown ("4 hidden layers skipped"). |
| **Undo** | Call `figma.commitUndo()` after each Apply so ⌘Z reverts one fix. A batch apply is one undo step. |
| **Out-of-date results** | Listen to `documentchange` for audited node IDs. Mark findings as out of date if a node's text changed, and remove them if the node was deleted. |
| **Settings storage (MVP, no backend DB)** | Per-user preferences go in `figma.clientStorage`. Team voice, terms and rules go in `figma.root.setSharedPluginData('copypilot', …)`, so they travel with the file and the whole team shares them. "Ignore this instance" goes in node `pluginData`. |
| **Component classification** | Use heuristics in this order: node/parent names (`Button`, `btn`, `Toast`, `Error`), the owning component set's name, auto-layout plus fill (a padded frame with one short text is likely a button), font size and weight compared with siblings (heading vs body), and the text's own patterns (short imperative → CTA). Output a `componentType` and a confidence. Below 0.6, show "Unknown" with a picker so the user can correct it (PRD §11 *optional user input*). |
| **Finding grouping** | Normalize text (trim, collapse whitespace) and group findings by `ruleId + normalizedText + suggestion`. Review unique strings once and fan the results back out to every node with that text. |
| **No sign-in, no backend** | Decided: no accounts, no server, no database. With no AI calls there is nothing to rate-limit and no bill to protect. |

---

## Part 4 — Build plan

Estimates assume one experienced full-stack developer. Each phase ends with something that can be demoed.

### Phase 0 — Setup (2–3 days)
- Monorepo (npm workspaces now; pnpm once installed): `apps/plugin`, `packages/copy-engine` (✅ exists), `packages/shared`. No `apps/api` and no `packages/ai`.
- Plugin build with two outputs (single-file UI + code bundle) and watch mode.
- Tailwind with a Figma theme-token preset, ESLint, Prettier, Vitest, and CI (lint + typecheck + test).
- **Done when:** the plugin opens in Figma Desktop with a themed "Hello" panel in both light and dark mode.

### Phase 1 — Message bridge + extraction (4–5 days)
- `bridge/messages.ts`: a Zod-validated union of `PluginMessage` / `UiMessage` types (GET_SELECTION, SELECTION_CHANGED, EXTRACT, EXTRACT_PROGRESS, APPLY_COPY, APPLY_RESULT, FOCUS_NODE, STORAGE_GET/SET).
- `selection.ts`: follows the selection live and shows the summary in A1.
- `text-extractor.ts`: chunked traversal (yields every 50 nodes) that builds a `CopyNode` for each layer with `surroundingText` (siblings plus the nearest frame title), the frame path, `componentType` and style-segment info.
- Component classifier v1 (heuristics above) with 30+ unit fixtures.
- **Done when:** selecting a 200-layer frame streams its extraction into the UI without freezing Figma.

### Phase 2 — Material reviewer ✅ built
[packages/copy-engine](packages/copy-engine) is done and needs only small additions:
- **What exists:** 33 rules grouped as component rules (vague CTAs, errors without a cause or a next step, playful tone in errors, destructive dialogs without consequences, vague empty states, wordy success messages, snackbar and tooltip length), language rules (wordy phrases, filler, marketing words, jargon, passive voice, future tense, written numbers, long sentences, "my"/"your" mixing, punctuation, sentence case, all caps), accessibility rules ("Image of" alt text, "click here", color-only and position-only meaning, character limits), and settings rules (preferred terms, avoid list, inconsistent terms across the audit). Each finding cites the section of the guide it comes from and the checklist item it fails.
- **Rewrites:** context-aware templates ("Something went wrong." next to a *Save changes* button → *"We couldn't save your changes. Check your connection and try again."*), CTA labels taken from the screen ("Next" under *Payment details* → *"Continue to payment"*), plus mechanical fixes combined into one suggestion per layer.
- **Validation:** every suggestion is reviewed again before it can be applied: it must clear high-severity issues, fit the character limit, keep `{placeholders}` and numbers, and respect the terms and avoid lists.
- **Still to add:** spelling (`nspell` + an English dictionary, loaded lazily, with term-list words treated as known), and grouping of identical findings across layers.
- **Try it:** `npm run review -- "Something went wrong." --as error --context "Save changes"`.

### Phase 3 — Results UI (6–8 days) ← most design effort
- Zustand store: `audit` (status, stages, findings by ID, groups), `filters`, `settings`.
- Screens A1–A5 and the card with its expanded, edit and applied states.
- Word-level diff (`diff-match-patch`) for the struck-through and highlighted rendering.
- Keyboard: ↑/↓ moves between findings, ↵ expands, `A` applies, `D` dismisses, `E` edits.
- Clicking a row focuses the layer in Figma, and selecting in Figma highlights the matching row.
- **Done when:** a designer can run a local-only audit and browse, filter and understand every finding.

### Phase 4 — Apply workflow (3–4 days)
- `figma-writer.ts`: font loading, the mixed-style check, component main/instance/property routing, `commitUndo`.
- Apply one, apply selected (checkbox mode), and **Apply safe fixes** (deterministic + validated + single style + not a main component).
- Edit suggestion: an inline textarea that re-runs local validation as you type.
- Dismiss options (pluginData / sharedPluginData) plus the R4 Ignored screen.
- Out-of-date results via `documentchange`.
- **Done when:** every apply can be undone with ⌘Z and none of them silently loses text formatting.

**→ Milestone: alpha.** Ship it to 3–5 designers to test the review UI.

### Phase 7 — Rules tab (4–5 days)
R1 Voice with preview, R2 Terms with CSV import/export, R3 rule toggles and severity overrides, and the "This file / Just me" storage toggle. Settings are passed to every review as `ReviewSettings`.

### Phase 8 — Rewrite menu + quality pass (3–4 days)
Without an LLM, the card's *Rewrite ▾* menu offers only the PRD §12 modes the reviewer can do reliably: **Improve CTA**, **Improve error message**, **Make shorter** (wordy phrases, filler, success templates) and **Improve accessibility**. Open-ended modes (*Make more human*, *More conversational*, *Match brand voice*) are out of scope. The PRD §13 "10/10 pass" is a card section called *What's holding this back*, which lists the guide's checklist items the layer fails, with no numeric score.

**→ Milestone: MVP (PRD §34 Definition of Done).** Private beta.

### Phase 9 — Benchmark (✅ started, ongoing)
- [test/cases.ts](packages/copy-engine/test/cases.ts) holds 63 cases. Every good example in the ux-writing skill must pass untouched, every bad example it or the PRD calls out must be flagged, and the PRD's rewrites must be reproduced exactly.
- `npm run bench` reports good copy left alone, expected issues caught and exact rewrites. Current score: 30/30, 43/43, 13/13. `npm test` runs the same cases plus consistency and validation tests (68 in total).
- Grow the set toward 300 cases as designers mark suggestions *Incorrect*. Every rule change must keep the benchmark at 100%.
- A regression fixture `.fig` file with planted issues, used for manual checks before release.

### Phase 10 — Post-MVP (PRD §26)
Page and file audits (page-by-page with `loadAllPagesAsync`, results grouped by screen), consistency across the whole file, a copy-quality summary view, and localization-risk rules. Team settings stay in the Figma file (`sharedPluginData`), so there are no accounts, Clerk, Postgres or Prisma. This replaces the database and auth rows in architecture.md.

### Timeline summary
| Milestone | Phases | Est. |
|---|---|---|
| Alpha | 0–4 (Phase 2 done) | ~3–4 weeks |
| MVP | 7–8 | +1.5–2 weeks |
| Public launch | Figma Community review, benchmark ≥ 300 cases | +1 week |

---

## Part 5 — Component inventory (UI package)

| Component | Notes |
|---|---|
| `ScopeSelector` | Segmented control; disabled states with tooltip |
| `SelectionSummary` | Frame name, layer count, skipped-layer count |
| `StageChecklist` | Steps with ✓ / spinner / ○ and live counts |
| `SeverityFilterChips` | Counts inside the chips; `All` resets |
| `FindingRow` | Severity dot, component label, title, layer-count badge, chevron |
| `FindingCard` | Source badge, category and severity, `CopyDiff`, why, alternatives, actions |
| `CopyDiff` | Word-level diff shown struck through and highlighted; stacked layout below 380px |
| `SourceBadge` | Guide section and confidence, e.g. `Errors · 85%`; tooltip shows the rule ID |
| `ValidationNote` | Why Apply is disabled ("Exceeds 24 characters", "Formatting will be reset") |
| `DismissMenu` | The five ignore scopes plus *Mark incorrect* |
| `BulkActionBar` | Sticky footer: selection count and safe-fix count |
| `PassedChecksList` | Used in All clear and at the end of Results |
| `ToneChipGroup` | Max-selection limit with a counter ("2 of 3") |
| `TermTable` | Inline-editable rows, CSV import/export |
| `EmptyState` / `ErrorState` | Copy from architecture.md §18 |

---

## Decisions (settled 2026-09-30)
1. **No sign-in.** Anyone can open the plugin and use it.
2. **No real AI.** A local reviewer built from the ux-writing skill (Google Material communication guidance) produces all findings and rewrites, and the skill's examples are its benchmark. No server, no API keys, no network access.
3. **Free, no pricing.** With no AI costs, there is nothing to limit.
4. **English only.**
