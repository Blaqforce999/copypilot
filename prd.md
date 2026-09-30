# UX Copy Audit Figma Plugin — Product Requirements Document

## 1. Product Name

**CopyPilot**

**Tagline:** *Turn every interface sentence into better product communication.*

CopyPilot is a Figma plugin that audits, improves, and standardizes UX copy directly inside Figma. It helps product designers, UX writers, product managers, and design teams detect copy problems, understand why they matter, and generate context-aware alternatives that are clearer, more consistent, accessible, concise, and appropriate for the product experience.

---

# 2. Product Vision

Make UX copy quality part of the design workflow instead of a final proofreading step.

CopyPilot should be able to look at interface copy in context, identify problems, explain them in practical UX terms, and propose improved versions that preserve the intended meaning and product voice.

The plugin should aim for **high-quality product communication**, not merely grammatically correct sentences.

---

# 3. Problem

UX copy is often reviewed manually and inconsistently.

Common problems include:

- Grammar, spelling, punctuation, and capitalization errors
- Unclear or ambiguous language
- Generic or robotic wording
- Inconsistent terminology
- Weak button labels and CTAs
- Poor error messages
- Confusing onboarding instructions
- Excessive wordiness
- Missing context
- Inconsistent tone of voice
- Accessibility problems
- Unhelpful empty states
- Poor confirmation and success messages
- Weak form labels and helper text
- Missing recovery instructions in errors
- Copy that does not match the user's mental model
- Copy that does not fit the available UI space
- Inconsistent capitalization and style across screens
- Copy that communicates what the system does instead of what the user needs to know

Existing grammar tools generally evaluate text as writing.

CopyPilot evaluates text as **interface communication**.

---

# 4. Target Users

## Primary

### Product Designers
Need fast copy feedback while designing screens.

### UX Designers
Need to validate clarity, hierarchy, consistency, and usability of interface copy.

### UX Writers / Content Designers
Need a second layer of quality control and scalable copy review.

### Product Managers
Need to review product language without becoming copy specialists.

## Secondary

- Design teams
- Startup founders
- Design agencies
- Product engineers
- Design-system teams
- Accessibility specialists
- Researchers

---

# 5. Core Product Principle

**Never improve copy without understanding its UI context.**

A recommendation should consider, where available:

- Text content
- Text type
- Surrounding UI
- Component type
- User action
- Screen context
- Product terminology
- Tone of voice
- Character/space constraints
- Accessibility
- User intent
- Error or success state
- Platform conventions
- Design-system rules

---

# 6. Product Goals

## Goal 1 — Audit UX Copy

Allow users to audit selected text, a frame, a page, or an entire Figma file.

## Goal 2 — Detect Problems

Identify issues across language, UX writing, consistency, accessibility, and product communication.

## Goal 3 — Explain Problems

Every finding should explain:

1. What is wrong
2. Why it matters
3. How severe it is
4. What type of issue it is
5. Suggested correction

## Goal 4 — Improve Copy

Generate context-aware alternatives rather than generic rewrites.

## Goal 5 — Establish Copy Standards

Allow teams to define their own terminology, tone, capitalization, prohibited words, preferred words, and writing rules.

## Goal 6 — Preserve Designer Control

Never silently modify the design. Recommendations must be reviewable and individually applicable.

---

# 7. Core Features

## 7.1 Selection Audit

Audit currently selected text layers.

### Output

- Issue count
- Severity
- Issue categories
- Original copy
- Suggested copy
- Explanation
- Apply button

---

## 7.2 Frame Audit

Analyze all text layers inside a selected frame.

Useful for auditing:

- Onboarding screens
- Forms
- Dashboards
- Modals
- Empty states
- Error states
- Settings
- Checkout
- Authentication
- Mobile screens

---

## 7.3 Page Audit

Scan all relevant text layers on a Figma page.

Results should be grouped by:

- Critical
- High
- Medium
- Low
- Suggestions

---

## 7.4 Full File Audit

Analyze the entire document where technically and practically feasible.

The plugin should process the file in bounded batches rather than freezing Figma.

---

