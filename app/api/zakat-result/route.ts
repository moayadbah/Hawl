import { NextRequest, NextResponse } from "next/server";
import { getAccounts, ALL_BANKS, isBankId, resolveScenario } from "@/lib/server/banks";
import { analyze } from "@/lib/analysis";
import { BankId } from "@/lib/types";

/** GET /api/zakat-result?banks=...&scenario=... → final state + amount + sources. */
export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("banks");
  const scenario = resolveScenario(req.nextUrl.searchParams.get("scenario"));
  const banks: BankId[] = param
    ? (param.split(",").filter(isBankId) as BankId[])
    : ALL_BANKS;
  const r = await analyze(getAccounts(scenario, banks));
  return NextResponse.json({
    finalState: r.finalState,
    total: r.total,
    nisab: r.nisab,
    nisabHijri: r.nisabHijri,
    hawlEndHijri: r.hawlEndHijri,
    zakatRate: r.zakatRate,
    basisBalance: r.basisBalance,
    zakatAmount: r.zakatAmount,
  });
}
