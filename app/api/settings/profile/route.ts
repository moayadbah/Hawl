import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";

const SAUDI_PHONE = /^05\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PATCH /api/settings/profile { userId, displayName?, email?, phone? } — format
 * validation only, no real verification. Changing `phone` is the login identifier,
 * so the response signals `phoneChanged` and the client logs the user out to sign
 * back in with the new number (same account, since the DB row is already updated).
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  if (!userId) {
    return NextResponse.json({ error: "جلسة غير صالحة." }, { status: 400 });
  }

  const updates: Record<string, string> = {};

  if (body.displayName !== undefined) {
    const displayName = String(body.displayName).trim();
    if (!displayName) {
      return NextResponse.json({ error: "الاسم لا يمكن أن يكون فارغًا." }, { status: 400 });
    }
    updates.display_name = displayName;
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "صيغة البريد الإلكتروني غير صحيحة." }, { status: 400 });
    }
    updates.email = email;
  }

  let phoneChanged = false;
  if (body.phone !== undefined) {
    const phone = String(body.phone).trim();
    if (!SAUDI_PHONE.test(phone)) {
      return NextResponse.json(
        { error: "رقم جوال غير صحيح، يجب أن يبدأ بـ 05 ويتكون من 10 أرقام." },
        { status: 400 },
      );
    }
    updates.phone = phone;
    phoneChanged = true;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) {
    const message = error.code === "23505" ? "رقم الجوال مستخدم لحساب آخر." : "تعذّر حفظ البيانات.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, phoneChanged });
}
