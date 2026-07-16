import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Server-only Supabase client (secret key — never import this from client code).
 * Returns null when the project hasn't been provisioned yet (no env vars set), so callers
 * can gracefully fall back instead of crashing — this repo works fully without Supabase
 * until Phase 2's project is created and its keys are dropped into `.env.local`.
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