# 8. Copy Quality Engine

CopyPilot should score copy across multiple dimensions.

## Clarity

Does the user immediately understand the message?

## Concision

Can the same meaning be communicated with fewer words?

## Usability

Does the copy help the user complete the task?

## Consistency

Does terminology match the rest of the product?

## Tone

Does the wording fit the configured brand voice?

## Accessibility

Can the copy be understood by a broad range of users?

## Actionability

Does the copy clearly communicate what the user can or should do?

## Specificity

Does it provide enough information to make the next decision?

## Error Recovery

If something went wrong, does the message explain what happened and what the user can do next?

## Naturalness

Does the copy sound like a real product rather than generated or corporate language?

---

# 9. Issue Categories

CopyPilot should support a structured issue taxonomy.

### Language

- Spelling
- Grammar
- Punctuation
- Capitalization
- Word choice
- Sentence structure

### UX Writing

- Ambiguity
- Vagueness
- Excessive verbosity
- Passive voice
- Unclear instructions
- Weak CTA
- Generic CTA
- Missing context
- Redundant copy
- Jargon

### Product UX

- Poor error message
- Missing recovery action
- Weak confirmation
- Poor empty state
- Unclear onboarding
- Missing system status
- Confusing form guidance
- Unclear permissions language

### Consistency

- Terminology mismatch
- Inconsistent capitalization
- Inconsistent naming
- Inconsistent CTA patterns
- Inconsistent tone

### Accessibility

- Difficult wording
- Excessive sentence complexity
- Ambiguous references
- Reliance on color/context alone
- Poor error communication
- Potential screen-reader ambiguity

### Brand / Voice

- Tone mismatch
- Unwanted formality
- Excessive friendliness
- Unnecessary marketing language
- Brand vocabulary violations

---

# 10. Context Detection

CopyPilot should infer or receive context from the Figma document.

Examples:

**"Continue"**
Could be acceptable or insufficient depending on the preceding screen and task.

**"Delete"**
May require stronger confirmation depending on destructive consequences.

**"Something went wrong."**
Should trigger a recommendation for a more useful error message when additional context is available.

The system should not rewrite text blindly.

---

# 11. UI Component Recognition

The system should attempt to classify text based on its surrounding component.

Examples:

- Button
- Input label
- Placeholder
- Helper text
- Tooltip
- Modal title
- Modal body
- Error message
- Success message
- Empty state
- Navigation label
- Tab
- Toast
- Banner
- Heading
- Description
- Onboarding step
- Checkbox label
- Radio option
- Confirmation message

Component classification can use Figma node types, naming conventions, hierarchy, surrounding text, and optional user input.

---

# 12. Rewrite Modes

Users should be able to request specific improvements.

### Make Clearer
Simplify unclear language.

### Make Shorter
Reduce unnecessary words while preserving meaning.

### Make More Human
Remove robotic or unnatural language.

### Make More Professional
Improve professionalism without making the copy corporate or bloated.

### Make More Conversational
Use natural product language.

### Improve CTA
Create clearer action-oriented labels.

### Improve Error Message
Explain the problem and provide recovery guidance.

### Improve Accessibility
Reduce ambiguity and improve comprehension.

### Match Brand Voice
Rewrite using configured voice rules.

### Give Me Options
Generate multiple alternatives with different tones.

---

# 13. "10/10 Copy" Mode

The product should provide a quality pass that evaluates copy holistically.

The system should not simply assign an arbitrary score.

Instead, it should identify the dimensions preventing the copy from reaching the configured quality standard.

Example:

**Current**
"Your request could not be processed."

**Problems**
- Does not explain what happened
- Does not tell the user what to do
- Generic
- Low recovery value

**Improved**
"We couldn't save your changes. Check your connection and try again."

**Why**
- States the failed action
- Gives a likely cause
- Gives a recovery action

---

# 14. Consistency Checker

CopyPilot should detect repeated terminology and style patterns.

Examples:

- "Sign in" vs "Log in"
- "Delete account" vs "Remove account"
- "Create account" vs "Sign up"
- "Cancel" vs "Close"
- "Password" vs "Passcode"

