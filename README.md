# CopyPilot

A Figma plugin that audits UX copy against the Material UX writing guide: vague buttons, errors without a next step, jargon, inconsistent terms and more. It suggests rewrites you can apply in place. Everything runs locally, with no AI service and no network access.

- **Try it in the browser:** the demo site shows the plugin panel working on a sample screen.
- **Use it in Figma:** `npm install && npm run build`, then in the Figma desktop app go to Plugins → Development → Import plugin from manifest… and pick `apps/plugin/manifest.json`.

## Layout

| Path | What it is |
|---|---|
| `packages/copy-engine` | The reviewer: rules, rewrites, validation, benchmark (`npm test`, `npm run bench`) |
| `apps/plugin` | The Figma plugin (`npm run build`, or `npm run dev` to rebuild on save) |
| `apps/web` | The demo site deployed to Vercel (`npm run build:web`) |
| `prd.md`, `architecture.md`, `build-plan.md` | Product docs and the build plan |

Try the reviewer from the terminal:

```
npm run review -- "Something went wrong." --as error --context "Save changes"
```
