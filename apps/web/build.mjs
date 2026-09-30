// Assembles the demo site: the sample screen + the real plugin UI (apps/plugin/dist/ui.html).
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"

const here = new URL(".", import.meta.url)
const out = new URL("dist/", here)
await mkdir(out, { recursive: true })

const repo = process.env.REPO_URL ?? "https://github.com/Blaqforce999/copypilot"
const html = (await readFile(new URL("src/index.html", here), "utf8"))
  .replace("<head>", `<head>\n    <meta name="repo" content="${repo}" />`)
  .replace('href="https://github.com/"', `href="${repo}"`)
await writeFile(new URL("index.html", out), html)
await copyFile(new URL("src/demo.css", here), new URL("demo.css", out))
await copyFile(new URL("src/demo.js", here), new URL("demo.js", out))
await copyFile(new URL("../plugin/dist/ui.html", here), new URL("plugin.html", out))
console.log("Demo site built in apps/web/dist")
