import { hijriMonthYear } from "@/lib/client/hijriTick";

export { hijriMonthYear };

/**
 * Recharts XAxis custom tick: month on-screen left, year on-screen right, via
 * two separately-positioned <tspan>s. `unicode-bidi: bidi-override` (tried in
 * an earlier round) forces every character — including the Arabic month word
 * — into strict DOM order, which breaks Arabic glyph shaping (letters render
 * scrambled). Two explicitly-positioned tspans fix left/right placement
 * without touching bidi resolution at all, so the Arabic word renders
 * normally. Shared by HawlTimeline and HawlSimulation so both charts render
 * Hijri axis dates identically.
 */
export function makeHijriXAxisTick(tickMap: Map<string, { month: string; year: string }>) {
  return function HijriXAxisTick({
    x,
    y,
    payload,
  }: {
    x: number;
    y: number;
    payload: { value: string };
  }) {
    const my = tickMap.get(payload.value);
    if (!my) return null;
    return (
      <text y={y + 9} fontSize={10} fill="#42474c" fontFamily="IBM Plex Sans Arabic">
        <tspan x={x - 3} textAnchor="end">
          {my.month}
        </tspan>
        <tspan x={x + 3} textAnchor="start">
          {my.year}
        </tspan>
      </text>
    );
  };
}
