import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';
import { resolvePublicConfig } from './publicConfig';

const publicConfig = resolvePublicConfig(
  typeof window === 'undefined' ? undefined : window.__WINCYC_PUBLIC_CONFIG__,
  {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(publicConfig.supabaseUrl, publicConfig.supabasePublishableKey, {
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  }
});
