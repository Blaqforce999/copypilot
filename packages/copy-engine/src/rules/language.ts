import {
  ALT_PREFIX,
  COLOR_ONLY,
  DIRECTIONAL,
  FILLER,
  FLUFF,
  JARGON,
  LINK_VAGUE,
  NUMBER_WORDS,
  WORDY,
  ref,
} from "../guide"
import {
  capitalize,
  isAllCaps,
  isTitleCase,
  lines,
  matchCase,
  sentences,
  tidy,
  toSentenceCase,
  words,
} from "../text"
import { isGenericError } from "./components"
import { SHORT_UI, defineRule } from "./define"

export const wordy = defineRule({
  id: "WORDY_PHRASE",
  skip: ["alt_text"],
  check: ({ text }) => {
    const hits = WORDY.filter(([re]) => {
      re.lastIndex = 0
      return re.test(text)
    })
    if (hits.length === 0) return
    const pairs = hits.map(([re, to]) => {
      re.lastIndex = 0
      const from = re.exec(text)?.[0] ?? ""
      re.lastIndex = 0
      return `"${from}" → ${to ? `"${to}"` : "remove"}`
    })
    return {
      category: "ux_writing",
      severity: "low",
      title: "Wordy phrase",
      explanation: `Shorter, common words scan faster: ${pairs.join(", ")}.`,
      confidence: 0.9,
      guideRef: ref("Word Choice Rules", "Use common words. Be concise, but not robotic."),
      checklist: "concise",
      patch: (s) =>
        tidy(WORDY.reduce((acc, [re, to]) => acc.replace(re, (m) => (to ? matchCase(m, to) : "")), s)),
      autoApplicable: true,
    }
  },
})

export const filler = defineRule({
  id: "FILLER_WORD",
  check: ({ text }) => {
    FILLER.lastIndex = 0
    const found = text.match(FILLER)
    if (!found) return
    return {
      category: "brand_voice",
      severity: "low",
      title: "Filler word",
      explanation: `${found.map((f) => `"${f.trim()}"`).join(", ")} adds nothing, and "simply" or "just" can make a task that feels hard sound trivial.`,
      confidence: 0.85,
      guideRef: ref("Word Choice Rules", "Avoid marketing fluff."),
      checklist: "concise",
      patch: (s) => tidy(s.replace(FILLER, "")),
      autoApplicable: true,
    }
  },
})

export const fluff = defineRule({
  id: "MARKETING_FLUFF",
  check: ({ text }) => {
    const m = FLUFF.exec(text)
    if (!m) return
    return {
      category: "brand_voice",
      severity: "low",
      title: "Marketing language",
      explanation: `"${m[0]}" sounds like marketing rather than product communication. Say what the feature does instead.`,
      confidence: 0.75,
      guideRef: ref("Word Choice Rules", "Avoid marketing fluff."),
      checklist: "familiar",
      needsContext: true,
    }
  },
})

