import { HawlState } from "./types";

export const STATE_LABELS_AR: Record<HawlState, string> = {
  BELOW_NISAB: "دون النصاب",
  HAWL_STARTED: "بدأ الحول",
  HAWL_IN_PROGRESS: "الحول جارٍ",
  HAWL_BROKEN: "انكسر الحول",
  ZAKAT_DUE: "الزكاة واجبة",
};

export interface FiqhSource {
  key: string;
  scholar: string;
  topic: string;
  reference: string;
  url: string;
  /** the exact rule it underpins */
  rule: string;
}

/**
 * Documented sources. We say "مبني على فتاوى موثقة" — NOT "محرك معتمد".
 * The team must verify the precise fatwa text/number on these official sites
 * before the final pitch (per the research doc §7.3).
 */
export const FIQH_SOURCES: Record<string, FiqhSource> = {
  ibnBaz: {
    key: "ibnBaz",
    scholar: "الشيخ عبدالعزيز بن باز",
    topic: "زكاة الأموال النقدية ونصاب الفضة",
    reference: "فتاوى زكاة المال: نصاب الفضة (595غ)",
    url: "https://binbaz.org.sa",
    rule: "بلوغ النصاب: متى بلغ الرصيد قيمة 595غ فضة فأكثر يبدأ به الحول.",
  },
  ibnUthaymeen: {
    key: "ibnUthaymeen",
    scholar: "الشيخ محمد بن عثيمين",
    topic: "اشتراط استمرار النصاب طوال الحول وضمّ الأموال",
    reference: "الشرح الممتع / فتاوى الزكاة",
    url: "https://binothaimeen.net",
    rule: "انكسار الحول: نزول الرصيد دون النصاب في أي يوم يُلغي الحول الجاري.",
  },
  ijma: {
    key: "ijma",
    scholar: "إجماع أهل العلم",
    topic: "تمام الحول (السنة القمرية)",
    reference: "الإجماع على اشتراط حولان الحول الهجري",
    url: "https://www.alifta.gov.sa",
    rule: "وجوب الزكاة: مرور سنة هجرية كاملة والرصيد فوق النصاب.",
  },
};

export interface TransitionRule {
  from: HawlState;
  to: HawlState;
  condition: string;
  source: string | null;
}

/** The transition table = the "fiqh engine". Each row maps a rule to its source. */
export const TRANSITION_TABLE: TransitionRule[] = [
  {
    from: "BELOW_NISAB",
    to: "HAWL_STARTED",
    condition: "بلغ الرصيد النصاب (595غ × سعر الفضة) فأكثر",
    source: "ibnBaz",
  },
  {
    from: "HAWL_STARTED",
    to: "HAWL_IN_PROGRESS",
    condition: "مرّ يوم والرصيد فوق النصاب",
    source: null,
  },
  {
    from: "HAWL_IN_PROGRESS",
    to: "HAWL_BROKEN",
    condition: "نزل الرصيد دون النصاب في أي يوم",
    source: "ibnUthaymeen",
  },
  {
    from: "HAWL_IN_PROGRESS",
    to: "ZAKAT_DUE",
    condition: "مرّت سنة هجرية كاملة فوق النصاب",
    source: "ijma",
  },
  {
    from: "HAWL_BROKEN",
    to: "HAWL_STARTED",
    condition: "عاد الرصيد إلى النصاب فأكثر (دورة جديدة)",
    source: "ibnBaz",
  },
];
