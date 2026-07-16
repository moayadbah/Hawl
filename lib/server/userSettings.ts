import { SupabaseClient } from "@supabase/supabase-js";

/** Creates the default payment/notification settings rows for a brand-new user. */
export async function ensureDefaultSettings(supabase: SupabaseClient, userId: string) {
  await Promise.all([
    supabase.from("payment_settings").insert({ user_id: userId }),
    supabase.from("notification_settings").insert({ user_id: userId }),
  ]);
}
