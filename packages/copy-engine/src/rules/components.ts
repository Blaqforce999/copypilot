import { inferAction, inferCta } from "../context"
import {
  ACTION_VERBS,
  ALLOWED_LABELS,
  CONSEQUENCE,
  DESTRUCTIVE,
  GENERIC_ERRORS,
  NEXT_STEP_PHRASE,
  NEXT_STEP_VERBS,
  PLAYFUL,
  SOFT_CTAS,
  VAGUE_CTAS,
  VAGUE_DIALOG_TITLE,
  VAGUE_EMPTY,
  ref,
} from "../guide"
import { capitalize, endsWithPunctuation, firstWord, lines, normalize, sentences, tidy, words } from "../text"
import type { CopyNode } from "../types"
import { defineRule } from "./define"

const GUIDE_CTA_EXAMPLES = ["Continue", "Save changes", "Review order"]

const label = (text: string) => normalize(text).toLowerCase().replace(/[.!]+$/, "")

export const hasNextStep = (text: string) =>
  NEXT_STEP_PHRASE.test(text) ||
  lines(text)
    .flatMap(sentences)
    .some((s) => NEXT_STEP_VERBS.has(firstWord(s.replace(/^please,?\s+/i, ""))))

export const isGenericError = (text: string) => GENERIC_ERRORS.some((re) => re.test(normalize(text)))

const calm = (s: string) => tidy(s.replace(PLAYFUL, "").replace(/!+/g, "."))

/** "We couldn't save your changes. Check your connection and try again." */
function errorRewrite(node: CopyNode, text: string): string | undefined {
  const action = inferAction(node)
  if (!action) return undefined
  const existingStep = lines(text)
    .flatMap(sentences)
    .find((s) => hasNextStep(s) && !isGenericError(s))
  const next = existingStep ? calm(existingStep) : action.recovery
  return `We couldn't ${action.failed}. ${next}`
}

// ─── Buttons ────────────────────────────────────────────────────────────────

export const vagueCta = defineRule({
  id: "VAGUE_CTA",
  on: ["button"],
  check: ({ node, text }) => {
    const l = label(text)
    const soft = SOFT_CTAS.includes(l)
    if (!VAGUE_CTAS.includes(l) && !soft) return
    const specific = inferCta(node)
    if (soft && !specific) return
    return {
      category: "ux_writing",
      severity: soft ? "low" : "high",
      title: soft ? "Button could be more specific" : "Vague button label",
      explanation: specific
        ? `"${normalize(text)}" doesn't say what happens next. A label naming the action sets a clear expectation.`
        : `"${normalize(text)}" doesn't say what happens. Use a verb that names the result. The reviewer couldn't tell the action from the screen, so these are examples only.`,
      confidence: specific ? (soft ? 0.6 : 0.8) : 0.4,
      guideRef: ref("Buttons", "Use clear action verbs. Avoid vague labels like Submit, Okay, Proceed, Click here."),
      checklist: "clear",
      rewrite: specific,
      alternatives: specific ? undefined : GUIDE_CTA_EXAMPLES,
      needsContext: !specific,
    }
  },
})

export const ctaNotVerbFirst = defineRule({
  id: "CTA_NOT_VERB_FIRST",
  on: ["button"],
  check: ({ node, text }) => {
    const l = label(text)
    if (VAGUE_CTAS.includes(l) || SOFT_CTAS.includes(l) || ALLOWED_LABELS.includes(l)) return
    if (ACTION_VERBS.has(firstWord(text))) return
    const specific = inferCta(node)
    return {
      category: "ux_writing",
      severity: "low",
      title: "Button doesn't start with a verb",
      explanation: "Buttons work best as actions. Starting with a verb tells the user what the button does.",
      confidence: 0.6,
      guideRef: ref("Buttons", "Use clear action verbs."),
      checklist: "clear",
      rewrite: specific && specific.toLowerCase() !== l ? specific : undefined,
      needsContext: !specific,
    }
  },
})

export const buttonTooLong = defineRule({
  id: "BUTTON_TOO_LONG",
  on: ["button"],
  check: ({ text }) => {
    const n = words(text).length
    if (n <= 4 && normalize(text).length <= 25) return
    return {
      category: "ux_writing",
      severity: "medium",
      title: "Button label is long",
      explanation: `${n} words is a lot for a button. Keep the action and move any explanation to nearby text.`,
      confidence: 0.8,
      guideRef: ref("Word Choice Rules", "Avoid long explanations inside small components."),
      checklist: "concise",
      needsContext: true,
    }
  },
})

