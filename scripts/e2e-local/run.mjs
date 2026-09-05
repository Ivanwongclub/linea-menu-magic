// Usage: node scripts/e2e-local/run.mjs scenarios/<name>.mjs
// Boots the app against the local stack, drives a scenario through a real
// browser, and prints what the scenario returns. Non-zero exit on failure.
import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { REPO_ROOT, readStatus, adminClient, ensureEditor } from "./lib/stack.mjs";
import { helpers } from "./lib/browser.mjs";

const scenarioArg = process.argv[2];
if (!scenarioArg) {
  console.error("Usage: node scripts/e2e-local/run.mjs scenarios/<name>.mjs");
  process.exit(2);
}
const PORT = Number(process.env.E2E_PORT || 8080);
const base = `http://localhost:${PORT}`;

const st = readStatus();
const admin = adminClient(st);
const editor = await ensureEditor(admin);

// Dev server against the LOCAL stack — process env beats .env in Vite.
const dev = spawn("npm", ["run", "dev", "--", "--port", String(PORT), "--strictPort"], {
  cwd: REPO_ROOT,
  env: {
    ...process.env,
    VITE_SUPABASE_URL: st.API_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: st.ANON_KEY,
    // The local stack's imgproxy isn't running, so render/image URLs 404 here.
    // Serve masters directly; the transform path is a production check.
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

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await (await browser.newContext()).newPage();
const consoleErrors = [];
page.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));
page.on("pageerror", (err) => consoleErrors.push(String(err)));

let exitCode = 0;
try {
  const mod = await import(pathToFileURL(path.resolve(REPO_ROOT, "scripts/e2e-local", scenarioArg)).href);
  const result = await mod.default({ page, base, admin, editor, status: st, h: helpers(page, base) });
  console.log(JSON.stringify({ ok: true, result, consoleErrors }, null, 2));
} catch (err) {
  exitCode = 1;
  console.log(JSON.stringify({ ok: false, error: String(err?.stack || err), consoleErrors }, null, 2));
  await page.screenshot({ path: path.join(REPO_ROOT, "scripts/e2e-local/last-failure.png"), fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  killDev();
}
process.exit(exitCode);
