// Builds dist/code.js (Figma sandbox) and dist/ui.html (single file, as Figma requires).
import * as esbuild from "esbuild"
import { mkdir, readFile, writeFile } from "node:fs/promises"

const watch = process.argv.includes("--watch")
await mkdir("dist", { recursive: true })

const inlineUi = {
  name: "inline-ui",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length) return
      const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text
      const css = await readFile("src/ui.css", "utf8")
      const html = (await readFile("src/ui.html", "utf8"))
        .replace("/*CSS*/", css)
        .replace("/*JS*/", () => js.replace(/<\/script/g, "<\\/script"))
      await writeFile("dist/ui.html", html)
      console.log(`ui.html built ${new Date().toLocaleTimeString()}`)
    })
  },
}

const code = await esbuild.context({
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017",
  format: "iife",
  logLevel: "info",
})
const ui = await esbuild.context({
  entryPoints: ["src/ui.ts"],
  bundle: true,
  write: false,
  outfile: "dist/ui.js",
  target: "es2020",
  format: "iife",
  plugins: [inlineUi],
  logLevel: "info",
})

if (watch) {
  await code.watch()
  await ui.watch()
  console.log("Watching. Re-run the plugin in Figma to pick up changes.")
} else {
  await code.rebuild()
  await ui.rebuild()
  await code.dispose()
  await ui.dispose()
}
