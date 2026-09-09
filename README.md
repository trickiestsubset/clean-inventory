# Clean Inventory

A single-file inventory web app for tracking parts across shelf/bin locations via QR codes.

- **Data**: backed by Supabase (Postgres + Realtime). Run `supabase-schema.sql` once in your
  project's SQL Editor to create the `locations`, `parts`, and `inventory` tables, RLS
  policies, and realtime publication. The project URL and anon/publishable key are embedded
  directly in `index.html` (normal for Supabase's public anon key model, as long as RLS is
  configured — see the note in the schema file about the passcode gate not being real auth).
- **Hosting**: `index.html` is fully static — open it directly, serve it from any static host,
  or enable GitHub Pages on this repo (Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`).
- **QR scanning**: the "Scan location" button uses the camera (`getUserMedia`), which most
  browsers only allow over HTTPS or `localhost` — it won't work opened as a plain `file://` page.
  A manual code-entry fallback is built into the same modal.
- If the Supabase client library fails to load (offline, CDN blocked), the app falls back to a
  browser-local store (localStorage) for that one device only — not shared, just keeps the app usable.
