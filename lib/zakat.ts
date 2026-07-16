import { AisAccount, BankSummary, DailyBalance } from "./types";
import { formatHijri } from "./hijri";

// ── Fixed fiqh/market constants (documented, honest defaults) ──
export const NISAB_SILVER_GRAMS = 595; // silver nisab — the safer, more common contemporary opinion
export const ZAKAT_RATE = 0.025; // 2.5%
// Nisab is no longer a fixed price: it's derived daily from the real silver market
// (595g × that day's SAR/gram price) — see lib/server/silverPrice.ts.

export function summarizeAccount(acc: AisAccount, asOf?: string): BankSummary {
  // Balance/count as of `asOf` (the demo "today"), else the full history.
  const txs = asOf
    ? acc.transactions.filter((t) => t.bookingDate <= asOf)
    : acc.transactions;
  const last = txs[txs.length - 1];
  return {
    bank: acc.bank,
    bankNameAr: acc.bankNameAr,
    accountId: acc.accountId,
    iban: acc.iban,
    currency: acc.currency,
    currentBalance: last ? last.runningBalance.amount : 0,
    transactionsCount: txs.length,
  };
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregate the daily total balance across accounts by forward-filling each
 * account's last known running balance. The combined series is what the
 * state machine and the timeline chart consume.
 */
export function aggregateDaily(accounts: AisAccount[]): DailyBalance[] {
  if (accounts.length === 0) return [];

  // Per-account map of date -> running balance at end of that date
  const perAccount = accounts.map((acc) => {
    const map = new Map<string, number>();
    for (const t of acc.transactions) {
      map.set(t.bookingDate, t.runningBalance.amount);
    }
    return map;
  });

  const allDates = accounts.flatMap((a) => a.transactions.map((t) => t.bookingDate));
  const start = allDates.reduce((a, b) => (a < b ? a : b));
  const end = allDates.reduce((a, b) => (a > b ? a : b));

  const series: DailyBalance[] = [];
  const lastKnown = perAccount.map(() => 0);

  for (let date = start; date <= end; date = addDays(date, 1)) {
    let total = 0;
    perAccount.forEach((map, i) => {
      if (map.has(date)) lastKnown[i] = map.get(date)!;
      total += lastKnown[i];
    });
    series.push({ date, hijri: formatHijri(date), balance: Math.round(total) });
  }
  return series;
}

export function calcZakat(basisBalance: number, rate = ZAKAT_RATE): number {
  return Math.round(basisBalance * rate * 100) / 100;
}
