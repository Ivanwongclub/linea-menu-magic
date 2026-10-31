# Supabase Docker sources

Source: https://github.com/supabase/supabase/tree/self-hosted/v0.8.3/docker

Pinned release: `self-hosted/v0.8.3`

Commit: `bc27d2661edd09a5d0b8d76ce33da6d4071a756e`

`upstream/docker-compose.yml`, `.env.example` and `volumes/` are copied from that
release without modifications. The upstream Apache 2.0 license is in
`upstream/LICENSE`. The release pins individual service images and defaults to
PostgreSQL 17. Project changes are in `compose.override.yaml`.

Use the repository-root Compose configuration, rather than starting the upstream
file directly: the overrides persist data in project-scoped named volumes, close
database ports, bind Studio to localhost and select only production functions.
Do not run upstream reset scripts against an existing deployment. Upgrades should
be reviewed, backed up and tested as a complete Supabase service set.
