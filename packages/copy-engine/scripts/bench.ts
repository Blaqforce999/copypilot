/** Scores the reviewer against the benchmark. Usage: npm run bench */
import { reviewNode } from "../src"
import { CASES } from "../test/cases"

let falsePositives = 0
let missed = 0
let rewritesRight = 0
let rewritesTotal = 0
const extra: string[] = []
const failures: string[] = []

for (const c of CASES) {
  const r = reviewNode({ id: "n", text: c.text, componentType: c.as, surroundingText: c.context })
  const fired = r.findings.map((f) => f.ruleId)
  const label = `${c.as}: ${JSON.stringify(c.text)}`
  if (c.expect === "pass") {
    if (fired.length) {
      falsePositives++
      failures.push(`False positive  ${label} → ${fired.join(", ")}`)
    }
  } else {
    const miss = c.expect.filter((id) => !fired.includes(id))
    missed += miss.length
    if (miss.length) failures.push(`Missed          ${label} → expected ${miss.join(", ")}`)
    const unexpected = fired.filter((id) => !(c.expect as string[]).includes(id))
    if (unexpected.length) extra.push(`${label} → also ${unexpected.join(", ")}`)
  }
  if (c.rewrite) {
    rewritesTotal++
    if (r.suggestion === c.rewrite && r.validation?.passed) rewritesRight++
    else failures.push(`Rewrite         ${label} → got ${JSON.stringify(r.suggestion)}, want ${JSON.stringify(c.rewrite)}`)
  }
}

const good = CASES.filter((c) => c.expect === "pass").length
const expectedHits = CASES.flatMap((c) => (c.expect === "pass" ? [] : c.expect)).length
const pct = (n: number, d: number) => `${d ? Math.round((n / d) * 100) : 100}%`

console.log(`\nMaterial UX writing guide benchmark: ${CASES.length} cases\n`)
console.log(`  Good copy left alone     ${good - falsePositives}/${good}  (${pct(good - falsePositives, good)})`)
console.log(`  Expected issues caught   ${expectedHits - missed}/${expectedHits}  (${pct(expectedHits - missed, expectedHits)})`)
console.log(`  Reference rewrites exact ${rewritesRight}/${rewritesTotal}  (${pct(rewritesRight, rewritesTotal)})`)
if (failures.length) console.log(`\nFailures\n  ${failures.join("\n  ")}`)
if (extra.length) console.log(`\nAdditional findings (not wrong, review for noise)\n  ${extra.join("\n  ")}`)
console.log()
process.exit(failures.length ? 1 : 0)
