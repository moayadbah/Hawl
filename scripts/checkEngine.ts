/**
 * Verifies the FSM engine for the demo scenario (أحمد — hawl breaks then restarts).
 * Run: npm run engine:check
 */
import { readFileSync } from "fs";
import { join } from "path";
import { AisAccount, BankId } from "../lib/types";
import { analyze } from "../lib/analysis";
import { addHijriYear } from "../lib/hijri";

const BANKS: BankId[] = ["alinma", "rajhi", "snb"];
const accounts = BANKS.map(
  (b) =>
    JSON.parse(
      readFileSync(join(process.cwd(), "data", "ahmed", `${b}.json`), "utf8"),
    ) as AisAccount,
);

async function main() {
  const r = await analyze(accounts);
  const broke = r.history.some((h) => h.toState === "HAWL_BROKEN");
  const starts = r.history.filter((h) => h.toState === "HAWL_STARTED").length;

  console.log("── result ──");
  console.log({
    finalState: r.finalState,
    total: r.total,
    nisab: r.nisab,
    nisabHijri: r.nisabHijri,
    hawlEndHijri: r.hawlEndHijri,
    zakatAmount: r.zakatAmount,
    broke,
    starts,
    nextHawlEndHijri: r.nextHawlEndHijri,
    nextHawlDaysRemaining: r.nextHawlDaysRemaining,
  });

  console.log("── simulation ──");
  console.log("today:", r.sim.today, "horizon:", r.sim.horizonDate);
  console.log(
    "simpleEvents:",
    r.sim.simpleEvents.map((e) => ({ hijri: e.hijri, amount: e.amount, zakat: e.zakat })),
  );
  console.log(
    "preciseEvents (first 8 of " + r.sim.preciseEvents.length + "):",
    r.sim.preciseEvents
      .slice(0, 8)
      .map((e) => ({ date: e.date, amount: e.amount, zakat: e.zakat, label: e.label })),
  );

  let failed = false;
  function assert(cond: boolean, msg: string) {
    console.log((cond ? "OK  " : "FAIL") + "  " + msg);
    if (!cond) failed = true;
  }

  console.log("── assertions ──");
  assert(r.finalState === "ZAKAT_DUE", "final state = ZAKAT_DUE");
  assert(r.total === 48336, "total = 48,336");
  assert(r.nisab === 3605, "nisab (as of hawl end) = 3,605 (real silver price, 29 جمادى الأولى 1446)");
  assert(broke, "hawl broke (HAWL_BROKEN transition exists)");
  assert(starts === 2, `hawl started twice — restarted after the break (got ${starts})`);
  assert(r.zakatAmount === 1208.4, "zakat = 1,208.40 (48,336 × 2.5%)");
  assert(
    r.nextHawlDaysRemaining !== null && r.nextHawlDaysRemaining > 0,
    `next hawl countdown is in the future (got ${r.nextHawlDaysRemaining} days)`,
  );

  // simulation asserts
  const se = r.sim.simpleEvents;
  const pe = r.sim.preciseEvents;
  assert(r.sim.today === r.hawlEndDate, "sim 'today' = the first hawl completion date");
  assert(se.length >= 3, `at least 3 annual simple events (got ${se.length})`);
  assert(se[0]?.date === r.sim.today, "first simple event is on 'today'");
  assert(se[0]?.zakat === 1208.4, `first simple event zakat = 1,208.40 (got ${se[0]?.zakat})`);
  const simpleSpacing = se.every(
    (e, i) => i === 0 || e.date === addHijriYear(se[i - 1].date),
  );
  assert(simpleSpacing, "each simple event = previous + 1 Hijri year");
  assert(
    se.length >= 2 && se[1].amount > se[0].amount,
    "simple event amount grows year-over-year (balance is not flat)",
  );
  assert(pe.length > 0, `precise (per-lot) events exist (got ${pe.length})`);
  assert(
    pe.some((e) => e.label.includes("المبلغ الأساسي")),
    "the base amount held today has its own annual hawl in the precise method",
  );
  assert(
    pe.some((e) => e.label.includes("المُضاف في")),
    "later monthly deposits are tracked as their own lots (per-amount hawl)",
  );
  const preciseSorted = pe.every((e, i) => i === 0 || e.date >= pe[i - 1].date);
  assert(preciseSorted, "precise events are in chronological order");

  process.exitCode = failed ? 1 : 0;
  console.log(failed ? "\n❌ engine check FAILED" : "\n✅ engine check PASSED");
}

main();
