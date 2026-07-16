import { getSupabase } from "./supabase";
import silverHistoryRaw from "../../data/silverPriceHistory.json";

/**
 * Real, date-varying nisab — per the fiqh professor's ruling: the nisab (595g of
 * silver) must be re-priced daily off the actual global silver market, not a fixed
 * constant. Historical prices come from a committed fixture (`data/silverPriceHistory.json`),
 * produced by the reproducible engine `scripts/fetchSilverHistory.ts` (`npm run
 * fetch:silver`) — it fetches real daily closes from Yahoo Finance's public
 * COMEX-silver-futures chart endpoint (the same one used below for the live price) and
 * forward-fills only real weekend/holiday gaps. Only the portion up to the last real
 * trading day at fetch time is genuinely real; any dates beyond that (needed purely so
 * generateMockData.ts's demo story can span into a fictional future) are an
 * explicitly-logged flat placeholder — re-run `fetch:silver` to see exactly where that
 * boundary currently falls. Nothing here depends on Supabase or the network for
 * historical dates, so `gen:data`/`engine:check` stay deterministic against whatever
 * fixture is committed. The live/current price (for "today, right now" display)
 * opportunistically refreshes from Supabase's daily cache once Phase 2's project
 * exists — until then it gracefully falls back to the fixture's value for today's real
 * calendar date.
 */

const TROY_OZ_G = 31.1034768;
const USD_SAR = 3.75;

const silverHistory: Record<string, number> = silverHistoryRaw as Record<string, number>;
const HISTORY_DATES = Object.keys(silverHistory).sort();
const HISTORY_FIRST = HISTORY_DATES[0];
const HISTORY_LAST = HISTORY_DATES[HISTORY_DATES.length - 1];

export interface NisabPoint {
  priceUsdOz: number;
  priceSarGram: number;
  nisab: number;
}

export interface NisabSeries {
  /** date (YYYY-MM-DD) → nisab, covering every day in the requested range */
  byDate: Record<string, number>;
  /** forward-filled nisab point at any date */
  at(date: string): NisabPoint;
  /** live/current market nisab (today's real date) */
  current: NisabPoint & { date: string; hijri: string };
}

function toPoint(usdOz: number): NisabPoint {
  const priceSarGram = (usdOz / TROY_OZ_G) * USD_SAR;
  return {
    priceUsdOz: usdOz,
    priceSarGram: Math.round(priceSarGram * 1000) / 1000,
    nisab: Math.round(595 * priceSarGram),
  };
}

/** Sync, fixture-only nisab lookup for a single date — for tests/scripts that don't need the async cache/live path. */
export function nisabAt(date: string): number {
  return toPoint(fixturePriceAt(date)).nisab;
}

/** Clamp a date into the fixture's covered range, then look up its (forward-filled) price. */
function fixturePriceAt(date: string): number {
  const clamped = date < HISTORY_FIRST ? HISTORY_FIRST : date > HISTORY_LAST ? HISTORY_LAST : date;
  const price = silverHistory[clamped];
  if (price != null) return price;
  // shouldn't happen (fixture is a complete daily map) — walk back defensively
  for (let i = HISTORY_DATES.length - 1; i >= 0; i--) {
    if (HISTORY_DATES[i] <= clamped) return silverHistory[HISTORY_DATES[i]];
  }
  return silverHistory[HISTORY_FIRST];
}

function riyadhTodayISO(): string {
  // Asia/Riyadh is a fixed UTC+3 offset, no DST.
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function fetchLiveYahooPriceUsdOz(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/SI=F?range=1d&interval=1d", {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" ? price : null;
  } catch {
    return null;
  }
}

/** Best-effort live/cached current price. Never throws — falls back to the fixture. */
async function getCurrentPoint(): Promise<NisabPoint & { date: string; hijri: string }> {
  const { formatHijri } = await import("../hijri");
  const today = riyadhTodayISO();

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: freshRow } = await supabase
        .from("silver_prices")
        .select("price_usd_oz, fetched_at")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const fetchedToday = freshRow?.fetched_at && String(freshRow.fetched_at).slice(0, 10) === today;
      if (fetchedToday && freshRow?.price_usd_oz != null) {
        return { ...toPoint(Number(freshRow.price_usd_oz)), date: today, hijri: formatHijri(today) };
      }
      const live = await fetchLiveYahooPriceUsdOz();
      if (live != null) {
        const point = toPoint(live);
        await supabase.from("silver_prices").upsert({
          price_date: today,
          price_usd_oz: live,
          price_sar_gram: point.priceSarGram,
          nisab_sar: point.nisab,
          source: "yahoo:SI=F",
          fetched_at: new Date().toISOString(),
        });
        return { ...point, date: today, hijri: formatHijri(today) };
      }
    } catch {
      // fall through to fixture fallback below
    }
  } else {
    const live = await fetchLiveYahooPriceUsdOz();
    if (live != null) return { ...toPoint(live), date: today, hijri: formatHijri(today) };
  }

  return { ...toPoint(fixturePriceAt(today)), date: today, hijri: formatHijri(today) };
}

function addDaysISO(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Builds the per-day nisab series for [startDate, endDate] (inclusive) from the
 * historical fixture, plus a live/cached "current" point for right-now display.
 */
export async function getNisabSeries(startDate: string, endDate: string): Promise<NisabSeries> {
  const byDate: Record<string, number> = {};
  for (let d = startDate; d <= endDate; d = addDaysISO(d, 1)) {
    byDate[d] = toPoint(fixturePriceAt(d)).nisab;
  }

  const current = await getCurrentPoint();

  return {
    byDate,
    at: (date: string) => toPoint(fixturePriceAt(date)),
    current,
  };
}
