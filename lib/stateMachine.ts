import { HawlState, PricedDailyBalance, Transition } from "./types";
import { addHijriYear } from "./hijri";

export interface StateMachineResult {
  finalState: HawlState;
  history: Transition[];
  nisabDate: string | null;
  hawlEndDate: string | null;
  basisBalance: number;
  basisDate: string | null;
  lowestDuringHawl: { date: string; hijri: string; balance: number } | null;
}

const NOTES: Record<string, string> = {
  HAWL_STARTED: "بلغ مجموع الأموال النصاب، ويبدأ حساب الحول من هذا اليوم.",
  HAWL_IN_PROGRESS: "استمر الرصيد فوق النصاب، والحول يجري.",
  HAWL_BROKEN: "نزل الرصيد دون النصاب، فانكسر الحول ويبدأ العدّ من جديد عند بلوغه ثانيةً.",
  ZAKAT_DUE: "اكتمل الحول الهجري والرصيد فوق النصاب، فوجبت الزكاة.",
  BELOW_NISAB: "الرصيد دون النصاب، فلا تجب الزكاة بعد.",
};

/**
 * Finite State Machine over a daily balance series. A broken hawl is just a
 * transition (no reverse rollback). Every state change is recorded with its
 * documented fiqh source — that log is exactly what the timeline renders.
 */
export function runStateMachine(
  daily: PricedDailyBalance[],
): StateMachineResult {
  let state: HawlState = "BELOW_NISAB";
  let hawlStart: string | null = null;
  let hawlEnd: string | null = null;
  let basisBalance = 0;
  let basisDate: string | null = null;
  let lowest: StateMachineResult["lowestDuringHawl"] = null;
  const history: Transition[] = [];

  const record = (
    from: HawlState,
    to: HawlState,
    day: PricedDailyBalance,
    source: string | null,
  ) => {
    history.push({
      fromState: from,
      toState: to,
      date: day.date,
      hijri: day.hijri,
      balance: day.balance,
      source,
      note: NOTES[to] ?? "",
    });
  };

  for (const day of daily) {
    const above = day.balance >= day.nisab;

    // track the lowest point while the hawl is running (insight, not a state)
    if (state === "HAWL_STARTED" || state === "HAWL_IN_PROGRESS") {
      if (!lowest || day.balance < lowest.balance) {
        lowest = { date: day.date, hijri: day.hijri, balance: day.balance };
      }
    }

    let next: HawlState = state;
    let source: string | null = null;

    switch (state) {
      case "BELOW_NISAB":
        if (above) {
          next = "HAWL_STARTED";
          source = "ibnBaz";
        }
        break;
      case "HAWL_STARTED":
        if (!above) {
          next = "HAWL_BROKEN";
          source = "ibnUthaymeen";
        } else {
          next = "HAWL_IN_PROGRESS";
          source = null;
        }
        break;
      case "HAWL_IN_PROGRESS":
        if (!above) {
          next = "HAWL_BROKEN";
          source = "ibnUthaymeen";
        } else if (hawlEnd && day.date >= hawlEnd) {
          next = "ZAKAT_DUE";
          source = "ijma";
        }
        break;
      case "HAWL_BROKEN":
        if (above) {
          next = "HAWL_STARTED";
          source = "ibnBaz";
        } else {
          next = "BELOW_NISAB";
          source = null;
        }
        break;
      case "ZAKAT_DUE":
        break; // terminal for this demo cycle
    }

    if (next !== state) {
      if (next === "HAWL_STARTED") {
        hawlStart = day.date;
        hawlEnd = addHijriYear(day.date);
        lowest = { date: day.date, hijri: day.hijri, balance: day.balance };
      }
      if (next === "HAWL_BROKEN" || next === "BELOW_NISAB") {
        hawlStart = null;
        hawlEnd = null;
      }
      if (next === "ZAKAT_DUE") {
        basisBalance = day.balance;
        basisDate = day.date;
      }
      record(state, next, day, source);
      state = next;
    }
  }

  // Use the CURRENT cycle's start (hawlStart is cleared on a break and reset on
  // each restart), so after a broken-then-restarted hawl we report the dates of
  // the cycle that actually counts — not the first, broken crossing.
  const nisabDate = hawlStart;
  const hawlEndDate =
    state === "ZAKAT_DUE"
      ? basisDate
      : nisabDate
        ? addHijriYear(nisabDate)
        : null;

  return {
    finalState: state,
    history,
    nisabDate,
    hawlEndDate,
    basisBalance,
    basisDate,
    lowestDuringHawl: lowest,
  };
}
