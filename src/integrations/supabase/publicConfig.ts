export interface PublicSupabaseConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export interface BuildTimePublicConfig {
  supabaseUrl?: unknown;
  supabasePublishableKey?: unknown;
}

declare global {
  interface Window {
    __WINCYC_PUBLIC_CONFIG__?: unknown;
  }
}

function configurationError(): never {
  // Never include configuration values: a misconfigured key may be privileged.
  throw new Error("WIN-CYC public Supabase configuration is missing or invalid.");
}

function publicKey(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return configurationError();
  const key = value.trim();
  if (key.startsWith("sb_secret_")) return configurationError();
  if (key === "sb_publishable_") return configurationError();

  // Legacy public keys are JWTs with the anon role. This is a role guard,
  // not signature verification; the API gateway verifies the actual key.
  if (key.startsWith("eyJ") || key.split(".").length === 3) {
    try {
      const segments = key.split(".");
      if (segments.length !== 3 || !segments.every(Boolean)) return configurationError();
      const encoded = segments[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      const payload: unknown = JSON.parse(atob(padded));
      if (!payload || typeof payload !== "object" || !("role" in payload) || payload.role !== "anon") {
        return configurationError();
      }
    } catch {
      return configurationError();
    }
  }

  // Preserve opaque public keys used by older integrations and local fixtures.
  return key;
}

/** Prefer startup configuration; an invalid runtime object must never use stale Vite values. */
export function resolvePublicConfig(
  runtimeConfig: unknown,
  buildTimeConfig: BuildTimePublicConfig,
): PublicSupabaseConfig {
  const source = runtimeConfig == null ? buildTimeConfig : runtimeConfig;
  if (!source || typeof source !== "object" || Array.isArray(source)) return configurationError();
  if (!("supabaseUrl" in source) || !("supabasePublishableKey" in source)) return configurationError();
  if (typeof source.supabaseUrl !== "string" || !source.supabaseUrl.trim()) return configurationError();

  let url: URL;
  try {
    url = new URL(source.supabaseUrl.trim());
  } catch {
    return configurationError();
  }
  if (
    !["https:", "http:"].includes(url.protocol) || url.username || url.password ||
    url.pathname !== "/" || url.search || url.hash
  ) return configurationError();

  return {
    supabaseUrl: url.origin,
    supabasePublishableKey: publicKey(source.supabasePublishableKey),
  };
}