// ─── Error messages ─────────────────────────────────────────────────────────

export const errorGeneric = defineRule({
  id: "ERROR_GENERIC",
  on: ["error"],
  check: ({ node, text }) => {
    if (!isGenericError(text)) return
    const rewrite = errorRewrite(node, text)
    return {
      category: "product_ux",
      severity: "high",
      title: "Error doesn't say what happened",
      explanation: rewrite
        ? "The message doesn't identify what failed. Naming the failed action tells the user what's affected."
        : 'The message doesn\'t identify what failed. Say what happened and what to do, e.g. "We couldn\'t save your changes. Try again." The reviewer couldn\'t tell the failed action from the screen.',
      confidence: rewrite ? 0.8 : 0.5,
      guideRef: ref("Error Messages", "Every error should answer: What happened? Why? What can the user do next?"),
      checklist: "clear",
      rewrite,
      needsContext: !rewrite,
    }
  },
})

export const errorNoNextStep = defineRule({
  id: "ERROR_NO_NEXT_STEP",
  on: ["error"],
  check: ({ node, text }) => {
    if (hasNextStep(text)) return
    const action = inferAction(node)
    const recovery = action?.recovery ?? "Try again."
    return {
      category: "product_ux",
      severity: "high",
      title: "No recovery action",
      explanation: "The error doesn't tell the user what to do next. Add the next best action.",
      confidence: action ? 0.8 : 0.6,
      guideRef: ref("Error Messages", "Format: [Problem] [Next best action]."),
      checklist: "next_step",
      patch: (t) => {
        const base = t.trim().replace(/!+$/, "")
        return `${endsWithPunctuation(base) ? base : `${base}.`} ${recovery}`
      },
    }
  },
})

export const errorTone = defineRule({
  id: "ERROR_TONE",
  on: ["error", "dialog", "dialog_title", "banner", "confirmation"],
  check: ({ text }) => {
    PLAYFUL.lastIndex = 0
    const playful = PLAYFUL.test(text)
    PLAYFUL.lastIndex = 0
    const exclaim = /!/.test(text)
    if (!playful && !exclaim) return
    return {
      category: "brand_voice",
      severity: "medium",
      title: playful ? "Playful tone in a critical moment" : "Exclamation mark in a critical moment",
      explanation: "Errors and serious decisions call for a calm, specific tone. Playful words and exclamation marks can read as dismissive when something has gone wrong.",
      confidence: 0.9,
      guideRef: ref("Tone Mapping", "Error states: calm, specific, solution-oriented. Avoid cleverness in critical moments."),
      checklist: "tone",
      patch: calm,
      autoApplicable: true,
    }
  },
})

// ─── Dialogs ────────────────────────────────────────────────────────────────

const OBJECT_SKIP = new Set(["this", "the", "your", "my", "a", "an", "all", "these", "those", "it"])

/** "Are you sure you want to delete your account?" → "Delete account?" */
function titleFromBody(body: string): string | undefined {
  const m = DESTRUCTIVE.exec(body)
  if (!m) return undefined
  const after = words(body.slice(m.index + m[0].length)).filter((w) => !OBJECT_SKIP.has(w.toLowerCase())).slice(0, 2)
  return `${capitalize([m[0].toLowerCase(), ...after.map((w) => w.toLowerCase())].join(" "))}?`
}

export const dialogVagueTitle = defineRule({
  id: "DIALOG_VAGUE_TITLE",
  on: ["dialog", "dialog_title"],
  check: ({ node, text, type }) => {
    const [title = "", ...rest] = lines(text)
    if (!VAGUE_DIALOG_TITLE.test(title)) return
    const fromBody = titleFromBody(rest.join(" "))
    const cta = type === "dialog_title" ? inferCta(node) : undefined
    const better = fromBody ?? (cta ? `${cta}?` : undefined)
    return {
      category: "ux_writing",
      severity: "high",
      title: "Dialog title doesn't name the decision",
      explanation: `"${title}" doesn't say what the user is deciding. Put the action in the title as a short question.`,
      confidence: better ? 0.8 : 0.5,
      guideRef: ref("Dialogs", "Dialog title should be brief and clear, e.g. \"Delete this project?\""),
      checklist: "clear",
      rewrite: better ? [better, ...rest].join("\n") : undefined,
      needsContext: !better,
    }
  },
})

