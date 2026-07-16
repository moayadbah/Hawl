import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";
import { ensureDefaultSettings } from "@/lib/server/userSettings";

const SAUDI_PHONE = /^05\d{8}$/;

/**
 * POST /api/auth/login { phone } → mock phone-number auth, no real OTP/password.
 * Finds the existing user by phone, or creates a new one (isNew: true) so the
 * client can collect name/email via /api/auth/complete-profile.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? "");
  if (!SAUDI_PHONE.test(phone)) {
    return NextResponse.json(
      { error: "رقم جوال غير صحيح، يجب أن يبدأ بـ 05 ويتكون من 10 أرقام." },
      { status: 400 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id, display_name, email")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      userId: existing.id,
      isNew: false,
      displayName: existing.display_name,
      email: existing.email,
    });
  }

  const { data: created, error } = await supabase
    .from("users")
    .insert({ phone, is_guest: false })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json({ error: "تعذّر إنشاء الحساب." }, { status: 500 });
  }

  await ensureDefaultSettings(supabase, created.id);

  return NextResponse.json({ userId: created.id, isNew: true, displayName: null, email: null });
}
