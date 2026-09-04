// Regenerate src/integrations/supabase/types.ts from the running local stack —
// i.e. from the repo's own migrations (plus seed/), never from production.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT, WORK_DIR, SUPABASE_BIN, readStatus } from "./lib/stack.mjs";

readStatus(); // throws with a helpful message if the stack isn't up
const out = execFileSync(SUPABASE_BIN, ["gen", "types", "typescript", "--local"], {
  cwd: WORK_DIR,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
const target = path.join(REPO_ROOT, "src/integrations/supabase/types.ts");
writeFileSync(target, out);
console.log(`Wrote ${target} (${out.split("\n").length} lines)`);
