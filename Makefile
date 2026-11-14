SHELL := /bin/bash
.DEFAULT_GOAL := help

SERVER ?= ubuntu@54.179.199.234
REMOTE_DIR ?= /opt/linea3d
SSH_KEY ?= $(CURDIR)/deploy/keys/3deditor-key.pem.cer
SSH_OPTIONS ?= -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=4 -o UserKnownHostsFile="$(CURDIR)/deploy/keys/known_hosts"
PUBLIC_URL ?= https://wincyc.tunebrighthk.com
PREVIOUS_PUBLIC_URL ?= http://54.179.199.234
WEB_PORT ?= 80
FRONTEND_IMAGE ?= linea3d-frontend:release
BACKUP_DIR ?=
SMOKE_ARGS ?=
ASSET_MANIFEST ?= .deploy/assets.json

COMPOSE = docker compose --env-file deploy/compose.env
HTTPS = $(COMPOSE) -f compose.yaml -f deploy/compose.https.yaml
SSH = ssh $(SSH_OPTIONS) -i "$(SSH_KEY)" "$(SERVER)"
ARCHIVE := .deploy/linea3d-src.tar.gz
NODE_IMAGE := node:22-bookworm-slim

.PHONY: help package image upload deploy setup build start rebuild rewrite-public-urls status logs smoke public-assets db-init db-restore

help:
	@printf '%s\n' \
	  'Local:   make deploy       Build the frontend image here, send it, and start the server' \
	  '         make image        Build linea3d-frontend:release for linux/amd64' \
	  '         make package      Create .deploy/linea3d-src.tar.gz without credentials' \
	  '         make upload       Package and upload source without starting services' \
	  'Server:  make start        Use the loaded image, Caddy on 80/443, and reload functions' \
	  '         make rebuild      Same as start. The frontend is not compiled on the server' \
	  '         make status       Show container health' \
	  '         make logs         Show recent service logs' \
	  '         make smoke        Check the running website and APIs' \
	  '         make public-assets ASSET_MANIFEST=.deploy/assets.json' \
	  'New DB:  make setup PUBLIC_URL=https://HOST WEB_PORT=80' \
	  '         make db-init      Initialize an EMPTY test database' \
	  '         make db-restore BACKUP_DIR=/path/to/export'

# Exclude every .env variant, then add back the required public vendor template.
# The private key, server configuration and persistent data never enter the archive.
package:
	@mkdir -p .deploy
	COPYFILE_DISABLE=1 tar -cf .deploy/linea3d-src.tar \
	  --exclude=.git --exclude=.deploy --exclude=node_modules \
	  --exclude=dist --exclude=dist-ssr --exclude=reports --exclude=techdoc \
	  --exclude=backups --exclude='.env*' --exclude='*.env' \
	  --exclude='./deploy/keys' --exclude='*.pem' --exclude='*.cer' \
	  --exclude='*.log' --exclude='*.tsbuildinfo' --exclude=.DS_Store \
	  --exclude='./supabase/.temp' --exclude='./scripts/e2e-local/.shots' \
	  --exclude='./scripts/e2e-local/last-failure.png' \
	  --exclude='./resources/obj' --exclude='./resources/stl' \
	  --exclude='./deploy/supabase/upstream/volumes/db/data' \
	  --exclude='./deploy/supabase/upstream/volumes/storage' .
	COPYFILE_DISABLE=1 tar -rf .deploy/linea3d-src.tar deploy/supabase/upstream/.env.example
	gzip -f .deploy/linea3d-src.tar
	@ls -lh "$(ARCHIVE)"

image:
	set -a && . deploy/compose.env && set +a && \
	  export VITE_SUPABASE_URL="$${VITE_SUPABASE_URL:-$$SUPABASE_PUBLIC_URL}" && \
	  export VITE_SUPABASE_PUBLISHABLE_KEY="$${VITE_SUPABASE_PUBLISHABLE_KEY:-$$ANON_KEY}" && \
	  test -n "$$VITE_SUPABASE_URL" && test -n "$$VITE_SUPABASE_PUBLISHABLE_KEY" && \
	  npm ci --include=dev --no-audit --no-fund && \
	  npm run build
	$(COMPOSE) build frontend

upload: package
	$(SSH) 'mkdir -p "$(REMOTE_DIR)/.deploy"'
	scp $(SSH_OPTIONS) -i "$(SSH_KEY)" "$(ARCHIVE)" "$(SERVER):$(REMOTE_DIR)/$(ARCHIVE)"