export const jargon = defineRule({
  id: "JARGON",
  skip: ["alt_text"],
  check: ({ text }) => {
    const hits = JARGON.filter(([re]) => {
      re.lastIndex = 0
      return re.test(text)
    })
    if (hits.length === 0) return
    const fixable = hits.filter(([, to]) => to !== null)
    return {
      category: "ux_writing",
      severity: "medium",
      title: "Technical or internal language",
      explanation: `${hits.map(([, , term]) => `"${term}"`).join(", ")} ${hits.length > 1 ? "are" : "is"} internal or technical language. Use words the user already knows.`,
      confidence: 0.8,
      guideRef: ref("Core Principles", "Avoid jargon unless the user already understands it. Write for real users, not internal teams."),
      checklist: "jargon",
      patch: fixable.length
        ? (s) =>
            tidy(
              fixable.reduce(
                (acc, [re, to]) => acc.replace(/\bthe user['’]s\b/gi, (m) => matchCase(m, "your")).replace(re, (m) => matchCase(m, to!)),
                s,
              ),
            )
        : undefined,
    }
  },
})

const PASSIVE =
  /\b(is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(\w+ed|made|done|sent|shown|given|taken|seen|found|lost|kept|built|paid|written|chosen|known)\b/i
const ADJECTIVAL = new Set(["required", "needed", "supported", "allowed", "located", "based", "interested", "connected", "logged", "signed", "used", "limited", "disabled", "enabled", "expired", "verified", "selected", "saved", "added", "completed", "shown", "done", "finished", "closed", "locked", "blocked"])

export const passive = defineRule({
  id: "PASSIVE_VOICE",
  on: ["error", "body", "helper_text", "empty_state", "dialog", "banner", "onboarding", "notification", "tooltip"],
  check: ({ text, type }) => {
    if (type === "error" && isGenericError(text)) return
    const m = PASSIVE.exec(text)
    if (!m || ADJECTIVAL.has(m[2]!.toLowerCase())) return
    return {
      category: "ux_writing",
      severity: type === "error" ? "medium" : "low",
      title: "Passive voice",
      explanation: `"${m[0]}" hides who does what. Active voice is clearer: say who acts, the user or the product.`,
      confidence: 0.65,
      guideRef: ref("Word Choice Rules", "Use active voice."),
      checklist: "clear",
      needsContext: true,
    }
  },
})

const FUTURE = /\b(\w+)\s+will\s+(appear|show up|be (?:shown|displayed|listed|visible|available))\b/i

export const futureTense = defineRule({
  id: "FUTURE_TENSE",
  on: ["helper_text", "empty_state", "body", "onboarding", "tooltip", "banner", "success", "notification"],
  check: ({ text }) => {
    const m = FUTURE.exec(text)
    if (!m) return
    const plural = /[^s]s$/i.test(m[1]!) && !/^(this|its|is|has|was)$/i.test(m[1]!)
    const verb = m[2]!.toLowerCase()
    const present = /^(appear|show up)$/.test(verb)
      ? plural ? verb : verb.replace(/^(\w+)/, "$1s")
      : /visible|available/.test(verb)
        ? `${plural ? "are" : "is"} ${verb.split(" ")[1]}`
        : plural ? "appear" : "appears"
    return {
      category: "language",
      severity: "low",
      title: "Future tense for product behavior",
      explanation: `Describe what the product does in the present tense: "${m[1]} ${present}" rather than "${m[0]}".`,
      confidence: 0.75,
      guideRef: ref("Core Principles", "Use present tense for product behavior."),
      checklist: "clear",
      patch: (s) => s.replace(FUTURE, (_, subj: string) => `${subj} ${present}`),
    }
  },
})

const NUMBER_RE = new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join("|")})\\b(?=\\s+[a-z])`, "gi")

export const writtenNumbers = defineRule({
  id: "WRITTEN_NUMBER",
  check: ({ text }) => {
    NUMBER_RE.lastIndex = 0
    const found = text.match(NUMBER_RE)
    if (!found) return
    return {
      category: "language",
      severity: "low",
      title: "Number written as a word",
      explanation: `Numerals scan faster in an interface: ${found.map((f) => `"${f}" → "${NUMBER_WORDS[f.toLowerCase()]}"`).join(", ")}.`,
      confidence: 0.85,
      guideRef: ref("Word Choice Rules", "Use numerals instead of written numbers."),
      checklist: "clear",
      patch: (s) => s.replace(NUMBER_RE, (m) => NUMBER_WORDS[m.toLowerCase()] ?? m),
      autoApplicable: true,
    }
  },
})

export const longSentence = defineRule({
  id: "LONG_SENTENCE",
  skip: ["alt_text"],
  check: ({ text }) => {
    const long = lines(text).flatMap(sentences).find((s) => words(s).length > 25)
    if (!long) return
    return {
      category: "ux_writing",
      severity: "medium",
      title: "Sentence carries too many ideas",
      explanation: `One sentence has ${words(long).length} words. Split it so each sentence carries one idea.`,
      confidence: 0.8,
      guideRef: ref("Word Choice Rules", "Avoid multiple ideas in one sentence."),
      checklist: "concise",
      needsContext: true,
    }
  },
})

export const myYourMixed = defineRule({
  id: "MY_YOUR_MIXED",
  check: ({ text }) => {
    if (!/\bmy\b/i.test(text) || !/\byour\b/i.test(text)) return
    return {
      category: "consistency",
      severity: "medium",
      title: "Mixes \"my\" and \"your\"",
      explanation: "Switching between \"my\" and \"your\" makes it unclear who is speaking. Pick one point of view.",
      confidence: 0.85,
      guideRef: ref("Word Choice Rules", "Avoid mixing “my” and “your”."),
      checklist: "consistent",
      patch: (s) => s.replace(/\bmy\b/gi, (m) => matchCase(m, "your")),
    }
  },
})

export const repeatedWord = defineRule({
  id: "REPEATED_WORD",
  check: ({ text }) => {
    const m = /\b(\w+)\s+\1\b/i.exec(text)
    if (!m || /^\d+$/.test(m[1]!)) return
    return {
      category: "language",
      severity: "high",
      title: "Repeated word",
      explanation: `"${m[0]}" repeats a word.`,
      confidence: 0.95,
      guideRef: ref("Core Principles", "Write simply."),
      checklist: "clear",
      patch: (s) => s.replace(/\b(\w+)\s+\1\b/gi, "$1"),
      autoApplicable: true,
    }
  },
})

export const punctuation = defineRule({
  id: "PUNCTUATION",
  check: ({ text, type }) => {
    const issues: string[] = []
    const t = text.trim()
    const trailingPeriod = SHORT_UI.includes(type) && /[^.]\.$/.test(t) && lines(t).length === 1 && sentences(t).length === 1
    if (trailingPeriod) issues.push("short UI labels don't end with a period")
    if (/[!?]{2,}/.test(t)) issues.push("use one punctuation mark, not several")
    if (/\.{3}/.test(t)) issues.push('use an ellipsis character ("…") instead of three periods')
    if (/[^\s] {2,}[^\s]/.test(t)) issues.push("remove the double space")
    if (issues.length === 0) return
    return {
      category: "language",
      severity: "low",
      title: "Punctuation",
      explanation: capitalize(`${issues.join("; ")}.`),
      confidence: 0.9,
      guideRef: ref("Component-Specific Rules", "Keep labels short and clean, as in the guide's examples."),
      checklist: "consistent",
      patch: (s) => {
        let out = s.replace(/([!?])[!?]+/g, "$1").replace(/\.{3}/g, "…").replace(/([^\s]) {2,}(?=[^\s])/g, "$1 ")
        if (trailingPeriod) out = out.trim().replace(/\.$/, "")
        return out
      },
      autoApplicable: true,
    }
  },
})

const CASE_TYPES = [...SHORT_UI, "snackbar", "empty_state", "error", "success", "banner", "dialog"] as const

export const capitalization = defineRule({
  id: "CAPITALIZATION",
  on: [...CASE_TYPES],
  check: ({ text, settings }) => {
    const [first = ""] = lines(text)
    if (!isTitleCase(first) || isAllCaps(first)) return
    const keep = (settings.terms ?? []).flatMap((t) => words(t.use))
    return {
      category: "consistency",
      severity: "low",
      title: "Title Case instead of sentence case",
      explanation: "Every example in the guide uses sentence case (\"Save changes\", \"Connect wallet\"). Keep capitals for the first word and proper nouns.",
      confidence: 0.7,
      guideRef: ref("Component-Specific Rules", "Sentence case, as in all of the guide's examples."),
      checklist: "consistent",
      patch: (s) => {
        const [head = "", ...rest] = s.split("\n")
        return [toSentenceCase(head, keep), ...rest].join("\n")
      },
    }
  },
})

export const allCaps = defineRule({
  id: "ALL_CAPS",
  skip: ["button", "tab", "label", "navigation"],
  check: ({ text }) => {
    if (!isAllCaps(text)) return
    return {
      category: "accessibility",
      severity: "medium",
      title: "All caps",
      explanation: "Long runs of capitals are harder to read, can come across as shouting, and some screen readers spell them out letter by letter.",
      confidence: 0.8,
      guideRef: ref("Accessibility Rules", "Always consider screen reader labels."),
      checklist: "accessible",
      patch: (s) => tidy(s.toLowerCase()),
    }
  },
})

export const altTextPrefix = defineRule({
  id: "ALT_TEXT_PREFIX",
  check: ({ text }) => {
    if (!ALT_PREFIX.test(text.trim())) return
    return {
      category: "accessibility",
      severity: "medium",
      title: "Alt text starts with \"Image of\"",
      explanation: "Screen readers already announce images. Describe the essential meaning directly.",
      confidence: 0.95,
      guideRef: ref("Accessibility Rules", "Alt text should describe the essential meaning without saying “image of” or “picture of”."),
      checklist: "accessible",
      patch: (s) => capitalize(s.trim().replace(ALT_PREFIX, "").replace(/^(a|an|the)\s+/i, "")),
      autoApplicable: true,
    }
  },
})

export const linkClarity = defineRule({
  id: "LINK_CLARITY",
  skip: ["button"],
  check: ({ text }) => {
    if (!LINK_VAGUE.test(text)) return
    return {
      category: "accessibility",
      severity: "medium",
      title: "\"Click here\" link",
      explanation: "Screen reader users often jump between links, so \"click here\" means nothing out of context. Make the link text name its destination.",
      confidence: 0.85,
      guideRef: ref("Accessibility Rules", "Link clarity."),
      checklist: "accessible",
      needsContext: true,
    }
  },
})

export const colorOnly = defineRule({
  id: "COLOR_ONLY",
  check: ({ text }) => {
    const m = COLOR_ONLY.exec(text)
    if (!m) return
    return {
      category: "accessibility",
      severity: "medium",
      title: "Meaning depends on color",
      explanation: `"${m[0]}" relies on color, which not everyone can see. Name the item or its state instead.`,
      confidence: 0.8,
      guideRef: ref("Accessibility Rules", "Color-independent meaning."),
      checklist: "accessible",
      needsContext: true,
    }
  },
})

export const directional = defineRule({
  id: "DIRECTIONAL_LANGUAGE",
  check: ({ text }) => {
    const m = DIRECTIONAL.exec(text)
    if (!m) return
    return {
      category: "accessibility",
      severity: "low",
      title: "Relies on screen position",
      explanation: `"${m[0]}" assumes a visual layout that changes across screen sizes and screen readers. Refer to the control by its visible label.`,
      confidence: 0.7,
      guideRef: ref("Core Principles", "Refer to UI controls by their visible label."),
      checklist: "accessible",
      needsContext: true,
    }
  },
})

export const characterLimit = defineRule({
  id: "CHARACTER_LIMIT",
  check: ({ node, text }) => {
    if (!node.maxCharacters || text.trim().length <= node.maxCharacters) return
    return {
      category: "product_ux",
      severity: "high",
      title: "Doesn't fit the space",
      explanation: `${text.trim().length} characters in a space that fits about ${node.maxCharacters}.`,
      confidence: 0.9,
      guideRef: ref("Word Choice Rules", "Avoid long explanations inside small components."),
      checklist: "concise",
      needsContext: true,
    }
  },
})

export const languageRules = [
  wordy,
  filler,
  fluff,
  jargon,
  passive,
  futureTense,
  writtenNumbers,
  longSentence,
  myYourMixed,
  repeatedWord,
  punctuation,
  capitalization,
  allCaps,
  altTextPrefix,
  linkClarity,
  colorOnly,
  directional,
  characterLimit,
]
