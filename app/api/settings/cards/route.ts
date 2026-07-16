import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";
import { cardBrandName } from "@/lib/client/cardInput";

/**
 * POST /api/settings/cards { userId, cardNumber, expMonth, expYear } — mock card
 * entry: any digits are accepted (even fake ones — this is a prototype, no real
 * payment processor). Only brand + last4 are ever persisted, never the full number.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  const digits = String(body?.cardNumber ?? "").replace(/\D/g, "");
  if (!userId) {
    return NextResponse.json({ error: "جلسة غير صالحة." }, { status: 400 });
  }
  if (digits.length < 12) {
    return NextResponse.json({ error: "رقم البطاقة غير صحيح." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("payment_cards")
    .insert({
      user_id: userId,
      brand: cardBrandName(digits),
      last4: digits.slice(-4),
      exp_month: body.expMonth ? Number(body.expMonth) : null,
      exp_year: body.expYear ? Number(body.expYear) : null,
    })
    .select("id, brand, last4, exp_month, exp_year")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "تعذّر إضافة البطاقة." }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    brand: data.brand,
    last4: data.last4,
    expMonth: data.exp_month,
    expYear: data.exp_year,
  });
}

/** DELETE /api/settings/cards { userId, cardId } */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  const cardId = String(body?.cardId ?? "");
  if (!userId || !cardId) {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { error } = await supabase.from("payment_cards").delete().eq("id", cardId).eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: "تعذّر حذف البطاقة." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
