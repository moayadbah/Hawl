/**
 * Splits an already-formatted Hijri string ("1446 رجب 1") into month/year
 * parts for chart axis rendering. Pure string parsing, zero dependencies —
 * safe to import from client components (unlike lib/hijri.ts, which pulls in
 * moment-hijri and must stay server-side).
 */
export function hijriMonthYear(hijri: string): { month: string; year: string } | null {
  const parts = hijri.split(" ");
  if (parts.length < 3) return null;
  const [year, ...rest] = parts;
  const month = rest.slice(0, -1).join(" "); // drop the day, keep the (possibly 2-word) month
  return { month, year };
}
