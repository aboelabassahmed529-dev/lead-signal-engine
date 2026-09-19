import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only ingestion (n8n webhook). Bypasses RLS,
// so it must NEVER be imported into client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
