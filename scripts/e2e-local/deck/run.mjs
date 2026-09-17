// Deck screenshots — not part of the test suite.
//   npm run deck:shots            (needs `npm run e2e:up` first)
//
// Boots the app against the local stack, stages the data the shots need,
// drives the real UI and writes PNGs to reports/deck/ at 1440 × 900, device
// scale 2, English, with all chrome visible (never `?calibration=1`).
// Everything it stages is restored afterwards.
import { spawn } from "node:child_process";
import path from "node:path";
import { mkdirSync, rmSync } from "node:fs";
import { chromium } from "playwright";
import { REPO_ROOT, readStatus, adminClient, ensureEditor } from "../lib/stack.mjs";
import { helpers } from "../lib/browser.mjs";
import takeShots from "./shots.mjs";

const PORT = Number(process.env.E2E_PORT || 8080);
const base = `http://localhost:${PORT}`;
const outDir = path.join(REPO_ROOT, "reports/deck");

const st = readStatus();
const admin = adminClient(st);
const editor = await ensureEditor(admin);

const dev = spawn("npm", ["run", "dev", "--", "--port", String(PORT), "--strictPort"], {
  cwd: REPO_ROOT,
  env: {
    ...process.env,
    VITE_SUPABASE_URL: st.API_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: st.ANON_KEY,
    VITE_SUPABASE_IMAGE_TRANSFORMS: "false",
  },
  stdio: process.env.E2E_VERBOSE ? "inherit" : "ignore",
  detached: true,
});
const killDev = () => {
  try {
    process.kill(-dev.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
};
process.on("exit", killDev);

const deadline = Date.now() + 60000;
while (Date.now() < deadline) {
  try {
    const r = await fetch(base);
    if (r.ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 500));
}

mkdirSync(outDir, { recursive: true });
// A failure shot from a previous run is not part of the deck.
rmSync(path.join(outDir, "deck-failure.png"), { force: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: "en-GB",
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));
page.on("pageerror", (err) => consoleErrors.push(String(err)));

let exitCode = 0;
try {
  const result = await takeShots({ page, base, admin, editor, status: st, h: helpers(page, base), outDir });
  console.log(JSON.stringify({ ok: true, result, consoleErrors: consoleErrors.slice(0, 5) }, null, 2));
} catch (err) {
  exitCode = 1;
  console.log(JSON.stringify({ ok: false, error: String(err?.stack || err), consoleErrors: consoleErrors.slice(0, 5) }, null, 2));
  await page.screenshot({ path: path.join(outDir, "deck-failure.png"), fullPage: false }).catch(() => {});
} finally {
  await browser.close();
  killDev();
}
process.exit(exitCode);
