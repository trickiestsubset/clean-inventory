# Clean Inventory

A single-file inventory web app for tracking parts across shelf/bin locations via QR codes.

- Live version: published as a Claude artifact, backed by a shared realtime database (locations, parts, inventory collections) so everyone sees the same data.
- `index.html` here is the same app. Opened directly (double-click, or any static file server) it falls back to a browser-local store (localStorage) instead of the shared database — data won't sync between devices/browsers in that mode.
- The QR scan button uses the camera (`getUserMedia`), which most browsers only allow over HTTPS or `localhost` — it may not work when opened as a plain `file://` page. Serve it locally (e.g. `npx serve .`) to test scanning outside the hosted artifact.

Previous history: this repo used to hold a Next.js + Supabase implementation of the same idea. Those files were moved to `_to_delete/` and are not tracked by git — delete that folder yourself when you're ready (Claude's session here doesn't have permission to remove files on this machine).
