/**
 * Central environment variable access.
 * Import from here instead of using import.meta.env directly.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "[linea-menu-magic] Missing required environment variables.\n" +
    "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env"
  );
}

export const ENV = {
  SUPABASE_URL,
  SUPABASE_KEY,
  STORAGE_URL: `${SUPABASE_URL}/storage/v1/object/public`,
} as const;
