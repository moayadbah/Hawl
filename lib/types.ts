export type BankId = "alinma" | "rajhi" | "snb";

/** One transaction, shaped to mirror SAMA Open Banking AIS responses. */
export interface AisTransaction {
  transactionId: string;
  bookingDate: string; // YYYY-MM-DD
  creditDebitIndicator: "Credit" | "Debit";
  amount: { amount: number; currency: "SAR" };
  runningBalance: { amount: number; currency: "SAR" };
  description: string;
}

/** One account file, mirroring an AIS account-information response. */
export interface AisAccount {
  bank: BankId;
  bankNameAr: string;
  accountId: string;
  iban: string;
  accountType: string;
  currency: "SAR";
  openingDate: string;
  transactions: AisTransaction[];
}

export interface BankSummary {
  bank: BankId;
  bankNameAr: string;
  accountId: string;
  iban: string;
  currency: "SAR";
  currentBalance: number;
  transactionsCount: number;
}

export interface DailyBalance {
  date: string; // YYYY-MM-DD
  hijri: string; // e.g. "1 رجب 1446"
  balance: number;
}

/** A daily balance point enriched with that day's real nisab (silver-price-derived). */
export interface PricedDailyBalance extends DailyBalance {
  nisab: number;
}

export type HawlState =
  | "BELOW_NISAB"
  | "HAWL_STARTED"
  | "HAWL_IN_PROGRESS"
  | "HAWL_BROKEN"
  | "ZAKAT_DUE";

export interface Transition {
  fromState: HawlState;
  toState: HawlState;
  date: string;
  hijri: string;
  balance: number;
  /** key into FIQH_SOURCES, or null for internal transitions */
  source: string | null;
  note: string;
}

/** A zakat-due event in the time simulation (one hawl completion). */
export interface DueEvent {
  date: string; // completion date YYYY-MM-DD
  hijri: string; // completion date, Hijri
  amount: number; // the money whose hawl completed (total, or a lot)
  zakat: number; // 2.5% of amount
  label: string; // human description of the amount
}

/** The two zakat schedules (both anchored at "today") for the simulation. */
export interface SimData {
  today: string;
  horizonDate: string;
  /** the FULL multi-year daily series the sim chart plots (past + future) */
  series: PricedDailyBalance[];
  /** unified-hawl method: one annual event on the total */
  simpleEvents: DueEvent[];
  /** per-amount method: each lot's own hawl → the monthly notifications */
  preciseEvents: DueEvent[];
}

export interface ZakatResult {
  finalState: HawlState;
  total: number;
  nisab: number; // nisab AS OF hawlEndDate (drives the zakat basis/display on ZakatResult)
  nisabWeightGrams: number;
  silverPricePerGram: number; // silver price AS OF hawlEndDate
  silverPriceHijri: string | null; // hawlEndDate, in Hijri (the date that silver price is "as of")
  /** live/current market nisab (today's real date) — informational display only, e.g. Assets page */
  currentNisab: number;
  currentSilverPricePerGram: number;
  currentNisabHijri: string;
  nisabDate: string | null;
  nisabHijri: string | null;
  hawlEndDate: string | null;
  hawlEndHijri: string | null;
  lowestDuringHawl: { date: string; hijri: string; balance: number } | null;
  zakatRate: number;
  zakatAmount: number;
  basisBalance: number;
  /** next hawl (after this one completes): end date + countdown from "today" */
  nextHawlEndDate: string | null;
  nextHawlEndHijri: string | null;
  nextHawlDaysRemaining: number | null;
  /** forward-looking simulation (both fiqh methods) for the "coming years" screen */
  sim: SimData;
  banks: BankSummary[];
  /** daily series capped at "today" (the timeline chart); full series is in `sim` */
  series: PricedDailyBalance[];
  history: Transition[];
  transactionsAnalyzed: number;
}
