# CopyPilot — Figma plugin

## Run it in Figma

1. From the project root, build once:
   ```
   npm install
   npm run build
   ```
   (`npm run dev` rebuilds on every save.)
2. In the **Figma desktop app**, open any design file.
3. Menu → **Plugins → Development → Import plugin from manifest…**
4. Choose `apps/plugin/manifest.json`.
5. Run it: **Plugins → Development → CopyPilot**.

After a rebuild, re-run the plugin to load the changes (⌥⌘P runs the last plugin).

## What to try

- Select a frame, then **Run audit**. Or switch the scope to **Current page**.
- Click a row to see the issues, the guide section each one comes from, and the suggested rewrite. Clicking also selects the layer in the canvas.
- **Apply** writes the text. ⌘Z in Figma undoes it.
- **Edit** lets you write your own version, checked against the guide as you type.
- **Rules** tab: add terms (`Log in -> Sign in`) and words to avoid, then re-run.

Quick test copy for a frame: a button "Submit", a text "Oops! Something went wrong." next to a "Save changes" button, a heading "Manage Your Account Settings", and a text "In order to utilize this feature, simply turn on sync."

## How it works

- `src/code.ts` runs in Figma's sandbox: it reads text layers (with nearby text as context), selects layers, and writes text (loading fonts first, and going through component properties when needed).
- `src/ui.ts` is the panel. It runs the review with `@copypilot/copy-engine`, the local reviewer built from the Material UX writing guide.
- No network access. The manifest declares `allowedDomains: ["none"]`.
- Rules are saved per user in `figma.clientStorage`.