The system should surface inconsistencies and allow teams to define preferred terminology.

---

# 15. Brand Voice System

Teams should be able to configure:

### Tone

Examples:

- Clear
- Direct
- Friendly
- Calm
- Professional
- Conversational
- Confident

### Avoid

Examples:

- "Simply"
- "Just"
- "Oops"
- Excessive exclamation marks
- Corporate jargon

### Prefer

Examples:

- Preferred product terminology
- Preferred CTA patterns
- Preferred spelling
- Preferred capitalization

---

# 16. UX Copy Rules

Teams should be able to create custom rules.

Example:

```text
Rule:
Never use "Log in".
Use "Sign in".

Rule:
All primary CTAs should begin with a verb.

Rule:
Error messages should explain the problem and provide a recovery action.
```

The rules engine should be evaluated alongside AI-generated recommendations.

---

# 17. Copy Context Panel

The plugin should show the user why a recommendation was made.

Example:

**Issue:** Weak CTA

**Current:** "Next"

**Recommended:** "Continue to payment"

**Reason:**
The current label does not communicate what happens next. The recommended version gives users a clearer expectation.

---

# 18. Apply Changes

Users should be able to:

- Apply one recommendation
- Apply selected recommendations
- Apply all safe corrections
- Reject a recommendation
- Regenerate
- Edit the suggestion manually

Every change should be reversible through normal Figma undo behavior.

---

# 19. Ignore / Dismiss

Users can dismiss findings.

Dismissal options:

- Ignore this instance
- Ignore this rule
- Ignore this word
- Ignore this component
- Ignore across project

---

# 20. Copy Diff

Before applying a rewrite, show:

**Original**
"Your payment was unable to be processed successfully."

**Suggested**
"We couldn't process your payment."

This lets users understand exactly what changed.

---

# 21. Design-System Integration

Future versions should support project-level copy standards.

Potential configuration:

- Product terminology
- Voice
- Writing rules
- Component-specific rules
- Preferred CTA patterns
- Accessibility rules
- Localization constraints

---

# 22. Localization Awareness

The first version should not attempt full translation management.

It should, however, detect copy that may create localization problems:

- Idioms
- Cultural references
- Hard-coded sentence structures
- Excessive text expansion risk
- Concatenated strings
- Ambiguous placeholders

---

# 23. AI Architecture

CopyPilot should use a layered evaluation system.

### Layer 1 — Deterministic Checks

Fast local checks:

- Spelling
- Capitalization
- punctuation
- prohibited terms
- preferred terminology
- obvious patterns
- character limits

### Layer 2 — UX Heuristics

Evaluate:

- CTA quality
- clarity
- error recovery
- verbosity
- consistency
- accessibility heuristics
- component-specific patterns

### Layer 3 — AI Reasoning

Use an LLM for:

- contextual interpretation
- rewriting
- tone adaptation
- nuanced UX recommendations
- explanation

### Layer 4 — Validation

Validate the proposed output against:

- original intent
- terminology rules
- character limits
- tone rules
- forbidden terms
- required information

---

# 24. Privacy

The plugin should minimize the amount of design data sent externally.

The architecture should support:

- Local deterministic analysis
- Explicit user-triggered AI analysis
- Minimal text/context payloads
- No unnecessary document transmission
- Clear indication when AI processing occurs

No API keys should be embedded in the Figma plugin.

---

# 25. MVP

The MVP should focus on the smallest workflow that proves the product.

### MVP includes

1. Select text or a frame
2. Extract text and relevant Figma context
3. Run copy audit
4. Categorize findings
5. Show severity
6. Explain each finding
7. Generate improved copy
8. Show original vs suggested
9. Apply suggestion to Figma
10. Undo through Figma
11. Basic terminology rules
12. Basic tone configuration

---

# 26. Post-MVP

### Phase 2

- Page auditing
- File auditing
- Custom rules
- Brand voice profiles
- Consistency analysis
- Copy quality dashboard
- Batch fixes
- Team settings

### Phase 3

