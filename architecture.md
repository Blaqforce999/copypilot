# CopyPilot — Architecture

## 1. Architecture Goal

CopyPilot is a Figma plugin composed of a Figma Plugin runtime and a sandboxed UI application.

The architecture separates:

- Figma document access
- UI state
- deterministic copy analysis
- UX heuristics
- AI analysis
- recommendation validation
- user configuration

The plugin should remain responsive and should never require an embedded secret.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │       Figma         │
                         │   Design Document   │
                         └──────────┬──────────┘
                                    │
                           Figma Plugin API
                                    │
                                    ▼
                    ┌──────────────────────────┐
                    │     Plugin Controller    │
                    │        code.ts           │
                    └────────────┬─────────────┘
                                 │
                     postMessage / message bus
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       Plugin UI           │
                    │ React + TypeScript        │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
                    ▼                          ▼
          ┌───────────────────┐      ┌───────────────────┐
          │ Local Copy Engine │      │ AI Analysis Layer │
          │ deterministic     │      │ contextual LLM    │
          └─────────┬─────────┘      └─────────┬─────────┘
                    │                          │
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │ Recommendation Validator │
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │ Findings / Suggestions   │
                    │ / Apply / Reject / Edit  │
                    └──────────────────────────┘
```

---

# 3. Recommended Stack

## Figma Plugin

- TypeScript
- Figma Plugin API
- Figma Plugin Manifest
- Figma Plugin UI

## UI

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui or a lightweight internal component layer

## State

- Zustand

## Validation

- Zod

## AI Layer

- Provider-agnostic LLM API
- Structured JSON output
- Server-side API proxy

Recommended initial provider abstraction:

```text
LLMProvider
├── OpenAIProvider
├── AnthropicProvider
└── FutureProvider
```

The plugin should never contain provider API keys.

## Backend

- TypeScript
- Node.js
- Fastify

Alternative if the team prefers a serverless architecture:

- Next.js API routes
- Vercel Functions

For the first production version, a small TypeScript API service is sufficient.

## Database

- PostgreSQL
- Prisma ORM

The database should initially store:

- User settings
- Workspace/project settings
- Terminology rules
- Voice rules
- Audit metadata where required

Do not store full Figma documents by default.

## Authentication

Use an external authentication system when accounts become necessary.

Recommended:

- Clerk

The MVP can initially avoid accounts if the product can operate without persistent cloud settings.

## Testing

- Vitest
- React Testing Library
- Playwright for browser-level testing where applicable
- Figma plugin integration tests for critical document operations

## Linting / Formatting

- ESLint
- Prettier

## Package Management

- pnpm

---

# 4. Repository Structure

```text
copypilot/
│
├── apps/
│   ├── plugin/
│   │   ├── src/
│   │   │   ├── code/
│   │   │   │   ├── index.ts
│   │   │   │   ├── selection.ts
│   │   │   │   ├── text-extractor.ts
│   │   │   │   └── figma-writer.ts
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── App.tsx
│   │   │   │   ├── components/
│   │   │   │   ├── features/
│   │   │   │   └── styles/
│   │   │   │
│   │   │   ├── bridge/
│   │   │   │   ├── messages.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   └── main.ts
│   │   │
│   │   ├── manifest.json
│   │   └── vite.config.ts
│   │
│   └── api/
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── providers/
│       │   └── server.ts
│       └── package.json
│
├── packages/
│   ├── copy-engine/
│   │   ├── rules/
│   │   ├── heuristics/
│   │   ├── scoring/
│   │   └── index.ts
│   │
│   ├── ai/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   ├── providers/
│   │   └── index.ts
│   │
│   ├── shared/
│   │   ├── types/
│   │   ├── constants/
│   │   └── schemas/
│   │
│   └── config/
│
├── tests/
│   ├── copy-engine/
│   ├── ai/
│   └── integration/
│
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   └── copy-rules.md
│
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

# 5. Core Data Model

## CopyNode

```ts
type CopyNode = {
  id: string
  nodeType: string
  text: string
  name: string
  parentId?: string
  componentType?: ComponentType
  surroundingText?: string[]
  characters?: number
  maxCharacters?: number
}
```

