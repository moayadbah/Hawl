import { AisAccount, PricedDailyBalance, ZakatResult } from "./types";
import {
  aggregateDaily,
  calcZakat,
  summarizeAccount,
  NISAB_SILVER_GRAMS,
  ZAKAT_RATE,
} from "./zakat";
import { runStateMachine } from "./stateMachine";
import { buildSimulation, firstCompletion } from "./simEngine";
import { addHijriYear, daysBetween, formatHijri } from "./hijri";
import { getNisabSeries } from "./server/silverPrice";

/** Full pipeline: accounts → aggregate → FSM (capped at "today") → zakat result + simulation. */
export async function analyze(accounts: AisAccount[]): Promise<ZakatResult> {
  const raw = aggregateDaily(accounts);
  const nis = await getNisabSeries(
    raw.length ? raw[0].date : "",
    raw.length ? raw[raw.length - 1].date : "",
  );
  const fullSeries: PricedDailyBalance[] = raw.map((d) => ({ ...d, nisab: nis.byDate[d.date] }));

  // "Today" = the day the first hawl completes. The connect/assets/timeline/
  // result flow analyzes the series capped here (the state of the money as of
  // today); the simulation projects forward from today over the full series.
  const today =
    firstCompletion(fullSeries) ??
    (fullSeries.length ? fullSeries[fullSeries.length - 1].date : "");
  const series = fullSeries.filter((d) => d.date <= today);

  const sm = runStateMachine(series);

  const banks = accounts.map((a) => summarizeAccount(a, today));
  const total = banks.reduce((s, b) => s + b.currentBalance, 0);

  const due = sm.finalState === "ZAKAT_DUE";
  const basisBalance = due ? sm.basisBalance : total;
  const zakatAmount = due ? calcZakat(basisBalance) : 0;
  // Count only what exists as of "today" (matches the per-bank summaries).
  const transactionsAnalyzed = banks.reduce((s, b) => s + b.transactionsCount, 0);

  // Next cycle: one full Hijri year after this hawl completed, counted from today.
  let nextHawlEndDate: string | null = null;
  let nextHawlEndHijri: string | null = null;
  let nextHawlDaysRemaining: number | null = null;
  if (due && sm.hawlEndDate) {
    nextHawlEndDate = addHijriYear(sm.hawlEndDate);
    nextHawlEndHijri = formatHijri(nextHawlEndDate);
    nextHawlDaysRemaining = daysBetween(today, nextHawlEndDate);
  }

  // Silver price "as of" the day the hawl actually completed (drives the zakat display).
  const hawlPoint = nis.at(sm.hawlEndDate ?? today);

  // Forward-looking simulation (over the FULL multi-year series) for the
  // "coming years" screen: the two fiqh methods, both anchored at today. The
  // nisab is held fixed at `hawlPoint.nisab` for every future comparison — see
  // the fixedNisab note on buildSimulation.
  const sim = buildSimulation(fullSeries, ZAKAT_RATE, today, hawlPoint.nisab);

  return {
    finalState: sm.finalState,
    total,
    nisab: hawlPoint.nisab,
    nisabWeightGrams: NISAB_SILVER_GRAMS,
    silverPricePerGram: hawlPoint.priceSarGram,
    silverPriceHijri: sm.hawlEndDate ? formatHijri(sm.hawlEndDate) : null,
    currentNisab: nis.current.nisab,
    currentSilverPricePerGram: nis.current.priceSarGram,
    currentNisabHijri: nis.current.hijri,
    nisabDate: sm.nisabDate,
    nisabHijri: sm.nisabDate ? formatHijri(sm.nisabDate) : null,
    hawlEndDate: sm.hawlEndDate,
    hawlEndHijri: sm.hawlEndDate ? formatHijri(sm.hawlEndDate) : null,
    lowestDuringHawl: sm.lowestDuringHawl,
    zakatRate: ZAKAT_RATE,
    zakatAmount,
    basisBalance,
    nextHawlEndDate,
    nextHawlEndHijri,
    nextHawlDaysRemaining,
    sim,
    banks,
    series,
    history: sm.history,
    transactionsAnalyzed,
  };
}
