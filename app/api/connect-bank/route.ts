import { NextRequest, NextResponse } from "next/server";
import { getAccount, getAccounts, ALL_BANKS, isBankId, resolveScenario } from "@/lib/server/banks";
import { getScenarioToday } from "@/lib/server/scenarioToday";
import { summarizeAccount } from "@/lib/zakat";

/** POST /api/connect-bank { bank, scenario? } → AIS-style account summary (mock). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const bank = body?.bank;
  if (!isBankId(bank)) {
    return NextResponse.json(
      { error: "بنك غير معروف. استخدم: alinma | rajhi | snb" },
      { status: 400 },
    );
  }
  const scenario = resolveScenario(body?.scenario);
  const account = getAccount(scenario, bank);
  // Balance shown "as of today" (the scenario's first hawl completion), computed from
  // ALL of the scenario's accounts — matches the Assets Dashboard regardless of which
  // banks are actually being connected in this session.
  const today = await getScenarioToday(getAccounts(scenario, ALL_BANKS));
  // Simulate the consent/authorisation latency of a real AIS connection.
  await new Promise((r) => setTimeout(r, 450));
  return NextResponse.json({
    connected: true,
    summary: summarizeAccount(account, today),
    source: "mock-AIS (يحاكي معيار ساما للمصرفية المفتوحة)",
  });
}
