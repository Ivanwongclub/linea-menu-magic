# e2e-local — real-write verification against a local Supabase stack

Typecheck and lint do not tell you whether a write reaches the database
correctly (the Phase 5 `id = null` insert bug passed both). This harness
stands up a disposable Supabase stack from the repo's own migrations, grants
a catalogue-editor account, runs the app against that stack, drives a real
browser through the `/admin` UI, and reads the result back with the service
role so scenarios can assert on what was actually stored.

## What it does

- `npm run e2e:up` — copies `supabase/` to a scratch directory
  (`$TMPDIR/linea-e2e-local`, override with `E2E_LOCAL_DIR`), slots the seed
  files from `seed/` into the migration order, runs `supabase start` and a
  forced `supabase db reset` (a plain `start` can silently restore a stale
  backup), writes `status.json`, and creates/grants the editor account
  `e2e-editor@local.test` / `E2eEditor!2026`.
- `npm run e2e:run -- scenarios/<name>.mjs` — boots `npm run dev` on port
  8080 (`E2E_PORT` to change) with `VITE_SUPABASE_URL`/`_PUBLISHABLE_KEY`
  pointed at the local stack, launches headless Chromium, runs the scenario,
  prints its return value as JSON (plus any browser console errors), and
  tears the dev server down. Exit code 1 and `last-failure.png` on failure.
  `E2E_VERBOSE=1` shows the dev server output.
- `npm run e2e:types` — regenerates `src/integrations/supabase/types.ts`
  from the running local stack, i.e. from the repo's migrations. Run it after
  adding a migration; it never talks to production.
- `npm run e2e:down` — `supabase stop --no-backup` and deletes the scratch
  directory.

The repo's `supabase/` directory is never touched, and nothing here ever
connects to production.

## `seed/` — why it exists

P20 found that the migrations folder alone cannot reconstruct production:
two `flipbook_brochures` rows were entered directly and a later migration
(`20260414175102_…`) assumes they exist, so a fresh replay fails there.
`seed/20260414175101_production_only_rows.sql` carries those rows and is
copied into the scratch migrations folder just ahead of that migration,
making the replay reproducible. It is not applied to production. If you
find another production-only dependency, add a `seed/<timestamp>_*.sql`
dated just before the migration that needs it.

## What it needs installed

- **Docker** (Supabase's local stack runs in containers).
- **Supabase CLI** via Homebrew: `brew install supabase/tap/supabase`. The
  npm-distributed `supabase` package is broken on darwin-arm64; the harness
  prefers `/opt/homebrew/bin/supabase` and falls back to `supabase` on PATH
  (`SUPABASE_BIN` overrides).
- **Node 18+** and `npm install` (brings `playwright` as a devDependency),
  then `npx playwright install chromium` once for the browser binary.

## Adding a scenario

Create `scenarios/<name>.mjs` exporting a default async function. It
receives one object:

| key | what it is |
|---|---|
| `page` | Playwright page, fresh context, not signed in |
| `base` | app URL, e.g. `http://localhost:8080` |
| `admin` | supabase-js client with the **service role** — bypasses RLS, use it to seed state and read back |
| `editor` | `{ email, password, userId }` of the catalogue-editor account |
| `status` | parsed `supabase status` output (API URL, keys) |
| `h` | helpers: `login(editor)`, `openProduct(id)`, `dismissCookies()`, `waitForToast(regex)`, `toasts()`, `selectOption(trigger, optionName)` |

Use `node:assert/strict` for assertions and return a small object that
summarises what was verified — it is printed on success.

```js
import assert from "node:assert/strict";

export default async function ({ page, admin, editor, h }) {
  const { data: product } = await admin.from("products").select("id").eq("slug", "sample-hook-and-loop").single();
  await h.login(editor);
  await h.openProduct(product.id);
  // ...drive the UI...
  await h.waitForToast(/Saved/);
  const { data } = await admin.from("some_table").select("*").eq("product_id", product.id);
  assert.equal(data.length, 1);
  return { rows: data.length };
}
```

Conventions worth knowing when writing selectors: the cookie banner is a
fixed `z-[200]` overlay on every route (`h.login` dismisses it); Radix
`Select`s are driven with `h.selectOption`; success and error messages are
sonner toasts (`[data-sonner-toast]`); reorderable lists respond to the
keyboard (focus the drag handle, Space, Arrow keys, Space).

## Scenarios

- `size-variants.mjs` — Phase 5 sizes: insert, upsert + insert batch, generated ligne.
- `colour-finish.mjs` — Phase 6 colours and finishes, including the three metal-gate trigger cases.
- `finish-picker-layout.mjs` — the attached list and default selector render below a viewport-bounded picker (regression for "nothing below the grid").
- `admin-i18n.mjs` — the CMS renders in the stored language and the header switcher changes it live.
- `finish-manager.mjs` — Phase 7: filtered bulk `is_public`, per-finish edit with locked identity, create with the standard/code rule, first-time code set then locked.
- `swatch-renderer.mjs` — the four nickels render on four branches of the material model (mirror / brushed / matt / sand); changing a surface axis in the manager recomputes roughness/anisotropy; hand-set values are respected until an axis changes.
- `seed-publish.mjs` — M4 Step 0: a placeholder seed publishes from the editor after a confirmation; bulk actions still skip seeds.
- `product-images.mjs` — Phase 8: multi-file upload through the dropzone (resized client-side, EXIF-safe), reorder, primary change, alt text, delete removes file and row; anonymous read sees the gallery.
- `finish-swatch.mjs` — Phase 8: upload a photographed swatch on a finish, it replaces the rendered material; remove clears the column and deletes the object.
- `product-language-tabs.mjs` — name/description under English / 繁體 / 简体 tabs, other fields always visible, header switcher leaves the active tab alone, trilingual read-back.
