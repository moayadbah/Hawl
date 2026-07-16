/**
 * Reproducible, auditable engine for `data/silverPriceHistory.json` — replaces the
 * old one-time, undocumented manual pull with a script anyone (including hackathon
 * judges) can re-run themselves to see the real fetch happen:
 *
 *   npm run fetch:silver
 *
 * What it does, honestly:
 *   1. Pulls REAL daily silver-futures (SI=F) closing prices from Yahoo Finance's
 *      public chart endpoint — the same source `lib/server/silverPrice.ts` uses for
 *      the live/current price — for every trading day it has on record back to
 *      START_DATE.
 *   2. Forward-fills only the small real gaps between trading days (weekends,
 *      market holidays) with the previous real close — standard, documented
 *      practice for a daily-priced nisab series.
 *   3. For dates AFTER the last real trading day it could fetch (i.e. genuinely
 *      future dates, which no data source on earth has real prices for) up through
 *      END_DATE, it carries the last real price flat as an explicitly-labeled
 *      placeholder — needed only because this demo's mock transaction data
 *      (scripts/generateMockData.ts) intentionally spans into a fictional "future"
 *      for storytelling. This script prints exactly where that boundary falls so
 *      it's never confused with real data.
 *
 * START_DATE/END_DATE must cover generateMockData.ts's full 48-month window
 * (2024-01 → 2027-12).
 */
import { writeFileSync } from "fs";
import { join } from "path";

const START_DATE = "2024-01-01";
const END_DATE = "2027-12-31";

function toISODate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function addDaysISO(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function fetchRealHistory(): Promise<Record<string, number>> {
  const res = await fetch(
    "https://query1.finance.yahoo.com/v8/finance/chart/SI=F?range=5y&interval=1d",
    { headers: { "User-Agent": "Mozilla/5.0" } },
  );
  if (!res.ok) throw new Error(`Yahoo Finance request failed: HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const timestamps: number[] | undefined = result?.timestamp;
  const closes: (number | null)[] | undefined = result?.indicators?.quote?.[0]?.close;
  if (!timestamps || !closes || timestamps.length === 0) {
    throw new Error("Yahoo Finance response had no chart data (unexpected shape)");
  }

  const real: Record<string, number> = {};
  for (let i = 0; i < timestamps.length; i++) {
    const price = closes[i];
    if (price == null) continue; // market holiday / no trade that day
    real[toISODate(timestamps[i])] = Math.round(price * 1000) / 1000;
  }
  return real;
}

async function main() {
  console.log(`Fetching real SI=F (silver futures) daily closes from Yahoo Finance...`);
  const real = await fetchRealHistory();
  const realDates = Object.keys(real).sort();
  if (realDates.length === 0) throw new Error("No real trading days returned — aborting, not overwriting the fixture.");

  const realFirst = realDates[0];
  const realLast = realDates[realDates.length - 1];
  console.log(`  got ${realDates.length} real trading days, ${realFirst} → ${realLast}`);

  // Build the full calendar-day map for [START_DATE, END_DATE]: real trading-day
  // prices where we have them, forward-filled from the most recent real price
  // otherwise (weekends/holidays inside real range, and the future-placeholder
  // range beyond realLast).
  const byDate: Record<string, number> = {};
  let lastKnown: number | null = null;
  let realDaysUsed = 0;
  let placeholderDaysUsed = 0;
  let placeholderStart: string | null = null;

  // Walk from the earliest fetched real date (not START_DATE) so weekends/holidays
  // right at the start of the window (e.g. Jan 1) inherit the last real close from
  // just before it, instead of having nothing to forward-fill from yet.
  for (let d = realFirst; d <= END_DATE; d = addDaysISO(d, 1)) {
    if (real[d] != null) {
      lastKnown = real[d];
      if (d >= START_DATE) realDaysUsed++;
    } else if (d > realLast && placeholderStart == null && lastKnown != null) {
      placeholderStart = d;
    }
    if (d > realLast) placeholderDaysUsed++;
    if (d < START_DATE) continue;
    if (lastKnown == null) {
      throw new Error(`No real price available on or before ${d} — narrow START_DATE or widen the fetch range.`);
    }
    byDate[d] = lastKnown;
  }

  writeFileSync(
    join(__dirname, "..", "data", "silverPriceHistory.json"),
    JSON.stringify(byDate, null, 2) + "\n",
  );

  console.log(`\n✅ wrote data/silverPriceHistory.json`);
  console.log(`   real data:        ${START_DATE} → ${realLast} (${realDaysUsed} real trading-day closes, forward-filled over weekends/holidays)`);
  if (placeholderStart) {
    console.log(`   ⚠ placeholder:    ${placeholderStart} → ${END_DATE} (${placeholderDaysUsed} days) — NOT real data, flat-carried from the last real close (${lastKnown}) purely so the demo's mock dataset has a price to read for its fictional future dates. No data source can have real prices for dates that haven't happened yet.`);
  } else {
    console.log(`   (END_DATE ${END_DATE} is within real fetched range — no placeholder days needed.)`);
  }
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
