import { DueEvent, HawlState, PricedDailyBalance, SimData } from "./types";
import { addHijriYear, formatHijri } from "./hijri";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * First hawl completion date over the series (or null if none). This is the
 * demo's "today": the connect/assets/timeline/result flow runs on the series
 * capped here, and the simulation projects forward from this date.
 */
export function firstCompletion(
  series: PricedDailyBalance[],
): string | null {
  let state: HawlState = "BELOW_NISAB";
  let hawlEnd: string | null = null;
  for (const day of series) {
    const above = day.balance >= day.nisab;
    switch (state) {
      case "BELOW_NISAB":
        if (above) {
          state = "HAWL_IN_PROGRESS";
          hawlEnd = addHijriYear(day.date);
        }
        break;
      case "HAWL_IN_PROGRESS":
        if (!above) {
          state = "BELOW_NISAB";
          hawlEnd = null;
        } else if (hawlEnd && day.date >= hawlEnd) {
          return day.date;
        }
        break;
    }
  }
  return null;
}

function lastDayOfMonth(year: number, month0: number): string {
  const d = new Date(Date.UTC(year, month0 + 1, 0));
  return d.toISOString().slice(0, 10);
}

const G_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
function gregLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${G_MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** Forward-filled balance on `date` (last known running total ≤ date). */
function balanceAt(series: PricedDailyBalance[], date: string): number {
  let v = 0;
  for (const d of series) {
    if (d.date <= date) v = d.balance;
    else break;
  }
  return v;
}

interface Lot {
  acquiredDate: string;
  amount: number;
}

/**
 * Builds the two zakat schedules used by the simulation, both anchored at `today`
 * (the moment the first hawl completed):
 *
 *  - simpleEvents  — the "unified hawl" method: pay 2.5% of the TOTAL balance once a
 *    year (today, +1y, +2y…). Easiest; newer money counts as تعجيل (Ibn Uthaymeen).
 *  - preciseEvents — the "own-hawl-per-amount" method: the balance held at `today`
 *    plus every later monthly deposit ("lot") each get their own hawl; each becomes
 *    due one Hijri year after its date (and annually after). Withdrawals consume the
 *    NEWEST lots first (LIFO). Only counts while the total is still ≥ nisab. Never
 *    overpays (Ibn Baz) — drives the monthly notifications.
 *
 * `fixedNisab` is the nisab as of `today` (the real, priced value) held constant for
 * every future comparison — the real per-day nisab series only has genuine silver-market
 * data up to whenever `fetch:silver` last ran; nothing has real prices
 * for dates that haven't happened yet, so the simulation doesn't pretend to predict them.
 */
export function buildSimulation(
  series: PricedDailyBalance[],
  rate: number,
  today: string,
  fixedNisab: number,
): SimData {
  const horizonDate = series.length ? series[series.length - 1].date : today;
  const b0 = balanceAt(series, today);

  // ── monthly lots from `today` forward (LIFO on withdrawals) ──
  const lots: Lot[] = [{ acquiredDate: today, amount: b0 }];
  const [ty, tm] = today.split("-").map(Number);
  let prevBal = b0;
  // walk month-ends from the month AFTER today's month
  let y = ty;
  let m = tm - 1; // 0-based
  for (let i = 0; i < 60; i++) {
    m += 1;
    if (m > 11) { m = 0; y += 1; }
    const endDate = lastDayOfMonth(y, m);
    if (endDate > horizonDate) break;
    const bal = balanceAt(series, endDate);
    let delta = bal - prevBal;
    if (delta > 0) {
      lots.push({ acquiredDate: endDate, amount: delta });
    } else if (delta < 0) {
      let need = -delta;
      for (let k = lots.length - 1; k >= 0 && need > 0; k--) {
        const take = Math.min(lots[k].amount, need);
        lots[k].amount -= take;
        need -= take;
      }
    }
    prevBal = bal;
  }

  // ── precise events: each surviving lot, its annual hawl completions ──
  const preciseEvents: DueEvent[] = [];
  for (const lot of lots) {
    if (lot.amount <= 0) continue;
    const isBase = lot.acquiredDate === today;
    // The base amount held today just completed its hawl TODAY (that's why today
    // is the completion date) → its first due is today, then annually. A later
    // deposit's first hawl completes one Hijri year after it arrived.
    let due = isBase ? today : addHijriYear(lot.acquiredDate);
    let guard = 0;
    while (due <= horizonDate && guard < 12) {
      if (balanceAt(series, due) >= fixedNisab) {
        preciseEvents.push({
          date: due,
          hijri: formatHijri(due),
          amount: Math.round(lot.amount),
          zakat: round2(lot.amount * rate),
          label: isBase
            ? "المبلغ الأساسي المملوك اليوم"
            : `المبلغ المُضاف في ${gregLabel(lot.acquiredDate)}`,
        });
      }
      due = addHijriYear(due);
      guard++;
    }
  }
  preciseEvents.sort((a, b) => (a.date < b.date ? -1 : 1));

  // ── simple events: unified annual hawl on the total ──
  const simpleEvents: DueEvent[] = [];
  let annual = today;
  let guard = 0;
  while (annual <= horizonDate && guard < 12) {
    const bal = balanceAt(series, annual);
    if (bal >= fixedNisab) {
      simpleEvents.push({
        date: annual,
        hijri: formatHijri(annual),
        amount: Math.round(bal),
        zakat: round2(bal * rate),
        label: "الحول السنوي على إجمالي المال",
      });
    }
    annual = addHijriYear(annual);
    guard++;
  }

  return { today, horizonDate, series, simpleEvents, preciseEvents };
}
