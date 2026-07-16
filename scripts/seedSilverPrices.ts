/**
 * One-time backfill of the `silver_prices` table from the committed historical
 * fixture (data/silverPriceHistory.json). Run once after creating the Supabase
 * project and applying supabase/schema.sql:
 *
 *   npx tsx scripts/seedSilverPrices.ts
 *
 * Only inserts a row per real price CHANGE (reconstructing actual trading days from
 * the forward-filled fixture) — matches the table's "sparse" design; the app's
 * historical nisab lookups read the fixture directly and never depend on this table,
 * so this script only matters for giving the live/current-price cache real history
 * to start from, and as a connectivity sanity-check.
 */
import { getSupabase } from "../lib/server/supabase";
import silverHistoryRaw from "../data/silverPriceHistory.json";

const TROY_OZ_G = 31.1034768;
const USD_SAR = 3.75;

async function main() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error(
      "❌ SUPABASE_URL / SUPABASE_SECRET_KEY not set. Copy .env.local.example to " +
        ".env.local, fill in your project's values, then re-run this script.",
    );
    process.exitCode = 1;
    return;
  }

  const history: Record<string, number> = silverHistoryRaw as Record<string, number>;
  const dates = Object.keys(history).sort();

  const rows: {
    price_date: string;
    price_usd_oz: number;
    price_sar_gram: number;
    nisab_sar: number;
    source: string;
  }[] = [];

  let lastPrice: number | null = null;
  for (const date of dates) {
    const usdOz = history[date];
    if (usdOz === lastPrice) continue; // skip forward-filled duplicates — real trading days only
    lastPrice = usdOz;
    const priceSarGram = (usdOz / TROY_OZ_G) * USD_SAR;
    rows.push({
      price_date: date,
      price_usd_oz: usdOz,
      price_sar_gram: Math.round(priceSarGram * 1000) / 1000,
      nisab_sar: Math.round(595 * priceSarGram),
      source: "yahoo:SI=F",
    });
  }

  console.log(`Seeding ${rows.length} real trading-day rows (of ${dates.length} calendar days)...`);

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("silver_prices").upsert(batch, { onConflict: "price_date" });
    if (error) {
      console.error(`❌ Batch ${i / BATCH + 1} failed:`, error.message);
      process.exitCode = 1;
      return;
    }
    console.log(`  batch ${i / BATCH + 1}: ${batch.length} rows OK`);
  }

  console.log("✅ silver_prices seeded successfully.");
}

main();
