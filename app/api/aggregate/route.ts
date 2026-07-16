import { NextRequest, NextResponse } from "next/server";
import { getAccounts, ALL_BANKS, isBankId, resolveScenario } from "@/lib/server/banks";
import { aggregateDaily, summarizeAccount } from "@/lib/zakat";
import { BankId } from "@/lib/types";

/** GET /api/aggregate?banks=alinma,rajhi,snb&scenario=ahmed → merged daily series. */
export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("banks");
  const scenario = resolveScenario(req.nextUrl.searchParams.get("scenario"));
  const banks: BankId[] = param
    ? (param.split(",").filter(isBankId) as BankId[])
    : ALL_BANKS;
  const accounts = getAccounts(scenario, banks);
  const series = aggregateDaily(accounts);
  const summaries = accounts.map((a) => summarizeAccount(a));
  return NextResponse.json({
    banks: summaries,
    total: summaries.reduce((s, b) => s + b.currentBalance, 0),
    series,
  });
}