## AuditRequest

```ts
type AuditRequest = {
  nodes: CopyNode[]
  mode: "selection" | "frame" | "page" | "file"
  tone?: ToneConfig
  terminology?: TerminologyConfig
  rules?: CopyRule[]
}
```

## Finding

```ts
type Finding = {
  id: string
  nodeId: string
  category: FindingCategory
  severity: "critical" | "high" | "medium" | "low"
  title: string
  explanation: string
  originalText: string
  suggestion?: string
  alternatives?: string[]
  confidence: number
  ruleId?: string
}
```

## Recommendation

```ts
type Recommendation = {
  nodeId: string
  original: string
  suggested: string
  reason: string
  changes: string[]
  confidence: number
}
```

---

# 6. Analysis Pipeline

```text
Figma Selection
      ↓
Extract text
      ↓
Extract structural context
      ↓
Classify component
      ↓
Run deterministic rules
      ↓
Run UX heuristics
      ↓
Build AI context
      ↓
AI analysis
      ↓
Validate AI output
      ↓
Merge findings
      ↓
Deduplicate
      ↓
Rank findings
      ↓
Display
```

---

# 7. Deterministic Engine

Deterministic checks should run locally whenever possible.

Examples:

```text
PROHIBITED_TERM
PREFERRED_TERM
CAPITALIZATION
PUNCTUATION
SPELLING
CHARACTER_LIMIT
REPEATED_WORD
DUPLICATE_COPY
CTA_PATTERN
TERMINOLOGY_MISMATCH
```

These checks should be:

- Fast
- Predictable
- Testable
- Explainable
- Independent from the LLM

---

# 8. UX Heuristic Engine

The heuristic engine evaluates copy based on component context.

Example:

```text
Component: Error message

Check:
- Does it identify the failed action?
- Does it explain the problem?
- Does it provide recovery guidance?
- Is the message specific?
- Is the CTA useful?
```

Another example:

```text
Component: Primary button

Check:
- Is the action clear?
- Does the label describe the result?
- Is it unnecessarily generic?
- Is the action consistent with product terminology?
```

---

# 9. AI Prompt Architecture

Do not use one giant prompt for every operation.

Use specialized prompts.

```text
prompts/
├── audit.ts
├── rewrite.ts
├── classify-component.ts
├── improve-error.ts
├── improve-cta.ts
├── tone.ts
├── accessibility.ts
└── consistency.ts
```

Each prompt should receive structured context.

Example:

```json
{
  "text": "Something went wrong.",
  "component": "error_message",
  "screen_context": [
    "Save changes",
    "Profile settings"
  ],
  "tone": {
    "style": ["clear", "calm", "direct"]
  },
  "rules": [
    "Error messages should explain the problem."
  ]
}
```

---

# 10. Structured AI Output

Never rely on free-form AI output for application logic.

Require structured output:

```json
{
  "findings": [
    {
      "category": "error_ux",
      "severity": "high",
      "title": "Insufficient error context",
      "explanation": "The message does not identify what failed.",
      "suggestion": "We couldn't save your changes.",
      "confidence": 0.94
    }
  ]
}
```

Validate this response with Zod before rendering it.

---

# 11. Recommendation Validation

Every AI recommendation passes through a validation layer.

```text
AI Suggestion
     ↓
Schema Validation
     ↓
Intent Preservation
     ↓
Terminology Check
     ↓
Forbidden Terms Check
     ↓
Tone Check
     ↓
Length Check
     ↓
Required Information Check
     ↓
Recommendation
```

A failed validation should prevent automatic application.

---

# 12. Figma Message Architecture

Use typed messages between the plugin runtime and UI.

```ts
type PluginMessage =
  | {
      type: "AUDIT_SELECTION"
      payload: AuditRequest
    }
  | {
      type: "APPLY_COPY"
      payload: {
        nodeId: string
        text: string
      }
    }
  | {
      type: "GET_SELECTION"
    }
  | {
      type: "CLOSE_PLUGIN"
    }
```

Responses should also use typed contracts.

---

# 13. Figma Runtime Responsibilities

`code.ts` should handle:

