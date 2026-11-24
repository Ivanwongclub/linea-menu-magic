/**
 * Central environment variable access.
 * Import from here instead of using import.meta.env directly.
 */
import { resolvePublicConfig } from "@/integrations/supabase/publicConfig";

const publicConfig = resolvePublicConfig(
  typeof window === "undefined" ? undefined : window.__WINCYC_PUBLIC_CONFIG__,
  {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
);
const SUPABASE_URL = publicConfig.supabaseUrl;
const SUPABASE_KEY = publicConfig.supabasePublishableKey;
const SUPABASE_IMAGE_TRANSFORMS_ENABLED =
  import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS !== "false";

export const ENV = {
  SUPABASE_URL,
  SUPABASE_KEY,
  STORAGE_URL: `${SUPABASE_URL}/storage/v1/object/public`,
  SUPABASE_IMAGE_TRANSFORMS_ENABLED,
} as const;
