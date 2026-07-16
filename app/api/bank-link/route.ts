import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";
import { isBankId } from "@/lib/server/banks";

/** GET /api/bank-link?userId= → { alinma: "connected"|"disconnected", ... } for whichever banks have a row. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "جلسة غير صالحة." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { data } = await supabase.from("bank_links").select("bank, status").eq("user_id", userId);
  const links: Record<string, string> = {};
  for (const row of data ?? []) links[row.bank] = row.status;
  return NextResponse.json(links);
}

/** POST /api/bank-link { userId, bank } → marks a bank as connected (persists the UI link state). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  const bank = body?.bank;
  if (!userId || !isBankId(bank)) {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { error } = await supabase
    .from("bank_links")
    .upsert(
      { user_id: userId, bank, status: "connected", linked_at: new Date().toISOString() },
      { onConflict: "user_id,bank" },
    );

  if (error) {
    return NextResponse.json({ error: "تعذّر حفظ حالة الربط." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/bank-link { userId, bank } → marks a bank as disconnected. */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  const bank = body?.bank;
  if (!userId || !isBankId(bank)) {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const { error } = await supabase
    .from("bank_links")
    .upsert(
      { user_id: userId, bank, status: "disconnected" },
      { onConflict: "user_id,bank" },
    );

  if (error) {
    return NextResponse.json({ error: "تعذّر إلغاء الربط." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
