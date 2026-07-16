import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/complete-profile { userId, displayName, email } — first-time
 * profile capture for a newly created account. Format-validated only (no real
 * verification email/SMS is sent), matching this app's honest mock-auth framing.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  const displayName = String(body?.displayName ?? "").trim();
  const email = String(body?.email ?? "").trim();

  if (!userId) {
    return NextResponse.json({ error: "جلسة غير صالحة." }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: "يرجى إدخال الاسم." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "صيغة البريد الإلكتروني غير صحيحة." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName, email })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "تعذّر حفظ البيانات." }, { status: 500 });
  }

  return NextResponse.json({ displayName, email });
}
