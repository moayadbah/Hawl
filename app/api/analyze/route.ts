import { NextRequest, NextResponse } from "next/server";
import { getAccounts, ALL_BANKS, isBankId, resolveScenario } from "@/lib/server/banks";
import { analyze } from "@/lib/analysis";
import { BankId } from "@/lib/types";

/**
 * POST /api/analyze { banks, scenario? } → runs the full state machine and returns
 * the complete ZakatResult (aggregate series, transitions, nisab/hawl dates, zakat).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const scenario = resolveScenario(body?.scenario);
  const requested: BankId[] = Array.isArray(body?.banks)
    ? (body.banks.filter(isBankId) as BankId[])
    : ALL_BANKS;
  const banks = requested.length ? requested : ALL_BANKS;
  const accounts = getAccounts(scenario, banks);
  if (accounts.length === 0) {
    return NextResponse.json({ error: "لا توجد حسابات مربوطة" }, { status: 400 });
  }
  return NextResponse.json(await analyze(accounts));
}