deploy: image upload
	$(SSH) 'docker image prune -af'
	docker save "$(FRONTEND_IMAGE)" | gzip -1 | $(SSH) 'gunzip | docker load'
	$(SSH) 'set -eu; cd "$(REMOTE_DIR)"; tar -xzf "$(ARCHIVE)"; PUBLIC_URL="$(PUBLIC_URL)" python3 deploy/scripts/set-public-url.py; make start; PREVIOUS_PUBLIC_URL="$(PREVIOUS_PUBLIC_URL)" PUBLIC_URL="$(PUBLIC_URL)" make rewrite-public-urls'

# First-time secret generation only. Refuses to overwrite an existing configuration.
setup:
	docker run --rm --user "$$(id -u):$$(id -g)" \
	  -v "$(CURDIR):/workspace" -w /workspace $(NODE_IMAGE) \
	  node deploy/scripts/setup.mjs --url "$(PUBLIC_URL)" --port "$(WEB_PORT)"

build: image

start:
	$(HTTPS) config --quiet
	$(HTTPS) pull --ignore-buildable
	$(HTTPS) up -d --no-build --wait --wait-timeout 300
	$(HTTPS) up -d --no-deps --force-recreate --wait --wait-timeout 120 functions
	$(HTTPS) ps

rebuild: start

rewrite-public-urls:
	$(COMPOSE) exec -T db psql -X -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
	  --set=old_url="$(PREVIOUS_PUBLIC_URL)" --set=new_url="$(PUBLIC_URL)" \
	  < deploy/rewrite-storage-urls.sql

status:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs --tail=100 frontend auth storage functions

smoke:
	docker run --rm --network host --user "$$(id -u):$$(id -g)" \
	  -v "$(CURDIR):/work:ro" -w /work $(NODE_IMAGE) \
	  node deploy/scripts/smoke.mjs $(SMOKE_ARGS)

# Explicit public Storage copy; not part of deploy/rebuild or DB initialization.
public-assets:
	docker run --rm --network host --user "$$(id -u):$$(id -g)" \
	  -v "$(CURDIR):/work" -w /work $(NODE_IMAGE) \
	  node deploy/scripts/copy-public-assets.mjs --manifest "$(ASSET_MANIFEST)" --url http://127.0.0.1

# Explicit maintenance tasks; never called by deploy/rebuild.
db-init:
	@set -euo pipefail; \
	  tables="$$( $(COMPOSE) exec -T --interactive=false db psql -X -U supabase_admin -d postgres -At -v ON_ERROR_STOP=1 \
	    -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';" )"; \
	  [ "$$tables" = 0 ] || { echo 'Initialization refused: application tables already exist.' >&2; exit 1; }; \
	  { \
	    printf '\nSET LOCAL ROLE postgres;\n'; \
	    for migration in $$(for file in supabase/migrations/*.sql scripts/e2e-local/seed/*.sql; do \
	      printf '%s\t%s\n' "$${file##*/}" "$$file"; done | LC_ALL=C sort | cut -f2-); do \
	      printf '\n'; \
	      awk 'tolower($$0) !~ /^[[:space:]]*(begin|commit)[[:space:]]*;[[:space:]]*$$/' "$$migration"; \
	      printf '\n;\n'; \
	    done; \
	    printf "\nNOTIFY pgrst, 'reload schema';\n"; \
	  } | $(COMPOSE) exec -T db psql -X -U supabase_admin -d postgres --single-transaction -v ON_ERROR_STOP=1

db-restore:
	@set -euo pipefail; \
	  [ -n "$(BACKUP_DIR)" ] || { echo 'Set BACKUP_DIR to the directory containing roles.sql, schema.sql and data.sql.' >&2; exit 1; }; \
	  for name in roles schema data; do \
	    [ -s "$(BACKUP_DIR)/$$name.sql" ] || { echo "Missing/empty $(BACKUP_DIR)/$$name.sql" >&2; exit 1; }; \
	  done; \
	  tables="$$( $(COMPOSE) exec -T --interactive=false db psql -X -U supabase_admin -d postgres -At -v ON_ERROR_STOP=1 \
	    -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';" )"; \
	  users="$$( $(COMPOSE) exec -T --interactive=false db psql -X -U supabase_admin -d postgres -At -v ON_ERROR_STOP=1 \
	    -c 'SELECT count(*) FROM auth.users;' )"; \
	  [ "$$tables" = 0 ] && [ "$$users" = 0 ] || { echo 'Restore refused: target already has application tables or users.' >&2; exit 1; }; \
	  { \
	    cat "$(BACKUP_DIR)/roles.sql"; printf '\n;\n'; \
	    cat "$(BACKUP_DIR)/schema.sql"; printf '\n;\nSET session_replication_role = replica;\n'; \
	    cat "$(BACKUP_DIR)/data.sql"; printf "\n;\nSET session_replication_role = origin;\nNOTIFY pgrst, 'reload schema';\n"; \
	  } | $(COMPOSE) exec -T db psql -X -U supabase_admin -d postgres --single-transaction -v ON_ERROR_STOP=1
