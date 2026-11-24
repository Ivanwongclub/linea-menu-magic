#!/bin/sh
# nginx's official entrypoint runs this before starting the web server.
set -eu

fail() {
  printf '%s\n' "WIN-CYC runtime configuration: $1" >&2
  exit 1
}

command -v jq >/dev/null 2>&1 || fail 'jq is required.'
[ -n "${WINCYC_SUPABASE_URL:-}" ] || fail 'WINCYC_SUPABASE_URL is required.'
[ -n "${WINCYC_SUPABASE_PUBLISHABLE_KEY:-}" ] || fail 'WINCYC_SUPABASE_PUBLISHABLE_KEY is required.'

public_url=${WINCYC_SUPABASE_URL%/}
public_key=$WINCYC_SUPABASE_PUBLISHABLE_KEY

# Accept an HTTP(S) origin, without credentials, a path, query or fragment.
if ! jq -en --arg url "$public_url" '
  $url | capture("^https?://(?<host>[A-Za-z0-9][A-Za-z0-9.-]*|\\[[0-9A-Fa-f:]+\\])(?::(?<port>[0-9]+))?$") as $origin |
  ($origin.port == null or (($origin.port | tonumber) <= 65535))
' >/dev/null 2>&1; then
  fail 'the Supabase URL must be an HTTP(S) origin.'
fi

# Refuse privileged keys before creating any publicly readable file.
if ! jq -en --arg key "$public_key" '
  if ($key | test("^sb_publishable_[A-Za-z0-9_-]+$")) then
    true
  elif ($key | test("^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$")) then
    (try ($key | split(".")[1] | gsub("-"; "+") | gsub("_"; "/") |
      @base64d | fromjson) catch null) as $claims |
    (($claims | type) == "object" and $claims.role == "anon")
  else
    false
  end
' >/dev/null 2>&1; then
  fail 'a public anon or sb_publishable key is required; privileged keys are refused.'
fi

config_path=${WINCYC_RUNTIME_CONFIG_PATH:-/usr/share/nginx/html/runtime-config.js}
[ -d "$(dirname "$config_path")" ] || fail 'the runtime configuration directory does not exist.'
umask 022
temporary_path=$(mktemp "${config_path}.tmp.XXXXXX")
trap 'rm -f "$temporary_path"' EXIT
trap 'exit 1' HUP INT TERM

{
  printf 'window.__WINCYC_PUBLIC_CONFIG__ = '
  jq -cn --arg url "$public_url" --arg key "$public_key" \
    '{supabaseUrl: $url, supabasePublishableKey: $key}'
  printf ';\n'
} > "$temporary_path"
chmod 0644 "$temporary_path"
mv -f "$temporary_path" "$config_path"
printf '%s\n' 'WIN-CYC public runtime configuration generated.'
