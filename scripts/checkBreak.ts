/**
 * Edge-case test: balance reaches nisab, then DROPS below it before the hawl
 * completes (الحول ينكسر), then later recovers. Verifies the FSM:
 *   1. detects the break (→ HAWL_BROKEN),
 *   2. restarts the hawl on recovery (new nisab date),
 *   3. only declares zakat due after a full UNINTERRUPTED Hijri year,
 *   4. reports the nisab/hawl-end dates of the cycle that actually completed.
 *
 * Run: npx tsx scripts/checkBreak.ts
 */
import { PricedDailyBalance } from "../lib/types";
import { runStateMachine } from "../lib/stateMachine";
import { nisabAt } from "../lib/server/silverPrice";
import { formatHijri, addHijriYear } from "../lib/hijri";

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Build a daily series from [start..end] inclusive at a constant balance, priced
// against the real (fixture-backed) nisab for each day.
function span(series: PricedDailyBalance[], start: string, end: string, balance: number) {
  for (let d = start; d <= end; d = addDays(d, 1)) {
    series.push({ date: d, hijri: formatHijri(d), balance, nisab: nisabAt(d) });
  }
}

// Balances chosen against the REAL 2024–2025 silver-derived nisab (roughly
// 1,600–3,800 SAR over this window, not the old flat 4,170).
const s: PricedDailyBalance[] = [];
span(s, "2024-01-01", "2024-02-29", 1400); // below nisab (max ~1,711 in this window)
span(s, "2024-03-01", "2024-06-30", 2500); // CROSSES → hawl #1 starts 2024-03-01 (max nisab here ~2,310)
span(s, "2024-07-01", "2024-08-31", 1700); // DROPS below → hawl #1 BREAKS (min nisab here ~1,925)
span(s, "2024-09-01", "2025-10-31", 6500); // recovers → hawl #2 starts, runs a full year (max nisab here ~3,804)

const r = runStateMachine(s);

console.log("── transitions ──");
for (const t of r.history) {
  console.log(`${t.date} (${t.hijri}): ${t.fromState} → ${t.toState}` + (t.source ? `  [${t.source}]` : ""));
}
console.log("\n── summary ──");
console.log({
  finalState: r.finalState,
  nisabDate: r.nisabDate,
  nisabHijri: r.nisabDate ? formatHijri(r.nisabDate) : null,
  hawlEndDate: r.hawlEndDate,
  basisDate: r.basisDate,
});

const broke = r.history.some((t) => t.toState === "HAWL_BROKEN");
const restarts = r.history.filter((t) => t.toState === "HAWL_STARTED").length;
const expectedNisab = "2024-09-01"; // start of the cycle that completed
const expectedEnd = addHijriYear(expectedNisab);

let failed = false;
const assert = (c: boolean, m: string) => { console.log((c ? "OK  " : "FAIL") + "  " + m); if (!c) failed = true; };

console.log("\n── assertions ──");
assert(broke, "detected the broken hawl (HAWL_BROKEN transition exists)");
assert(restarts === 2, `hawl started twice (counted ${restarts})`);
assert(r.finalState === "ZAKAT_DUE", "zakat becomes due only after the full second cycle");
assert(r.nisabDate === expectedNisab, `reported nisab date = start of the COMPLETED cycle (${expectedNisab}), got ${r.nisabDate}`);
assert(r.hawlEndDate === expectedEnd, `hawl end = nisab date + 1 Hijri year (${expectedEnd}), got ${r.hawlEndDate}`);

process.exitCode = failed ? 1 : 0;
console.log(failed ? "\n❌ break-handling FAILED" : "\n✅ break-handling PASSED");
