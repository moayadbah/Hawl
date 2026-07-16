import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";
import { ensureDefaultSettings } from "@/lib/server/userSettings";

// Fixed guest identity — shown/behaves like a real user. `phone`
// is intentionally NOT persisted to `users.phone` (it's `unique`, and every guest
// sharing the literal same number would collide from the second guest onward); it's
// returned here as a display-only constant instead, same as AppShell/Auth already treat
// the guest name. `display_name`/`email` have no such constraint, so those ARE real
// persisted columns.
const GUEST_PHONE = "0500000000";
const GUEST_NAME = "ضيف";
const GUEST_EMAIL = "guest@gmail.com";

/** POST /api/auth/guest → creates a fresh guest account (fixed display identity, no real verification). */
export async function POST() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { data: created, error } = await supabase
    .from("users")
    .insert({ is_guest: true, display_name: GUEST_NAME, email: GUEST_EMAIL })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json({ error: "تعذّر إنشاء حساب الضيف." }, { status: 500 });
  }

  await ensureDefaultSettings(supabase, created.id);

  return NextResponse.json({
    userId: created.id,
    phone: GUEST_PHONE,
    displayName: GUEST_NAME,
    email: GUEST_EMAIL,
  });
}
