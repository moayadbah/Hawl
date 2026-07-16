import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mock-pay { amount, provider } → always success.
 * Mock only — a real integration would initiate a SAMA PIS payment after
 * obtaining a PISP licence. No funds move here.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount) || 0;
  const provider = typeof body?.provider === "string" ? body.provider : "alinma";
  await new Promise((r) => setTimeout(r, 900));
  const reference =
    "HAWL-" +
    new Date().getFullYear() +
    "-" +
    Math.random().toString(36).slice(2, 8).toUpperCase();
  return NextResponse.json({
    success: true,
    mock: true,
    provider,
    amount,
    currency: "SAR",
    reference,
    paidAt: new Date().toISOString(),
    message: "محاكاة دفع، جاهزة للتكامل مع خدمة إنشاء المدفوعات (PIS) بعد الترخيص.",
  });
}