- Design-system integration
- Localization checks
- Component-aware rules
- Project-wide terminology management
- Analytics
- Collaboration
- Team review workflows

### Phase 4

- Advanced AI context understanding
- Product-specific copy intelligence
- Cross-screen semantic consistency
- Automated copy QA during design development
- Organization-wide content standards

---

# 27. Non-Goals

CopyPilot is not initially intended to be:

- A general-purpose grammar app
- A full translation management system
- A CMS
- A complete content management platform
- A replacement for UX writers
- An autonomous agent that changes designs without review
- A generic AI chat interface inside Figma

---

# 28. Success Metrics

### Product Metrics

- Audit completion rate
- Recommendations applied
- Recommendations accepted vs rejected
- Regeneration rate
- Dismissal rate
- Average audit time
- Repeat usage
- Screens audited per session

### Quality Metrics

- User-rated recommendation quality
- False-positive rate
- Rewrite acceptance rate
- Consistency issue detection accuracy
- Context classification accuracy

The most important quality signal is whether designers accept the recommendations.

---

# 29. Product Quality Bar

A recommendation should pass these checks before being presented as a strong recommendation:

1. Does it preserve the original intent?
2. Is it clearer?
3. Is it more useful to the user?
4. Is it appropriate for the UI component?
5. Is it consistent with product terminology?
6. Does it follow the configured tone?
7. Is it concise enough?
8. Does it avoid unnecessary jargon?
9. Does it improve accessibility where relevant?
10. Does it fit the available UI constraints?

If the system cannot confidently improve the copy, it should say so rather than inventing a rewrite.

---

# 30. Primary User Flow

```text
Open CopyPilot
        ↓
Select text / frame / page
        ↓
Analyze
        ↓
Detect context
        ↓
Run deterministic checks
        ↓
Run UX heuristics
        ↓
Run AI contextual analysis
        ↓
Validate recommendations
        ↓
Display findings
        ↓
Review suggestion
        ↓
Apply / Edit / Reject
        ↓
Continue auditing
```

---

# 31. Example Audit

### Input

"Oops! Something went wrong. Please try again."

### Audit

**Issue 1 — Low information**
The message does not tell the user what failed.

**Issue 2 — Recovery is generic**
"Try again" does not help if the failure persists.

**Issue 3 — Tone**
"Oops!" may not fit a serious product context.

### Suggested

"We couldn't save your changes. Please try again."

### Optional contextual version

"We couldn't save your changes. Check your connection and try again."

---

# 32. Design Direction

The UI should feel like a professional design QA tool rather than a chatbot.

Primary layout:

```text
┌──────────────────────────────────────┐
│ CopyPilot                     Audit  │
├──────────────────────────────────────┤
│                                      │
│  12 issues found                     │
│                                      │
│  ● 3 Critical                        │
│  ● 5 Improvements                    │
│  ● 4 Suggestions                     │
│                                      │
│  ────────────────────────────────    │
│                                      │
│  ERROR MESSAGE                       │
│  "Something went wrong."             │
│                                      │
│  High · Error UX                     │
│                                      │
│  This does not explain what failed   │
│  or what the user can do next.       │
│                                      │
│  Suggested                            │
│  "We couldn't save your changes."    │
│                                      │
│  [Apply] [Edit] [Regenerate]         │
│                                      │
└──────────────────────────────────────┘
```

---

# 33. Product Personality

CopyPilot should feel:

- Precise
- Direct
- Helpful
- Calm
- Professional
- Context-aware
- Opinionated about quality
- Transparent about uncertainty

It should not feel:

- Robotic
- Overly corporate
- Like a generic AI chatbot
- Judgmental toward designers
- Excessively verbose

---

# 34. MVP Definition of Done

The MVP is complete when a designer can:

1. Open CopyPilot in Figma.
2. Select a text layer or frame.
3. Run an audit.
4. See detected UX copy issues.
5. Understand why each issue was detected.
6. Receive context-aware recommendations.
7. Compare original and suggested copy.
8. Apply a recommendation directly to the selected Figma text.
9. Configure basic tone and terminology rules.
10. Undo changes using Figma's normal undo behavior.
