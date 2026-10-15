// Admin session/PKCE options are intentional. Preserve them if regenerating this client.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ADMIN_SESSION_KEY, adminSessionStorage } from '@/lib/admin-session-storage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: adminSessionStorage(localStorage, sessionStorage),
    storageKey: ADMIN_SESSION_KEY,
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  }
});
