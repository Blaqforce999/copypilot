import { describe, expect, it } from "vitest"
import { reviewCopy, reviewNode } from "../src"
import { CASES } from "./cases"

describe("benchmark: Material UX writing guide", () => {
  for (const c of CASES) {
    const label = `[${c.source}] ${c.as}: ${JSON.stringify(c.text)}`
    it(label, () => {
      const review = reviewNode({ id: "n", text: c.text, componentType: c.as, surroundingText: c.context })
      const ruleIds = review.findings.map((f) => f.ruleId)
      if (c.expect === "pass") {
        expect(ruleIds).toEqual([])
      } else {
        for (const id of c.expect) expect(ruleIds).toContain(id)
      }
      if (c.rewrite) {
        expect(review.suggestion).toBe(c.rewrite)
        expect(review.validation?.passed).toBe(true)
      }
    })
  }
})

describe("audit-level consistency", () => {
  it("flags the less-used variant of a term", () => {
    const result = reviewCopy([
      { id: "a", text: "Sign in", componentType: "button" },
      { id: "b", text: "Sign in to continue", componentType: "heading" },
      { id: "c", text: "Log in", componentType: "button" },
    ])
    const hits = result.findings.filter((f) => f.ruleId === "INCONSISTENT_TERM")
    expect(hits.map((f) => f.nodeId)).toEqual(["c"])
    expect(hits[0]!.suggestion).toBe("Sign in")
  })

  it("uses the terms list over usage counts", () => {
    const result = reviewCopy(
      [
        { id: "a", text: "Sign in", componentType: "button" },
        { id: "b", text: "Log in", componentType: "button" },
      ],
      { terms: [{ insteadOf: ["sign in"], use: "Log in" }] },
    )
    const a = result.reviews.find((r) => r.node.id === "a")!
    expect(a.findings.map((f) => f.ruleId)).toEqual(["PREFERRED_TERM"])
    expect(a.suggestion).toBe("Log in")
    expect(result.findings.some((f) => f.ruleId === "INCONSISTENT_TERM")).toBe(false)
  })

  it("reports passed checklist items for a clean audit", () => {
    const result = reviewCopy([{ id: "a", text: "Save changes", componentType: "button" }])
    expect(result.findings).toEqual([])
    expect(result.passedChecks).toHaveLength(10)
  })
})

describe("validation", () => {
  it("blocks a rewrite that drops a placeholder", () => {
    const review = reviewNode({
      id: "n",
      text: "Something went wrong with {fileName}.",
      componentType: "error",
      surroundingText: ["Upload"],
    })
    expect(review.suggestion).toBeDefined()
    expect(review.validation?.passed).toBe(false)
    expect(review.validation?.reasons.join()).toContain("{fileName}")
  })

  it("blocks a rewrite longer than the space", () => {
    const review = reviewNode({
      id: "n",
      text: "Something went wrong.",
      componentType: "error",
      surroundingText: ["Save changes"],
      maxCharacters: 30,
    })
    expect(review.validation?.passed).toBe(false)
  })
})