- Figma API access
- Selection reading
- Node traversal
- Text extraction
- Font loading before text modification
- Applying text changes
- Plugin lifecycle
- Message communication

The Figma runtime should not contain the full UI.

---

# 14. UI Responsibilities

The React application handles:

- Audit controls
- Findings list
- Filters
- Recommendation cards
- Copy diff
- Settings
- Tone controls
- Terminology rules
- Loading states
- Errors
- Apply/reject actions

---

# 15. Performance

Large audits should never block the Figma main thread.

Use:

- Chunked node extraction
- Batched analysis
- Async requests
- Incremental result rendering
- Progress indicators
- Cancellation where practical

Example:

```text
1–50 nodes   → batch 1
51–100       → batch 2
101–150      → batch 3
...
```

---

# 16. Security

Never place:

- LLM API keys
- Database credentials
- OAuth secrets
- Private signing keys

inside plugin source.

The plugin should call a controlled backend for authenticated AI operations.

Architecture:

```text
Figma Plugin
     ↓
Authenticated API
     ↓
AI Provider
```

---

# 17. Privacy

Default principle:

**Send the minimum context required to produce a useful recommendation.**

For a selected text layer, do not send the entire Figma document.

Only send:

- Selected copy
- Relevant component context
- Necessary surrounding text
- Configured rules
- Relevant UI constraints

---

# 18. Error Handling

Every network or AI failure should produce a useful UI state.

Examples:

```text
AI unavailable
→ "We couldn't run the contextual audit. Your local checks are still available."

Invalid AI response
→ "The recommendation could not be validated."

No improvement found
→ "This copy already meets the current rules. No change recommended."

No selection
→ "Select a text layer or frame to start an audit."
```

---

# 19. Observability

Production backend should track operational metrics without storing unnecessary copy content.

Useful metrics:

- Request latency
- AI provider latency
- Error rate
- Validation failure rate
- Token usage
- Audit size
- Recommendation acceptance events

Avoid storing raw design copy unless explicitly required and consented to.

---

# 20. Testing Strategy

## Unit

Test:

- Rules
- Heuristics
- Scoring
- Validators
- Schemas
- Terminology matching

## Integration

Test:

- Plugin ↔ UI messages
- AI response validation
- Apply-copy workflow
- Settings persistence

## UX

Test:

- Audit workflow
- Recommendation review
- Applying/rejecting suggestions
- Empty states
- Error states

## Regression

Maintain a benchmark dataset containing:

- Good UX copy
- Bad UX copy
- Ambiguous copy
- Error messages
- CTAs
- Empty states
- Onboarding copy
- Accessibility cases

Every AI/rules change should be evaluated against the benchmark.

---

# 21. Architecture Principles

1. **Context before rewriting.**
2. **Deterministic checks before AI.**
3. **AI output must be structured.**
4. **Never trust unvalidated model output.**
5. **Never silently change user designs.**
6. **Keep the Figma runtime lightweight.**
7. **Keep secrets out of the plugin.**
8. **Prefer local analysis when possible.**
9. **Make every recommendation explainable.**
10. **Let designers remain in control.**

---

# 22. Initial Implementation Order

### Step 1
Figma plugin shell and React UI.

### Step 2
Selection extraction and typed message bridge.

### Step 3
Local deterministic copy engine.

### Step 4
Finding UI.

### Step 5
Apply-copy workflow.

### Step 6
Backend API.

### Step 7
LLM provider abstraction.

### Step 8
Structured AI audit.

### Step 9
Recommendation validation.

### Step 10
Tone and terminology settings.

### Step 11
Frame/page auditing.

### Step 12
Benchmark and quality evaluation.

---

# 23. Recommended Initial Stack Summary

| Layer | Technology |
|---|---|
| Plugin runtime | TypeScript + Figma Plugin API |
| UI | React + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Validation | Zod |
| Local analysis | TypeScript rules/heuristics |
| AI API | TypeScript backend |
| Backend | Node.js + Fastify |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Clerk when accounts are introduced |
| Testing | Vitest + React Testing Library + Playwright |
| Package manager | pnpm |
| Formatting | Prettier |
| Linting | ESLint |
| Deployment | Vercel or equivalent managed platform |
