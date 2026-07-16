import moment from "moment-hijri";

// moment-hijri defaults to an Arabic locale, which renders Arabic-Indic digits
// in format() output. Force Latin digits for all machine-readable dates.
moment.locale("en");

const pad2 = (n: number) => String(n).padStart(2, "0");

export const HIJRI_MONTHS_AR = [
  "محرّم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

export interface HijriParts {
  iy: number;
  im: number; // 0-based
  id: number;
}

export function toHijriParts(gregorian: string): HijriParts {
  const m = moment(gregorian, "YYYY-MM-DD");
  return { iy: m.iYear(), im: m.iMonth(), id: m.iDate() };
}

/** "1446 رجب 1" — year, month, day (Arabic convention: year read first, right-to-left). */
export function formatHijri(gregorian: string): string {
  const { iy, im, id } = toHijriParts(gregorian);
  return `${iy} ${HIJRI_MONTHS_AR[im]} ${id}`;
}

/** Add one full Hijri (lunar) year, returns Gregorian YYYY-MM-DD (Latin digits). */
export function addHijriYear(gregorian: string): string {
  const m = moment(gregorian, "YYYY-MM-DD").add(1, "iYear");
  // Build from numeric parts to be locale/digit-safe.
  return `${m.year()}-${pad2(m.month() + 1)}-${pad2(m.date())}`;
}

/** Inclusive day count between two Gregorian dates. */
export function daysBetween(start: string, end: string): number {
  return moment(end, "YYYY-MM-DD").diff(moment(start, "YYYY-MM-DD"), "days");
}

/** "15 يناير 2025" — Gregorian, Arabic. */
export function formatGregorianAr(gregorian: string): string {
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  const m = moment(gregorian, "YYYY-MM-DD");
  return `${m.date()} ${months[m.month()]} ${m.year()}`;
}
