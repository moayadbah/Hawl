import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";

/**
 * PATCH /api/settings/payment { userId, autoPayEnabled?, autoPayFrequency?,
 * defaultCardId?, basis? } — partial update, only the provided fields change.
 * Shared by the Settings panel's Payments group and the ZakatResult card sub-flow.
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  if (!userId) {
    return NextResponse.json({ error: "جلسة غير صالحة." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.autoPayEnabled !== undefined) updates.auto_pay_enabled = !!body.autoPayEnabled;
  if (body.autoPayFrequency !== undefined) {
    if (body.autoPayFrequency !== "monthly" && body.autoPayFrequency !== "annual") {
      return NextResponse.json({ error: "قيمة غير صحيحة." }, { status: 400 });
    }
    updates.auto_pay_frequency = body.autoPayFrequency;
  }
  if (body.defaultCardId !== undefined) updates.default_card_id = body.defaultCardId;
  if (body.basis !== undefined) {
    if (body.basis !== "end" && body.basis !== "lowest") {
      return NextResponse.json({ error: "قيمة غير صحيحة." }, { status: 400 });
    }
    updates.basis = body.basis;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { error } = await supabase
    .from("payment_settings")
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: "تعذّر حفظ الإعدادات." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
