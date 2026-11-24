# Frontend Auth runtime configuration

The Docker frontend loads `/runtime-config.js` before the application module.
The container entrypoint generates it from `WINCYC_SUPABASE_URL` and
`WINCYC_SUPABASE_PUBLISHABLE_KEY`. Compose supplies these from
`SUPABASE_PUBLIC_URL` and `ANON_KEY`, the same configuration used by `api-gw`.
Changing a compiled `VITE_*` value is no longer required to update the Docker
frontend's Auth URL or public key. Local Vite/static previews retain the
existing build-time fallback through `public/runtime-config.js`.

An unavailable runtime script leaves a bootstrap sentinel that rejects stale
build-time credentials. An invalid runtime object also fails closed. The nginx
startup script requires a public anon JWT or `sb_publishable_` key and rejects
privileged keys before writing a public file. It writes atomically with 0644
permissions; neither keys nor passwords are logged. nginx serves runtime config
and SPA HTML with `Cache-Control: no-store`; hashed assets remain immutable.

## AWS configuration

Keep the successful direct API endpoint and its **public anon key** consistent
with `deploy/compose.env`:

- `SUPABASE_PUBLIC_URL`: HTTP(S) origin serving the Supabase API routes.
- `ANON_KEY`: the public anon JWT accepted by that gateway, not a service-role key.

The new frontend environment bindings come from `compose.yaml`; no new AWS
Security Group rule, database migration, user creation or JWT secret rotation
is required for this frontend change. A successful request made using a
service-role key does not verify that the public anon key works; validate the
public key as part of deployment.

## Deploy a prebuilt handoff package

Assume `/tmp/wincyc-frontend-auth-fix-20261124.tar.gz` contains the reviewed patch,
compiled `dist`, Docker build context and checksums. Run after SSH:

```bash
(
set -euo pipefail
cd /opt/linea3d
command -v git >/dev/null || { echo 'Install Git before applying the patch.'; exit 1; }
tar -xzf /tmp/wincyc-frontend-auth-fix-20261124.tar.gz
release_dir="$PWD/wincyc-frontend-auth-fix-20261124"
(cd "$release_dir" && sha256sum --quiet -c SHA256SUMS)

git apply --check "$release_dir/wincyc-frontend-auth.patch"
git apply "$release_dir/wincyc-frontend-auth.patch"

dc() {
  docker compose --env-file deploy/compose.env \
    -f compose.yaml -f deploy/compose.https.yaml "$@"
}
dc config --quiet

frontend_id="$(dc ps -q frontend)"
old_image="$(docker inspect --format '{{.Image}}' "$frontend_id")"
backup_tag="linea3d-frontend:before-authfix-$(date -u +%Y%m%d%H%M%S)"
docker image tag "$old_image" "$backup_tag"
printf '%s\n' "$backup_tag" > "$release_dir/rollback-image.txt"
printf 'Rollback image: %s\n' "$backup_tag"

docker build --platform linux/amd64 \
  -t linea3d-frontend:release \
  -f "$release_dir/deploy/frontend/Dockerfile" "$release_dir"

dc run --rm --no-deps --entrypoint /bin/sh frontend -ec '
  /docker-entrypoint.d/40-runtime-config.sh
  nginx -t
'

dc up -d --no-deps --no-build --force-recreate \
  --wait --wait-timeout 120 frontend
make smoke
)
```

Stop on any failed checksum, patch check, image build or smoke check; do not
force a patch over different production source. The image build needs access
to the official nginx image/Alpine package repository for `jq`. It uses the
included compiled frontend, so AWS does not need Node/npm for compilation.
`make smoke` uses the existing disposable Node image as before.

The replacement only recreates `frontend`. Keep Auth, database and gateway
services intact when their direct public API requests already succeed. The
frontend startup log must include `WIN-CYC public runtime configuration generated.`

Verify in an incognito window at `/admin/login` with the existing CMS account.
The deployment smoke test now verifies runtime URL/key equality and no-store
caching, rather than relying on a URL embedded in the compiled bundle.

If rollback is required, retain the printed backup tag and run:

```bash
cd /opt/linea3d
backup_tag="$(cat wincyc-frontend-auth-fix-20261124/rollback-image.txt)"
docker image tag "$backup_tag" linea3d-frontend:release
docker compose --env-file deploy/compose.env \
  -f compose.yaml -f deploy/compose.https.yaml \
  up -d --no-deps --no-build --force-recreate \
  --wait --wait-timeout 120 frontend
```

## Offline checks

Node 24+ and `jq` are needed for the new focused tests:

```bash
node --test scripts/e2e-local/unit/supabase-public-config.test.mjs \
  scripts/e2e-local/unit/runtime-config-entrypoint.test.mjs \
  scripts/e2e-local/unit/runtime-config-smoke.test.mjs
```

These tests cover stale build configuration, bootstrap order/failure, key
validation before publication, atomic output/permissions, and deployment smoke
checks. They do not authenticate a real AWS account or deploy an image.
