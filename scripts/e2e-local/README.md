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