export const destructiveNoConsequence = defineRule({
  id: "DESTRUCTIVE_NO_CONSEQUENCE",
  on: ["dialog", "confirmation"],
  check: ({ text }) => {
    if (!DESTRUCTIVE.test(text) || CONSEQUENCE.test(text)) return
    return {
      category: "product_ux",
      severity: "critical",
      title: "Destructive action without consequences",
      explanation:
        'Before a destructive action, say what will be lost and whether it can be undone, e.g. "This removes the project and its saved settings. You can’t undo this."',
      confidence: 0.85,
      guideRef: ref("Tone Mapping", "Destructive actions: serious, explicit, consequence-aware."),
      checklist: "consequences",
      needsContext: true,
    }
  },
})

// ─── Empty, success, snackbar, tooltip ──────────────────────────────────────

export const emptyStateIncomplete = defineRule({
  id: "EMPTY_STATE_INCOMPLETE",
  on: ["empty_state"],
  check: ({ text }) => {
    const ls = lines(text)
    const vague = VAGUE_EMPTY.test(normalize(ls[0] ?? ""))
    const onlyTitle = ls.length < 2 && sentences(text).length < 2
    if (!vague && !onlyTitle) return
    return {
      category: "product_ux",
      severity: "medium",
      title: vague ? "Empty state is too vague" : "Empty state has no next step",
      explanation: vague
        ? `"${normalize(ls[0] ?? "")}" doesn't say what's missing. Name it, say why it matters, and say what to do next.`
        : "Add a line that explains why this area matters and what the user can do to fill it.",
      confidence: 0.75,
      guideRef: ref("Empty States", "Explain what is missing, why it matters, and what to do next."),
      checklist: "next_step",
      alternatives: ["No saved recipients\nSave an address to send faster next time."],
      needsContext: true,
    }
  },
})

const SUCCESS_TEMPLATE =
  /^(?:your\s+)?(.+?)\s+(?:has|have|was|were)\s+(?:been\s+)?(?:successfully\s+)?([a-z]+ed|sent|made|done)(?:\s+successfully)?[.!]*$/i

export const successVerbose = defineRule({
  id: "SUCCESS_VERBOSE",
  on: ["success", "snackbar", "confirmation"],
  check: ({ text }) => {
    const t = normalize(text)
    const m = SUCCESS_TEMPLATE.exec(t)
    const hasSuccessfully = /\bsuccessfully\b/i.test(t)
    if (!m && !hasSuccessfully) return
    return {
      category: "ux_writing",
      severity: "low",
      title: "Success message is wordy",
      explanation: "Confirmation works best short and past-tense. \"Successfully\" repeats what the message already says.",
      confidence: 0.85,
      guideRef: ref("Tone Mapping", "Success states: brief and reassuring."),
      checklist: "concise",
      rewrite: m ? capitalize(`${m[1]!.toLowerCase()} ${m[2]!.toLowerCase()}`) : undefined,
      patch: m ? undefined : (s) => tidy(s.replace(/\s*\bsuccessfully\b/gi, "")),
      autoApplicable: true,
    }
  },
})

export const snackbarTooLong = defineRule({
  id: "SNACKBAR_TOO_LONG",
  on: ["snackbar"],
  check: ({ text }) => {
    if (normalize(text).length <= 60 && sentences(text).length <= 1) return
    return {
      category: "ux_writing",
      severity: "medium",
      title: "Snackbar message is long",
      explanation: "Snackbars disappear on their own, so they should fit in one short line, like \"Address copied\".",
      confidence: 0.8,
      guideRef: ref("Snackbars", "Use for low-priority feedback. Keep it short."),
      checklist: "concise",
      needsContext: true,
    }
  },
})

export const tooltipTooLong = defineRule({
  id: "TOOLTIP_TOO_LONG",
  on: ["tooltip"],
  check: ({ text }) => {
    if (normalize(text).length <= 150) return
    return {
      category: "ux_writing",
      severity: "low",
      title: "Tooltip is long",
      explanation: "Tooltips should explain one unfamiliar concept in a sentence. Move required information into the screen itself.",
      confidence: 0.7,
      guideRef: ref("Tooltips", "Use tooltips to explain unfamiliar concepts, not required information."),
      checklist: "concise",
      needsContext: true,
    }
  },
})

export const componentRules = [
  vagueCta,
  ctaNotVerbFirst,
  buttonTooLong,
  errorGeneric,
  errorNoNextStep,
  errorTone,
  dialogVagueTitle,
  destructiveNoConsequence,
  emptyStateIncomplete,
  successVerbose,
  snackbarTooLong,
  tooltipTooLong,
]
