# Terrador Control Center

Local-only D&D DM control app built with Next.js 16 (App Router), React 19,
TypeScript, and Tailwind CSS 4. See `README.md` for full usage.

## Cursor Cloud specific instructions

- This is a fully client-side app: **no backend, database, auth, or network
  sync**. Cross-window state is coordinated via the browser `BroadcastChannel`
  API and persisted in `localStorage` (key `terrador-control-center-state-v1`).
  There are no API routes and no environment variables to configure.
- Standard commands live in `package.json`: `npm run dev` (port 3000),
  `npm run build`, `npm run start`, `npm run lint`.
- Routes: `/dm` is the DM control panel; the display windows are
  `/display/player-art`, `/display/battle-map`, and `/display/secondary`.
- To exercise cross-window sync in one browser, open `/dm` in one tab and a
  `/display/*` page in another tab; activating a scene / toggling a layer in
  `/dm` updates the display tab live via `BroadcastChannel`.
- Scene/overlay images go in `public/scenes/` and `public/overlays/`. These
  folders may be empty; missing images render a styled placeholder, so an empty
  `public/` does not block running or testing the app.
- Gotcha: after editing `app/globals.css`, the long-running `next dev`
  (Turbopack) server can keep serving a stale CSS chunk, so new/renamed CSS
  classes silently don't apply in the browser (JS/TSX changes still hot-reload
  fine). If CSS edits don't show up, restart the dev server (a clean `rm -rf
  .next` before restart is the reliable fix). `npm run build` always reflects
  the current CSS, so use it to confirm a CSS issue is environment-only.
