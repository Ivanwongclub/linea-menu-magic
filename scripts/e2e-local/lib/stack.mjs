// Local Supabase stack lifecycle for the e2e harness.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, cpSync, rmSync, readdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const WORK_DIR = process.env.E2E_LOCAL_DIR || path.join(tmpdir(), "linea-e2e-local");
const SEED_DIR = path.join(REPO_ROOT, "scripts/e2e-local/seed");
const STATUS_PATH = path.join(WORK_DIR, "status.json");

// The npm-distributed `supabase` wrapper is broken on darwin-arm64; prefer the
// Homebrew binary when present. Override with SUPABASE_BIN.
export const SUPABASE_BIN =
  process.env.SUPABASE_BIN || (existsSync("/opt/homebrew/bin/supabase") ? "/opt/homebrew/bin/supabase" : "supabase");

function sb(args, opts = {}) {
  return execFileSync(SUPABASE_BIN, args, { cwd: WORK_DIR, stdio: opts.capture ? "pipe" : "inherit", encoding: "utf8" });
}

/** Fresh scratch copy of supabase/ with the production-only seed rows slotted into the migration order. */
export function prepare() {
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });
  cpSync(path.join(REPO_ROOT, "supabase"), path.join(WORK_DIR, "supabase"), {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.temp`),
  });
  // Only migration-shaped files (<14-digit timestamp>_<name>.sql) take part
  // in the replay; anything else in seed/ (an aborted dump, notes) is ignored.
  for (const file of readdirSync(SEED_DIR).filter((f) => /^\d{14}_.+\.sql$/.test(f))) {
    copyFileSync(path.join(SEED_DIR, file), path.join(WORK_DIR, "supabase/migrations", file));
  }
}

/** Start the stack and force a full migration replay (plain `start` may restore a stale backup). */
export function start() {
  sb(["start"]);
  sb(["db", "reset"]);
}

export function status() {
  const json = sb(["status", "-o", "json"], { capture: true });
  const parsed = JSON.parse(json.slice(json.indexOf("{")));
  writeFileSync(STATUS_PATH, JSON.stringify(parsed, null, 2));
  return parsed;
}

export function readStatus() {
  if (!existsSync(STATUS_PATH)) throw new Error(`No local stack status at ${STATUS_PATH} — run \`npm run e2e:up\` first.`);
  return JSON.parse(readFileSync(STATUS_PATH, "utf8"));
}

export function stop() {
  if (!existsSync(path.join(WORK_DIR, "supabase"))) return;
  try {
    sb(["stop", "--no-backup"]);
  } finally {
    rmSync(WORK_DIR, { recursive: true, force: true });
  }
}

export function adminClient(st) {
  return createClient(st.API_URL, st.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export const EDITOR = { email: "e2e-editor@local.test", password: "E2eEditor!2026" };

/** Idempotent: a confirmed user with a catalogue_editors grant. */
export async function ensureEditor(admin) {
  let userId;
  const { data: created, error } = await admin.auth.admin.createUser({
    email: EDITOR.email,
    password: EDITOR.password,
    email_confirm: true,
  });
  if (error) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = list.users.find((u) => u.email === EDITOR.email)?.id;
    if (!userId) throw error;
  } else {
    userId = created.user.id;
  }
  const { error: grantError } = await admin.from("catalogue_editors").upsert({ user_id: userId });
  if (grantError) throw grantError;
  return { ...EDITOR, userId };
}
