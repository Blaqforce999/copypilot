/**
 * Knowledge encoded from the ux-writing skill (~/.claude/skills/ux-writing/SKILL.md),
 * which uses Google Material communication guidance as its reference standard.
 * Every rule in ./rules points back to one of these sections.
 */
import type { ChecklistKey, GuideRef } from "./types"

export const GUIDE_NAME = "Material UX writing guide"

export const CHECKLIST: Record<ChecklistKey, string> = {
  task: "Helps the user complete a task",
  clear: "Clear without extra explanation",
  concise: "Concise without sounding robotic",
  tone: "Tone fits the state",
  familiar: "Uses familiar words",
  jargon: "Avoids unnecessary jargon",
  consistent: "Uses consistent terminology",
  consequences: "Explains consequences when needed",
  next_step: "Tells the user what to do next",
  accessible: "Accessible",
}

export const ref = (section: string, principle: string): GuideRef => ({ section, principle })

// ─── Buttons ────────────────────────────────────────────────────────────────

/** "Avoid vague labels" (plus close relatives). Matched against the whole label. */
export const VAGUE_CTAS = ["submit", "okay", "ok", "proceed", "click here", "tap here", "click", "yes", "no", "go"]

/** Acceptable but weak; flagged only when the screen suggests something more specific. */
export const SOFT_CTAS = ["next"]

/** Navigation and dismissal labels that are fine without a leading verb. */
export const ALLOWED_LABELS = [
  "next", "back", "done", "cancel", "close", "skip", "got it", "not now", "maybe later",
  "no thanks", "later", "all set",
]

export const ACTION_VERBS = new Set([
  "accept", "add", "allow", "apply", "approve", "archive", "ask", "book", "browse", "buy",
  "call", "cancel", "change", "check", "choose", "claim", "clear", "close", "compare",
  "complete", "confirm", "connect", "contact", "continue", "copy", "create", "customize",
  "decline", "delete", "deny", "deposit", "disable", "disconnect", "discard", "dismiss",
  "download", "duplicate", "edit", "enable", "end", "enter", "explore", "export", "filter",
  "find", "finish", "follow", "get", "give", "go", "hide", "import", "install", "invite",
  "join", "keep", "leave", "learn", "let", "link", "load", "log", "manage", "mark", "move",
  "mute", "open", "order", "pause", "pay", "pin", "place", "play", "post", "preview",
  "print", "publish", "read", "record", "redeem", "refresh", "reject", "reload", "remind",
  "remove", "rename", "renew", "reply", "report", "request", "resend", "reset", "restart",
  "restore", "resume", "retry", "return", "review", "save", "schedule", "search", "see",
  "select", "send", "set", "share", "show", "sign", "sort", "start", "stay", "stop",
  "subscribe", "swap", "switch", "sync", "take", "tell", "transfer", "try", "turn", "undo",
  "unlock", "unsubscribe", "update", "upgrade", "upload", "use", "verify", "view", "visit",
  "watch", "withdraw", "write",
])

// ─── Error messages ─────────────────────────────────────────────────────────

