import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";

/**
 * PATCH /api/settings/notifications { userId, enabled?, remindBeforeDays?,
 * notifySms?, notifyEmail? } — partial update. UI-only for now (no real
 * notification delivery is wired up yet, per the product scope).
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  if (!userId) {
    return NextResponse.json({ error: "جلسة غير صالحة." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.enabled !== undefined) updates.enabled = !!body.enabled;
  if (body.remindBeforeDays !== undefined) {
    const days = Number(body.remindBeforeDays);
    if (!Number.isFinite(days) || days < 0) {
      return NextResponse.json({ error: "قيمة غير صحيحة." }, { status: 400 });
    }
    updates.remind_before_days = days;
  }
  if (body.notifySms !== undefined) updates.notify_sms = !!body.notifySms;
  if (body.notifyEmail !== undefined) updates.notify_email = !!body.notifyEmail;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { error } = await supabase
    .from("notification_settings")
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: "تعذّر حفظ الإعدادات." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
