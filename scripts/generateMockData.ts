/**
 * Generates AIS-format bank files for each demo scenario into data/<id>/<bank>.json.
 *
 *  ahmed — reaches nisab, DROPS below before the hawl completes (الحول ينكسر),
 *          then recovers and completes a fresh Hijri year (zakat due on cycle #2).
 *
 * Run: npm run gen:data
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { AisAccount, AisTransaction, BankId } from "../lib/types";
import { ScenarioId } from "../lib/scenarios";

interface ScenarioConfig {
  id: ScenarioId;
  startMonth: string; // "YYYY-MM"
  combined: number[]; // end-of-month combined balance, one per month
  final: Record<BankId, number>;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "ahmed",
    startMonth: "2024-01",
    // 48 months (2024–2027). Early break story: Jan–Mar below; Apr crosses
    // (hawl #1); Sep DROPS below (break); Oct/Nov below; Dec recovers and grows
    // through 2025; plateaus Sep–Dec 2025 so the FIRST hawl-end basis is clean
    // (~48,336 → "today"). Then 2026–2027 fluctuate up and down (deposits +
    // spending) while staying well above nisab — a lively, realistic timeline
    // with distinct monthly "lots" for the precise per-amount zakat method.
    //
    // The 2024 values are sized against the REAL silver-derived nisab for each
    // month (~1,590–2,500 SAR over this window per data/silverPriceHistory.json
    // — not a flat 4,170), with wide margins so the crossing/break/restart holds
    // for every day within each month, not just the 1st:
    //   Jan (nisab ≤1,711) Feb (≤1,681) Mar (≤1,808) — below
    //   Apr (≤2,067) May (≤2,310) Jun (≤2,242) Jul (≤2,252) Aug (≤2,150) — above
    //   Sep (≥1,995) Oct (≥2,178) Nov (≥2,160) — below again (break)
    //   Dec (≤2,336) — above again (restart)
    combined: [
      1300, 1350, 1550, 2200, 2450, 2550, 2650, 2750, 1700, 1600, 1700, 2600,
      // 2024 Jan..Dec
      8340, 13670, 18920, 24380, 29650, 34970, 40210, 44580, 48336, 48336,
      48336, 48336, // 2025 Jan..Dec
      52000, 49500, 55000, 58000, 54000, 61000, 66000, 63000, 70000, 74000,
      71000, 79000, // 2026 Jan..Dec
      84000, 80000, 88000, 93000, 90000, 97000, 103000, 99000, 108000, 114000,
      110000, 120000, // 2027 Jan..Dec
    ],
    final: { alinma: 52000, rajhi: 48000, snb: 20000 },
  },
];

const META: Record<BankId, { bankNameAr: string; iban: string; accountId: string; accountType: string }> = {
  alinma: { bankNameAr: "مصرف الإنماء", iban: "SA44 2000 0001 2345 6789 1234", accountId: "AC-ALINMA-7782", accountType: "حساب جاري" },
  rajhi: { bankNameAr: "مصرف الراجحي", iban: "SA03 8000 0000 6080 1016 7519", accountId: "AC-RAJHI-4451", accountType: "حساب توفير" },
  snb: { bankNameAr: "البنك الأهلي السعودي", iban: "SA80 1000 0001 2300 0700 1010", accountId: "AC-SNB-9920", accountType: "حساب جاري" },
};

// Fixed per-bank seeds → reproducible "random" noise (same output every gen:data run).
const SEEDS: Record<BankId, number> = { alinma: 1337, rajhi: 4242, snb: 9091 };

function mulberry32(seed: number): () => number {
  let s = seed;
  return function rand() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const DEPOSIT_DESCS = ["إيداع راتب", "تحويل وارد", "إيداع نقدي", "تحويل من حساب آخر", "تحويل عبر تطبيق"];
const DEBIT_DESCS = ["مشتريات - نقاط بيع", "سداد فاتورة", "سحب صراف آلي", "شراء إلكتروني", "دفع فاتورة جوال", "اشتراك خدمة رقمية"];
const CREDIT_DESCS = ["استرداد", "تحويل وارد", "حوالة محلية واردة", "استرداد مشتريات"];

function monthList(startMonth: string, count: number): string[] {
  const [y0, m0] = startMonth.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const y = y0 + Math.floor((m0 - 1 + i) / 12);
    const m = ((m0 - 1 + i) % 12) + 1;
    out.push(`${y}-${pad(m)}`);
  }
  return out;
}

function buildAccount(cfg: ScenarioConfig, bank: BankId): AisAccount {
  const share = cfg.final[bank] / (cfg.final.alinma + cfg.final.rajhi + cfg.final.snb);
  const months = monthList(cfg.startMonth, cfg.combined.length);
  const monthly = cfg.combined.map((c, i) =>
    i === cfg.combined.length - 1 ? cfg.final[bank] : Math.round(c * share),
  );
  const rand = mulberry32(SEEDS[bank]);

  const txs: AisTransaction[] = [];
  let seq = 0;
  const push = (
    date: string,
    kind: "Credit" | "Debit",
    amount: number,
    running: number,
    description: string,
  ) => {
    seq += 1;
    txs.push({
      transactionId: `${bank.toUpperCase()}-${pad(seq)}`,
      bookingDate: date,
      creditDebitIndicator: kind,
      amount: { amount: Math.round(Math.abs(amount)), currency: "SAR" },
      runningBalance: { amount: Math.round(running), currency: "SAR" },
      description,
    });
  };

  let prev = 0;
  months.forEach((ym, m) => {
    const mb = monthly[m];
    const A = clamp(Math.round(mb * 0.04), 50, 800); // early net-zero pair (resolved by day 13)
    const B = clamp(Math.round(mb * 0.025), 40, 500); // late net-zero pair (after day 20)

    if (m === 0) {
      push(`${ym}-01`, "Credit", mb, mb, "رصيد افتتاحي");
    } else {
      const delta = mb - prev;
      if (delta > 0) {
        push(`${ym}-01`, "Credit", delta, mb, DEPOSIT_DESCS[m % DEPOSIT_DESCS.length]);
      } else if (delta < 0) {
        push(`${ym}-01`, "Debit", delta, mb, DEBIT_DESCS[m % DEBIT_DESCS.length]);
      }
      // delta === 0 (plateau month): no primary transaction, only noise below.
    }
    // early pair (both before the hawl-end day-of-month → basis stays exact)
    push(`${ym}-08`, "Debit", A, mb - A, DEBIT_DESCS[m % DEBIT_DESCS.length]);
    push(`${ym}-13`, "Credit", A, mb, CREDIT_DESCS[m % CREDIT_DESCS.length]);

    // Extra randomized small transactions — gives each bank its own realistic,
    // differing transaction count. Skipped during the story-critical months
    // (crossing/break/restart, m 3–11) and the final plateau (m 20–23) so the
    // margins around nisab and the hawl-end basis stay exact and easy to reason
    // about; applied everywhere else (safely below nisab, or deep above it).
    if (m < 3 || (m > 11 && m < 20)) {
      const extraCount = Math.floor(rand() * 3); // 0–2 extra pairs, varies per bank/month
      let day = 15;
      for (let k = 0; k < extraCount; k++) {
        const amt = clamp(Math.round(20 + rand() * 90), 20, 110);
        push(`${ym}-${pad(day)}`, "Debit", amt, mb - amt, DEBIT_DESCS[Math.floor(rand() * DEBIT_DESCS.length)]);
        push(`${ym}-${pad(day + 1)}`, "Credit", amt, mb, CREDIT_DESCS[Math.floor(rand() * CREDIT_DESCS.length)]);
        day += 3;
      }
    }

    // late pair (after day 20 → does not affect the hawl-end basis)
    push(`${ym}-25`, "Debit", B, mb - B, DEBIT_DESCS[(m + 2) % DEBIT_DESCS.length]);
    push(`${ym}-28`, "Credit", B, mb, CREDIT_DESCS[(m + 1) % CREDIT_DESCS.length]);

    prev = mb;
  });

  return {
    bank,
    bankNameAr: META[bank].bankNameAr,
    accountId: META[bank].accountId,
    iban: META[bank].iban,
    accountType: META[bank].accountType,
    currency: "SAR",
    openingDate: `${months[0]}-01`,
    transactions: txs,
  };
}

for (const cfg of SCENARIOS) {
  const dir = join(process.cwd(), "data", cfg.id);
  mkdirSync(dir, { recursive: true });
  (["alinma", "rajhi", "snb"] as BankId[]).forEach((bank) => {
    const acc = buildAccount(cfg, bank);
    writeFileSync(join(dir, `${bank}.json`), JSON.stringify(acc, null, 2), "utf8");
    console.log(`  ${bank}: ${acc.transactions.length} transactions, final ${cfg.final[bank]}`);
  });
  const total = cfg.final.alinma + cfg.final.rajhi + cfg.final.snb;
  console.log(`${cfg.id}: ${cfg.combined.length} months, final total ${total}`);
}
console.log("Done.");
