#!/usr/bin/env bash
# Runs every scenario in scenarios/ against one local stack, in sorted order,
# one at a time. Each scenario still goes through run.mjs, which boots its own
# dev server and browser — the stack is what is shared, not the app process.
#
#   npm run e2e:suite
#
# Environment:
#   E2E_SUITE_SKIP_UP=1   use the stack that is already up (no `e2e:up`)
#   E2E_SUITE_ONLY=<re>   only scenarios whose filename matches this grep -E
#   E2E_ACTION_TIMEOUT=…  passed through to the harness (default 30000)
#   E2E_SUITE_LOG_DIR=…   per-scenario logs (default $TMPDIR/linea-e2e-suite)
#
# Exit 0 only when every scenario passed.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 2
REPO_ROOT="$PWD"
SCENARIO_DIR="scripts/e2e-local/scenarios"
LOG_DIR="${E2E_SUITE_LOG_DIR:-${TMPDIR:-/tmp}/linea-e2e-suite}"
rm -rf "$LOG_DIR" && mkdir -p "$LOG_DIR"

# Sorted so a run is reproducible and two runs are comparable line for line.
scenarios=()
while IFS= read -r f; do
  name="$(basename "$f")"
  if [ -n "${E2E_SUITE_ONLY:-}" ] && ! printf '%s' "$name" | grep -qE "${E2E_SUITE_ONLY}"; then
    continue
  fi
  scenarios+=("$name")
done < <(find "$SCENARIO_DIR" -maxdepth 1 -name '*.mjs' | LC_ALL=C sort)

total=${#scenarios[@]}
if [ "$total" -eq 0 ]; then
  echo "suite: no scenarios found under $SCENARIO_DIR" >&2
  exit 2
fi

# run.mjs treats "something answers on E2E_PORT" as "the dev server is ready",
# so anything else already holding the port (an ssh -L forward, a stray dev
# server) is served to the browser instead of the app under test — which reads
# as fast, nonsensical scenario failures. Refuse rather than record that run.
PORT="${E2E_PORT:-8080}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "suite: port $PORT is already in use — the suite would test whatever is listening there." >&2
  echo "       Free it, or re-run with E2E_PORT=<free port>. Holder:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2
  exit 2
fi

if [ "${E2E_SUITE_SKIP_UP:-}" = "1" ]; then
  echo "suite: reusing the running stack (E2E_SUITE_SKIP_UP=1)"
else
  echo "suite: booting the local stack (npm run e2e:up)"
  if ! npm run --silent e2e:up >"$LOG_DIR/_up.log" 2>&1; then
    echo "suite: e2e:up failed — see $LOG_DIR/_up.log" >&2
    tail -20 "$LOG_DIR/_up.log" >&2
    exit 2
  fi
fi

echo "suite: $total scenarios, action timeout ${E2E_ACTION_TIMEOUT:-30000}ms, logs in $LOG_DIR"
echo

started=$(date +%s)
passed=0
failed_names=()

for i in "${!scenarios[@]}"; do
  name="${scenarios[$i]}"
  n=$((i + 1))
  log="$LOG_DIR/${name%.mjs}.log"
  # A scenario that checks the production build refuses to run against the dev
  # server (it asserts on E2E_BUILD itself), so the suite has to hand it the
  # mode it asks for — otherwise the suite can never be green.
  # (An empty array under `set -u` is an error on bash 3.2, which is what macOS
  # ships, so the two modes are two plain calls rather than an env array.)
  if grep -q 'E2E_BUILD' "$SCENARIO_DIR/$name"; then
    build_mode=1
    marker=' [build]'
  else
    build_mode=0
    marker=''
  fi
  printf '[%2d/%d] %-32s ' "$n" "$total" "${name%.mjs}${marker}"
  t0=$(date +%s)
  if [ "$build_mode" = "1" ]; then
    E2E_BUILD=1 node scripts/e2e-local/run.mjs "scenarios/$name" >"$log" 2>&1
  else
    node scripts/e2e-local/run.mjs "scenarios/$name" >"$log" 2>&1
  fi
  if [ $? -eq 0 ]; then
    printf 'pass  %ss\n' "$(( $(date +%s) - t0 ))"
    passed=$((passed + 1))
  else
    printf 'FAIL  %ss  %s\n' "$(( $(date +%s) - t0 ))" "$log"
    failed_names+=("$name")
  fi
done

elapsed=$(( $(date +%s) - started ))
echo
echo "suite: $passed/$total passed in $((elapsed / 60))m $((elapsed % 60))s"

if [ ${#failed_names[@]} -gt 0 ]; then
  echo "suite: failed —"
  for name in "${failed_names[@]}"; do
    echo "  - ${name%.mjs}  ($LOG_DIR/${name%.mjs}.log)"
  done
  exit 1
fi
exit 0
