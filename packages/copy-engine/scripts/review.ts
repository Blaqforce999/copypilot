/**
 * Reviews one piece of copy from the command line.
 *
 *   npm run review -- "Something went wrong." --as error --context "Save changes"
 *
 * Use "\n" in the text to separate a title from its body.
 */
import { CHECKLIST, CONFIDENCE_THRESHOLD, reviewNode, type ComponentType } from "../src"

const args = process.argv.slice(2)
const flag = (name: string) => {
  const values: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === `--${name}` && args[i + 1]) values.push(args[++i]!)
  return values
}
const text = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"))
if (!text) {
  console.log('Usage: npm run review -- "<copy>" [--as error|button|...] [--context "<nearby text>"]...')
  process.exit(1)
}

const review = reviewNode({
  id: "cli",
  text: text.replace(/\\n/g, "\n"),
  componentType: flag("as")[0] as ComponentType | undefined,
  surroundingText: flag("context"),
})

const bar = "─".repeat(60)
console.log(`\n${bar}\n${review.node.text}\n${bar}`)
console.log(`Component: ${review.componentType}${review.componentInferred ? " (guessed from the text)" : ""}`)

if (review.findings.length === 0) {
  console.log("\nNo issues. This copy meets the guide.\n")
  process.exit(0)
}

console.log("\nIssues")
for (const f of review.findings) {
  const weak = f.confidence < CONFIDENCE_THRESHOLD ? "  (possible improvement)" : ""
  console.log(`  • [${f.severity}] ${f.title}${weak}`)
  console.log(`    ${f.explanation}`)
  console.log(`    Guide: ${f.guideRef.section}. ${f.guideRef.principle}`)
  if (f.alternatives?.length) console.log(`    Examples: ${f.alternatives.map((a) => JSON.stringify(a)).join(", ")}`)
}

if (review.suggestion) {
  console.log(`\nSuggested (${Math.round(review.confidence * 100)}% confidence)`)
  console.log(`  ${review.suggestion.replace(/\n/g, "\n  ")}`)
  if (review.validation && !review.validation.passed)
    console.log(`  ⚠ Can't be applied automatically: ${review.validation.reasons.join("; ")}`)
} else {
  console.log("\nNo automatic rewrite. The issues above need details only you know about the screen.")
}

const failed = Object.entries(review.checklist).filter(([, ok]) => !ok)
console.log(`\nGuide checklist: ${10 - failed.length}/10`)
for (const [k] of failed) console.log(`  ✗ ${CHECKLIST[k as keyof typeof CHECKLIST]}`)
console.log()