/** Messages that don't say what happened. */
export const GENERIC_ERRORS: RegExp[] = [
  /something (went|has gone) wrong/i,
  /\ban? (unknown |unexpected )?error (has )?occurred\b/i,
  /\bunknown error\b/i,
  /^(an? )?error[.!]*$/i,
  /\b(could not|couldn[’']t|can ?not|was unable to|were unable to) be (processed|completed)\b/i,
  /\bunable to (be )?process/i,
  /^(request|operation|action|process) failed[.!]*$/i,
  /^failed[.!]*$/i,
  /^invalid( input| value| data)?[.!]*$/i,
]

/** A sentence starting with one of these verbs (optionally after "Please") is a next step. */
export const NEXT_STEP_VERBS = new Set([
  "try", "check", "contact", "choose", "select", "enter", "update", "refresh", "reload",
  "retry", "go", "sign", "log", "wait", "use", "add", "make", "verify", "confirm",
  "reconnect", "restart", "allow", "turn", "enable", "review", "call", "email", "visit",
  "remove", "free", "upgrade", "reset", "open", "save", "fix", "ask", "connect", "install",
])
/** Next-step phrases that can appear mid-sentence. */
export const NEXT_STEP_PHRASE = /\b(try again|contact (us|support)|go to|you can (try|retry|check|change|update|contact))\b/i

/** "Avoid cleverness in critical moments." */
export const PLAYFUL = /\b(oops|whoops|uh[- ]oh|yikes|oh no|d['’]oh|oh snap|aw snap)\b[!.,]*\s*/gi

// ─── Dialogs ────────────────────────────────────────────────────────────────

export const DESTRUCTIVE =
  /\b(delete|remove|erase|discard|deactivate|reset|revoke|disconnect|leave|clear|cancel (?:(?:your|the|this) )?(?:subscription|order|plan|transaction|membership|account))\b/i

export const CONSEQUENCE =
  /(can[’']?t|cannot|won[’']?t be able to) (be )?(undo|undone|recover|reversed|restore)|\bpermanent|\birreversib|\byou[’']?ll lose\b|\bwill lose\b|\bthis (will )?(permanently )?(removes?|deletes?|erases?|clears?|cancels?)\b|\byou[’']?ll need to\b|\bno longer\b|\bwill be (deleted|removed|lost|erased)\b/i

export const VAGUE_DIALOG_TITLE =
  /^(are you sure\??|warning!*|confirm(ation)?\??|attention!*|alert!*|notice|important!*|heads up!*)$/i

// ─── Empty states ───────────────────────────────────────────────────────────

export const VAGUE_EMPTY = /^(no (data|results|items|content|records|entries)( found| available)?|nothing (here|to show|found|yet)|empty|n\/a|none)[.!]*$/i

// ─── Word choice ────────────────────────────────────────────────────────────

/** Wordy phrase → plain replacement ("Use common words", "Be concise"). */
export const WORDY: Array<[RegExp, string]> = [
  [/\bin order to\b/gi, "to"],
  [/\butilizes\b/gi, "uses"],
  [/\butilized\b/gi, "used"],
  [/\butilizing\b/gi, "using"],
  [/\butilize\b/gi, "use"],
  [/\bat this (point in )?time\b/gi, "now"],
  [/\bprior to\b/gi, "before"],
  [/\bin the event that\b/gi, "if"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\b(is|are) able to\b/gi, "can"],
  [/\bplease note that\s*/gi, ""],
  [/\bmake a decision\b/gi, "decide"],
  [/\bwith regards? to\b/gi, "about"],
  [/\bcommence\b/gi, "start"],
  [/\bterminate\b/gi, "end"],
  [/\bassistance\b/gi, "help"],
  [/\bsubsequently\b/gi, "then"],
  [/\bin the near future\b/gi, "soon"],
]

/** "Avoid marketing fluff." Removable filler first; the rest needs a rewrite. */
export const FILLER = /\b(simply|just|easily|basically|actually)\s+(?!now\b)/gi
export const FLUFF =
  /\b(seamless(ly)?|effortless(ly)?|powerful|robust|cutting[- ]edge|revolutionary|best[- ]in[- ]class|world[- ]class|amazing|awesome|incredibl[ey]|game[- ]chang(er|ing)|leverage|synerg(y|ies)|hassle[- ]free|next[- ]gen(eration)?)\b/i

/** Internal or technical terms → plain language (null = explain, no automatic swap). */
export const JARGON: Array<[RegExp, string | null, string]> = [
  [/\bthe user\b/gi, "you", "the user"],
  [/\binvalid input\b/gi, null, "invalid input"],
  [/\bparameters?\b/gi, null, "parameter"],
  [/\bnull\b/gi, null, "null"],
  [/\bexceptions?\b/gi, null, "exception"],
  [/\bfatal error\b/gi, null, "fatal error"],
  [/\bserver error\b/gi, null, "server error"],
  [/\bbackend\b/gi, null, "backend"],
  [/\bpayload\b/gi, null, "payload"],
  [/\btimed out\b/gi, "took too long", "timed out"],
  [/\btimeout\b/gi, null, "timeout"],
  [/\bauthenticate\b/gi, "sign in", "authenticate"],
  [/\bauthentication\b/gi, "sign-in", "authentication"],
  [/\bexecute\b/gi, "run", "execute"],
  [/\babort(ed)?\b/gi, null, "abort"],
  [/\binitiali[sz]e\b/gi, "set up", "initialize"],
  [/\binstantiate\b/gi, null, "instantiate"],
  [/\berror code\b/gi, null, "error code"],
  [/\b(HTTP|4\d\d|5\d\d)\b/g, null, "status code"],
]

export const NUMBER_WORDS: Record<string, string> = {
  two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
}

/** Terms that often get mixed within one product. First entry is the default preference. */
export const SYNONYM_GROUPS: string[][] = [
  ["sign in", "log in", "login", "log on", "sign on"],
  ["sign out", "log out", "logout"],
  ["sign up", "register", "create account", "create an account"],
  ["email", "e-mail"],
  ["username", "user name"],
  ["password", "passcode"],
  ["wi-fi", "wifi"],
  ["ok", "okay"],
]

// ─── Accessibility ──────────────────────────────────────────────────────────

export const ALT_PREFIX = /^(an? )?(image|picture|photo|graphic|icon|screenshot) (of|showing)\s+/i
export const LINK_VAGUE = /\b(click|tap) here\b/i
export const COLOR_ONLY =
  /\b(in|marked|highlighted in|shown in) (red|green|blue|orange|yellow|gr[ae]y)\b|\b(red|green|orange|yellow) (fields?|items?|text|buttons?|icons?|dots?)\b/i
export const DIRECTIONAL = /\b(see|click|tap|use) (the )?(below|above)\b|\bon the (left|right)\b|\b(below|above)[.:]?\s*$/im

// ─── Context → specific copy ────────────────────────────────────────────────

export type ActionHint = {
  match: RegExp
  /** Completes "We couldn't …". */
  failed: string
  recovery: string
  cta: string
}

/** Used to make errors and CTAs specific ("Communicate essential details"). Order = priority. */
export const ACTION_HINTS: ActionHint[] = [
  { match: /\bpay(ment|ing)?\b|\bcheckout\b|\bcard\b|\bbilling\b/i, failed: "process your payment", recovery: "Check your card details and try again.", cta: "Continue to payment" },
  { match: /\bwallet\b/i, failed: "connect your wallet", recovery: "Check your wallet and try again.", cta: "Connect wallet" },
  { match: /\bupload/i, failed: "upload your file", recovery: "Check the file size and try again.", cta: "Upload file" },
  { match: /\bsign(ing)? in\b|\blog(ging)? ?in\b|\bpassword\b/i, failed: "sign you in", recovery: "Check your email and password and try again.", cta: "Sign in" },
  { match: /\bsign(ing)? up\b|\bcreate (an |your )?account\b|\bregist/i, failed: "create your account", recovery: "Try again.", cta: "Create account" },
  { match: /\bsend(ing)?\b|\bmessage\b/i, failed: "send your message", recovery: "Check your connection and try again.", cta: "Send message" },
  { match: /\bdownload/i, failed: "download the file", recovery: "Check your connection and try again.", cta: "Download" },
  { match: /\bsav(e|ing)\b|\bchanges\b|\bsettings\b|\bprofile\b/i, failed: "save your changes", recovery: "Check your connection and try again.", cta: "Save changes" },
  { match: /\bdelet/i, failed: "delete this item", recovery: "Try again.", cta: "Delete" },
  { match: /\bsearch/i, failed: "complete your search", recovery: "Try again.", cta: "Search" },
  { match: /\bshipping\b|\baddress\b/i, failed: "save your address", recovery: "Check the address and try again.", cta: "Continue to shipping" },
  { match: /\breview\b|\bcart\b|\border\b/i, failed: "place your order", recovery: "Try again.", cta: "Review order" },
  { match: /\bload(ing)?\b|\bpage\b|\bfeed\b/i, failed: "load this page", recovery: "Refresh the page and try again.", cta: "Refresh" },
  { match: /\bconnect(ion)?\b|\bnetwork\b|\boffline\b|\binternet\b/i, failed: "connect", recovery: "Check your internet connection and try again.", cta: "Try again" },
]
