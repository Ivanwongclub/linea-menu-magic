#!/usr/bin/env python3
"""Point an existing deploy/compose.env at an HTTPS origin. Does not rotate secrets."""
import os
import sys
from pathlib import Path

url = os.environ.get("PUBLIC_URL", "").rstrip("/")
host = url.removeprefix("https://")
if not url.startswith("https://") or not host or "/" in host:
    sys.exit("PUBLIC_URL must be an https origin, without a path.")

path = Path(sys.argv[1] if len(sys.argv) > 1 else "deploy/compose.env")
keys = {
    "SUPABASE_PUBLIC_URL": url,
    "API_EXTERNAL_URL": f"{url}/auth/v1",
    "SITE_URL": url,
    "ADDITIONAL_REDIRECT_URLS": f"{url}/**",
}
text = path.read_text()
out = []
seen = set()
for line in text.splitlines(True):
    key = line.split("=", 1)[0]
    if key in keys:
        out.append(f'{key}="{keys[key]}"\n')
        seen.add(key)
    elif line.startswith("# Generated for "):
        out.append(f"# Generated for {url}. Keep this file private and back it up.\n")
    else:
        out.append(line)
missing = sorted(set(keys) - seen)
if missing:
    sys.exit("missing keys: " + ", ".join(missing))
path.write_text("".join(out))
print("updated public url")
