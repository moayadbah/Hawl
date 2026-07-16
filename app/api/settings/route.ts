import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";

/** GET /api/settings?userId= → everything the settings panel needs, in one call. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "جلسة غير صالحة." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير متاحة حاليًا." }, { status: 503 });
  }

  const [{ data: user }, { data: payment }, { data: notification }, { data: cards }] =
    await Promise.all([
      supabase.from("users").select("display_name, phone, email, is_guest").eq("id", userId).maybeSingle(),
      supabase
        .from("payment_settings")
        .select("auto_pay_enabled, auto_pay_frequency, default_card_id, basis")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("notification_settings")
        .select("enabled, remind_before_days, notify_sms, notify_email")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("payment_cards")
        .select("id, brand, last4, exp_month, exp_year")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود." }, { status: 404 });
  }

  // Guests get a fixed display identity (see app/api/auth/guest/route.ts) — `phone`
  // is never persisted for them (it's a unique column), so it's synthesized here;
  // display_name/email fall back too, only to cover guest rows created before this.
  const profile = user.is_guest
    ? {
        displayName: user.display_name ?? "ضيف",
        phone: user.phone ?? "0500000000",
        email: user.email ?? "guest@gmail.com",
      }
    : { displayName: user.display_name, phone: user.phone, email: user.email };

  return NextResponse.json({
    profile,
    payment: {
      autoPayEnabled: payment?.auto_pay_enabled ?? false,
      autoPayFrequency: payment?.auto_pay_frequency ?? "annual",
      defaultCardId: payment?.default_card_id ?? null,
      basis: payment?.basis ?? "end",
    },
    notification: {
      enabled: notification?.enabled ?? true,
      remindBeforeDays: notification?.remind_before_days ?? 7,
      notifySms: notification?.notify_sms ?? true,
      notifyEmail: notification?.notify_email ?? false,
    },
    cards: (cards ?? []).map((c) => ({
      id: c.id,
      brand: c.brand,
      last4: c.last4,
      expMonth: c.exp_month,
      expYear: c.exp_year,
    })),
  });
}
