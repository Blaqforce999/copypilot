import type { ComponentType } from "../src/types"

export type BenchmarkCase = {
  text: string
  as: ComponentType
  context?: string[]
  /** "pass" = the reviewer must not flag it. Otherwise, rule IDs that must fire. */
  expect: "pass" | string[]
  /** Exact combined rewrite expected, when the source gives one. */
  rewrite?: string
  source: "ux-writing skill" | "PRD" | "extra"
}

/**
 * Good copy the guide itself holds up as examples must pass untouched.
 * Bad copy the guide or PRD calls out must be flagged, with the PRD's rewrites reproduced.
 */
export const CASES: BenchmarkCase[] = [
  // ── Good examples from the ux-writing skill ──────────────────────────────
  { source: "ux-writing skill", as: "button", text: "Continue", expect: "pass" },
  { source: "ux-writing skill", as: "button", text: "Save changes", expect: "pass" },
  { source: "ux-writing skill", as: "button", text: "Connect wallet", expect: "pass" },
  { source: "ux-writing skill", as: "button", text: "Review order", expect: "pass" },
  { source: "ux-writing skill", as: "button", text: "Keep waiting", expect: "pass" },
  { source: "ux-writing skill", as: "button", text: "Cancel transaction", expect: "pass" },
  { source: "ux-writing skill", as: "label", text: "Recipient address", expect: "pass" },
  { source: "ux-writing skill", as: "label", text: "Network", expect: "pass" },
  { source: "ux-writing skill", as: "label", text: "Amount", expect: "pass" },
  { source: "ux-writing skill", as: "onboarding", text: "Set up your workspace\nAdd your first project to start tracking work.", expect: "pass" },
  { source: "ux-writing skill", as: "empty_state", text: "No transactions yet\nYour completed swaps appear here.", expect: "pass" },
  { source: "ux-writing skill", as: "empty_state", text: "No saved recipients\nSave an address to send faster next time.", expect: "pass" },
  { source: "ux-writing skill", as: "success", text: "Swap completed\nYour tokens are now in your wallet.", expect: "pass" },
  { source: "ux-writing skill", as: "error", text: "Transaction failed\nYour funds are safe. Try again or choose another route.", expect: "pass" },
  { source: "ux-writing skill", as: "error", text: "Wallet connection failed\nCheck your wallet and try again.", expect: "pass" },
  { source: "ux-writing skill", as: "dialog", text: "Delete this project?\nThis removes the project and its saved settings. You can’t undo this.", expect: "pass" },
  { source: "ux-writing skill", as: "dialog", text: "Cancel transaction?\nYou’ll need to start again if you leave now.", expect: "pass" },
  { source: "ux-writing skill", as: "loading", text: "Finding the best route…\nThis may take a few seconds.", expect: "pass" },
  { source: "ux-writing skill", as: "snackbar", text: "Address copied", expect: "pass" },
  { source: "ux-writing skill", as: "banner", text: "Network congestion detected\nSwaps on Base may take longer than usual.", expect: "pass" },
  { source: "ux-writing skill", as: "tooltip", text: "Slippage is the allowed price change before your swap fails.", expect: "pass" },
  { source: "ux-writing skill", as: "alt_text", text: "Dashboard showing weekly trading volume", expect: "pass" },

  // ── Bad examples the ux-writing skill calls out ──────────────────────────
  { source: "ux-writing skill", as: "button", text: "Submit", expect: ["VAGUE_CTA"] },
  { source: "ux-writing skill", as: "button", text: "Okay", expect: ["VAGUE_CTA"] },
  { source: "ux-writing skill", as: "button", text: "Proceed", expect: ["VAGUE_CTA"] },
  { source: "ux-writing skill", as: "button", text: "Click here", expect: ["VAGUE_CTA"] },
  { source: "ux-writing skill", as: "alt_text", text: "Image of a dashboard showing sales", expect: ["ALT_TEXT_PREFIX"], rewrite: "Dashboard showing sales" },
  { source: "ux-writing skill", as: "body", text: "Complete my profile to see your matches.", expect: ["MY_YOUR_MIXED"], rewrite: "Complete your profile to see your matches." },
  { source: "ux-writing skill", as: "body", text: "You have three days left.", expect: ["WRITTEN_NUMBER"], rewrite: "You have 3 days left." },
  { source: "ux-writing skill", as: "empty_state", text: "Your reports will appear here.", expect: ["FUTURE_TENSE", "EMPTY_STATE_INCOMPLETE"] },
  { source: "ux-writing skill", as: "error", text: "Oops! Payment failed.", expect: ["ERROR_TONE", "ERROR_NO_NEXT_STEP"] },
  { source: "ux-writing skill", as: "dialog", text: "Delete account?\nAre you sure you want to delete your account?", expect: ["DESTRUCTIVE_NO_CONSEQUENCE"] },
  { source: "ux-writing skill", as: "body", text: "Fields in red are required.", expect: ["COLOR_ONLY"] },
  { source: "ux-writing skill", as: "body", text: "The user must execute the sync before continuing.", expect: ["JARGON"] },
  { source: "ux-writing skill", as: "onboarding", text: "Our powerful, seamless platform helps you do more.", expect: ["MARKETING_FLUFF"] },
  { source: "ux-writing skill", as: "snackbar", text: "Your file has been uploaded to the server and is now available for everyone in your workspace to view.", expect: ["SNACKBAR_TOO_LONG"] },

  // ── PRD examples ────────────────────────────────────────────────────────
  {
    source: "PRD", as: "error", text: "Your request could not be processed.",
    context: ["Profile settings", "Save changes"],
    expect: ["ERROR_GENERIC", "ERROR_NO_NEXT_STEP"],
    rewrite: "We couldn't save your changes. Check your connection and try again.",
  },
  {
    source: "PRD", as: "error", text: "Oops! Something went wrong. Please try again.",
    context: ["Save changes"],
    expect: ["ERROR_GENERIC", "ERROR_TONE"],
    rewrite: "We couldn't save your changes. Please try again.",
  },
  {
    source: "PRD", as: "error", text: "Something went wrong.",
    context: ["Save changes", "Profile settings"],
    expect: ["ERROR_GENERIC", "ERROR_NO_NEXT_STEP"],
    rewrite: "We couldn't save your changes. Check your connection and try again.",
  },
  { source: "PRD", as: "error", text: "Your payment was unable to be processed successfully.", context: ["Checkout"], expect: ["ERROR_GENERIC"], rewrite: "We couldn't process your payment. Check your card details and try again." },
  { source: "PRD", as: "button", text: "Next", context: ["Payment details"], expect: ["VAGUE_CTA"], rewrite: "Continue to payment" },
  { source: "PRD", as: "body", text: "In order to utilize this feature, simply turn on sync.", expect: ["WORDY_PHRASE", "FILLER_WORD"], rewrite: "To use this feature, turn on sync." },
  { source: "PRD", as: "body", text: "Oops, we just need you to confirm your email.", expect: ["FILLER_WORD"] },
  { source: "PRD", as: "body", text: "Log in to continue.", expect: "pass" },

  // ── Extra coverage ──────────────────────────────────────────────────────
  { source: "extra", as: "dialog_title", text: "Are you sure?", context: ["Delete project"], expect: ["DIALOG_VAGUE_TITLE"], rewrite: "Delete project?" },
  { source: "extra", as: "dialog", text: "Are you sure?\nDo you want to remove this member?", expect: ["DIALOG_VAGUE_TITLE", "DESTRUCTIVE_NO_CONSEQUENCE"] },
  { source: "extra", as: "empty_state", text: "No data", expect: ["EMPTY_STATE_INCOMPLETE"] },
  { source: "extra", as: "success", text: "Your changes have been saved successfully!", expect: ["SUCCESS_VERBOSE"], rewrite: "Changes saved" },
  { source: "extra", as: "heading", text: "Manage Your Account Settings", expect: ["CAPITALIZATION"], rewrite: "Manage your account settings" },
  { source: "extra", as: "button", text: "Save changes.", expect: ["PUNCTUATION"], rewrite: "Save changes" },
  { source: "extra", as: "body", text: "Please review the the details below.", expect: ["REPEATED_WORD", "DIRECTIONAL_LANGUAGE"] },
  { source: "extra", as: "error", text: "ERROR: CONNECTION TIMEOUT", expect: ["ALL_CAPS", "JARGON", "ERROR_NO_NEXT_STEP"] },
  { source: "extra", as: "error", text: "Invalid input", context: ["Sign in"], expect: ["ERROR_GENERIC"] },
  { source: "extra", as: "body", text: "To learn more, click here.", expect: ["LINK_CLARITY"] },
  { source: "extra", as: "button", text: "Click to download your monthly statement now", expect: ["BUTTON_TOO_LONG"] },
  { source: "extra", as: "button", text: "Settings", expect: ["CTA_NOT_VERB_FIRST"] },
  { source: "extra", as: "button", text: "Got it", expect: "pass" },
  { source: "extra", as: "button", text: "Sign in", expect: "pass" },
  { source: "extra", as: "heading", text: "Profile settings", expect: "pass" },
  { source: "extra", as: "error", text: "We couldn't save your changes. Check your connection and try again.", expect: "pass" },
  { source: "extra", as: "body", text: "No one else can see this.", expect: "pass" },
  { source: "extra", as: "helper_text", text: "Email is required.", expect: "pass" },
  { source: "extra", as: "body", text: "Your password must be at least 8 characters.", expect: "pass" },
]
