"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoon,
  faCircleCheck,
  faArrowRotateLeft,
  faHourglassHalf,
  faFlask,
} from "@fortawesome/free-solid-svg-icons";
import { DueEvent, ZakatResult } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Riyal } from "@/components/ui/Riyal";
import { hijriMonthYear, makeHijriXAxisTick } from "@/components/charts/HijriXAxisTick";

export type SimMethod = "simple" | "precise";

/** Stable identity for a due event (namespaced by method) — used for paid tracking. */
export function eventKey(method: SimMethod, ev: DueEvent): string {
  return `${method[0]}|${ev.date}|${ev.label}`;
}

// ── client-side UTC date helpers (no moment on the client) ──
function addDays(d: string, n: number): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function addMonths(d: string, n: number): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCMonth(dt.getUTCMonth() + n);
  return dt.toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
function clampDate(d: string, lo: string, hi: string): string {
  return d < lo ? lo : d > hi ? hi : d;
}
function clampNum(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}
function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

const G_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
function gregLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${G_MONTHS[(m ?? 1) - 1]} ${y}`;
}

interface ChartPoint {
  date: string;
  hijri: string;
  past: number | null;
  future: number | null;
}

/** Same tooltip language as the HawlTimeline chart (Hijri date + balance, dir="rtl"
 *  so <Riyal/>'s internal spans don't get flipped by the chart's LTR wrapper). */
function Tip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as ChartPoint | undefined;
  const v = payload.find((x: any) => x.value != null)?.value;
  if (!p) return null;
  return (
    <div dir="rtl" className="rounded-2xl border border-alinma-navy/10 bg-white px-3 py-2 shadow-lift">
      <div className="text-[12px] text-alinma-navy/55">{p.hijri}</div>
      <div className="font-bold text-alinma-navy">
        <Riyal value={v ?? 0} decimals={0} />
      </div>
    </div>
  );
}

export function HawlSimulation({
  result,
  method,
  onMethodChange,
  asOf,
  onAsOfChange,
  paidKeys,
  onPayEvent,
  onBack,
  onHome,
}: {
  result: ZakatResult;
  method: SimMethod;
  onMethodChange: (m: SimMethod) => void;
  asOf: string;
  onAsOfChange: (d: string) => void;
  paidKeys: string[];
  onPayEvent: (key: string) => void;
  onBack: () => void;
  onHome: () => void;
}) {
  const { sim, nisab } = result;
  const { series, today, horizonDate } = sim;
  const events = method === "simple" ? sim.simpleEvents : sim.preciseEvents;
  const paidSet = useMemo(() => new Set(paidKeys), [paidKeys]);
  const isPaid = (ev: DueEvent) => paidSet.has(eventKey(method, ev));

  // Balance drops by each PAID event's zakat from its date onward → the line
  // visibly steps down whenever the user pays.
  const reductions = useMemo(
    () =>
      events
        .filter(isPaid)
        .map((e) => ({ date: e.date, amt: e.zakat }))
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [events, paidSet],
  );
  const reducedAt = (d: string) =>
    reductions.reduce((s, r) => (r.date <= d ? s + r.amt : s), 0);
  const displayedAt = (d: string) => {
    const raw = series.find((p) => p.date === d)?.balance ?? 0;
    return Math.max(0, Math.round((raw - reducedAt(d)) * 100) / 100);
  };

  const chartData = useMemo<ChartPoint[]>(
    () =>
      series.map((p) => {
        const v = Math.max(0, Math.round((p.balance - reducedAt(p.date)) * 100) / 100);
        return {
          date: p.date,
          hijri: p.hijri,
          past: p.date <= asOf ? v : null,
          future: p.date >= asOf ? v : null,
        };
      }),
    [series, asOf, reductions],
  );

  // Same Hijri axis-tick rendering as the HawlTimeline chart — month on-screen
  // left, year on-screen right — so the two charts read identically.
  const tickMap = useMemo(() => {
    const m = new Map<string, { month: string; year: string }>();
    chartData.forEach((d) => {
      const my = hijriMonthYear(d.hijri);
      if (my) m.set(d.date, my);
    });
    return m;
  }, [chartData]);
  const XAxisTick = makeHijriXAxisTick(tickMap);

  const totalDays = Math.max(1, daysBetween(today, horizonDate));
  const offset = clampNum(daysBetween(today, asOf), 0, totalDays);
  const move = (d: string) => onAsOfChange(clampDate(d, today, horizonDate));

  // status at the simulated "today"
  const reached = events.filter((e) => e.date <= asOf);
  const dueUnpaid = reached.find((e) => !isPaid(e));
  const nextEvent = events.find((e) => e.date > asOf);
  const paidCount = events.filter(isPaid).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <div className="mb-3 text-center">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-pill bg-alinma-copper/15 px-2.5 py-1 text-[11px] font-bold text-alinma-copperDark">
          <FontAwesomeIcon icon={faFlask} className="text-[10px]" />
          عرض توضيحي · ليس جزءاً من المنتج
        </span>
        <h2 className="mb-1 text-headline-lg-mobile text-alinma-navy sm:text-headline-lg">
          محاكاة الأعوام القادمة
        </h2>
        <p className="text-[13.5px] text-alinma-navy/60 sm:text-sm">
          حرّك الزمن وشاهد متى تجب الزكاة مجدداً في كل طريقة، وكيف ينقص رصيدك عند الدفع.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[1.55fr_1fr] lg:items-start lg:gap-6">
        {/* ── chart + time controls ── */}
        <div>
          <Card className="p-4 sm:p-5">
            <div className="h-[230px] w-full sm:h-[250px] lg:h-[268px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 14, right: 14, bottom: 6, left: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0021341a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={<XAxisTick x={0} y={0} payload={{ value: "" }} />}
                    interval="preserveStartEnd"
                    minTickGap={44}
                    tickMargin={8}
                    stroke="#00213433"
                  />
                  <YAxis
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)} K` : `${v}`)}
                    tick={{ fontSize: 11, fill: "#42474c" }}
                    width={62}
                    stroke="#00213433"
                  />
                  <Tooltip content={<Tip />} />
                  {/* nisab held fixed at the price on the day your first hawl completed —
                      we can't predict future silver-market prices, so this line never
                      projects forward; see the legend note below the chart. */}
                  <ReferenceLine y={nisab} stroke="#ba1a1a" strokeDasharray="6 4" strokeWidth={1.5} />
                  {/* past = solid, future = faint (you haven't lived it yet) */}
                  <Line type="monotone" dataKey="future" stroke="#807cd5" strokeOpacity={0.32} strokeWidth={2.2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="past" stroke="#807cd5" strokeWidth={2.6} dot={false} connectNulls={false} />
                  {/* due-event markers (filled = paid) */}
                  {events.map((e) => (
                    <ReferenceDot
                      key={eventKey(method, e)}
                      x={e.date}
                      y={displayedAt(e.date)}
                      r={method === "simple" ? 5 : 4}
                      fill={isPaid(e) ? "#807cd5" : "#fff"}
                      stroke="#002134"
                      strokeWidth={2}
                    />
                  ))}
                  {/* "today" cursor */}
                  <ReferenceLine x={asOf} stroke="#002134" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* legend */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-alinma-navy/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-alinma-lavender" /> رصيدك
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-5" style={{ background: "#002134" }} /> اليوم
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-alinma-navy bg-white" /> زكاة مستحقة
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0 w-5 border-t-2 border-dashed border-alinma-red" /> النصاب (ثابت)
              </span>
            </div>

            {/* clarifies, per method, what each dot on the chart actually represents —
                and why the nisab line above never changes: we can't predict future
                silver-market prices, so it's held fixed at today's real value. */}
            <p className="mt-2 text-center text-[11.5px] leading-relaxed text-alinma-navy/45">
              {method === "simple"
                ? "كل نقطة على الخط هنا حول سنوي موحّد على كامل رصيدك في تلك اللحظة، والنصاب المرسوم ثابت بسعر يوم اكتمال حولك الأول."
                : "كل نقطة على الخط هنا اكتمال حول مبلغ واحد أُضيف لحسابك، يُحسب بشكل مستقل عن بقية أموالك، والنصاب المرسوم ثابت بسعر يوم اكتمال حولك الأول."}
            </p>
          </Card>

          {/* time controls */}
          <div className="mt-3 rounded-card border border-alinma-navy/[0.06] bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between text-[12.5px]">
              <span className="text-alinma-navy/55">اليوم (محاكاة)</span>
              <span className="tnum font-medium text-alinma-navy">{gregLabel(asOf)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalDays}
              value={offset}
              onChange={(e) => move(addDays(today, Number(e.target.value)))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-alinma-navy/15 accent-alinma-navy"
              dir="ltr"
            />
            {/* stepping granularity follows the active method: the precise/monthly
                method reveals one lot's due-bubble at a time, so navigation is
                month-by-month; the simple/annual method only ever changes once a
                year, so navigation jumps by the year instead. */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              {method === "precise" ? (
                <>
                  <StepBtn onClick={() => move(addMonths(asOf, -1))}>−شهر</StepBtn>
                  <StepBtn onClick={() => move(addMonths(asOf, 1))}>+شهر</StepBtn>
                </>
              ) : (
                <>
                  <StepBtn onClick={() => move(addMonths(asOf, -12))}>−سنة</StepBtn>
                  <StepBtn onClick={() => move(addMonths(asOf, 12))}>+سنة</StepBtn>
                </>
              )}
              <StepBtn onClick={() => move(today)}>
                <FontAwesomeIcon icon={faArrowRotateLeft} className="text-[11px]" /> إعادة
              </StepBtn>
            </div>
          </div>
        </div>

        {/* ── method toggle + notification/status ── */}
        <div className="mt-4 lg:mt-0">
          {/* method toggle */}
          <div className="rounded-card border border-alinma-navy/[0.06] bg-white p-3 shadow-card">
            <div className="flex rounded-pill bg-alinma-navy/[0.05] p-1">
              <ToggleBtn active={method === "simple"} onClick={() => onMethodChange("simple")}>
                مبسّطة · سنوي
              </ToggleBtn>
              <ToggleBtn active={method === "precise"} onClick={() => onMethodChange("precise")}>
                دقيقة · لكل مبلغ
              </ToggleBtn>
            </div>
            <p className="mt-2 px-1 text-[12px] leading-relaxed text-alinma-navy/55">
              {method === "simple"
                ? "حول موحّد: زكاة 2.5% على إجمالي المال مرة كل سنة. الأيسر، مناسب للأفراد."
                : "لكل مبلغ حوله الخاص: إشعار فور اكتمال حول أي مبلغ فوق النصاب، وقد تمر أشهر بلا أي استحقاق. الأدق."}
            </p>
            <p className="mt-2 border-t border-alinma-navy/[0.06] px-1 pt-2 text-[11px] leading-relaxed text-alinma-navy/40">
              الفرق الجوهري: السنوية تدفع كل شيء دفعة واحدة كل عام، والدقيقة تدفع كل مبلغ فقط بعد اكتمال حوله المستقل به.
            </p>
          </div>

          {/* notification / status */}
          <div className="mt-3">
            {dueUnpaid ? (
              method === "precise" ? (
                <IMessage ev={dueUnpaid} onPay={() => onPayEvent(eventKey(method, dueUnpaid))} />
              ) : (
                <Card className="border-alinma-lavender/40 p-5">
                  <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-alinma-lavender">
                    <FontAwesomeIcon icon={faMoon} /> زكاة الحول السنوي مستحقة
                  </div>
                  <p className="text-[13px] text-alinma-navy/65">
                    اكتمل حول جديد في{" "}
                    <span className="font-bold text-alinma-navy">{dueUnpaid.hijri}</span>{" "}
                    والمال ما زال فوق النصاب.
                  </p>
                  <div className="mt-3 text-3xl font-bold text-alinma-navy">
                    <Riyal value={dueUnpaid.zakat} decimals={2} />
                  </div>
                  <Button
                    onClick={() => onPayEvent(eventKey(method, dueUnpaid))}
                    size="lg"
                    className="mt-3 w-full"
                  >
                    ادفع زكاة هذا الحول
                  </Button>
                </Card>
              )
            ) : (
              <Card className="p-5">
                <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-alinma-navy/70">
                  <FontAwesomeIcon icon={faHourglassHalf} className="text-alinma-copperDark" />
                  لا زكاة مستحقة حاليًا
                </div>
                {nextEvent ? (
                  <p className="text-[13.5px] leading-relaxed text-alinma-navy/70">
                    الاستحقاق القادم في{" "}
                    <span className="font-bold text-alinma-navy">{nextEvent.hijri}</span>
                    {", بعد نحو "}
                    <span className="font-bold text-alinma-navy">
                      {Math.max(0, daysBetween(asOf, nextEvent.date))}
                    </span>{" "}
                    يوماً.
                  </p>
                ) : (
                  <p className="text-[13.5px] text-alinma-navy/70">
                    انتهت فترة المحاكاة المعروضة.
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* running tally */}
          <div className="mt-3 flex items-center gap-2 rounded-card bg-alinma-cream/50 px-4 py-3 text-[13px] text-alinma-navy/70">
            <FontAwesomeIcon icon={faCircleCheck} className="shrink-0 text-alinma-lavender" />
            <span>
              أدّيت زكاة{" "}
              <span className="font-bold text-alinma-navy">{paidCount}</span>{" "}
              {method === "simple"
                ? paidCount === 1
                  ? "حول"
                  : "أحوال"
                : paidCount === 1
                  ? "دفعة"
                  : "دفعات"}{" "}
              في هذه الطريقة.
            </span>
          </div>

          {/* navigation */}
          <div className="mt-3 flex items-center gap-3">
            <Button variant="secondary" onClick={onBack} className="flex-1">
              رجوع
            </Button>
            <Button variant="secondary" onClick={onHome} className="flex-1">
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** iPhone-style incoming message announcing a due amount this month. */
function IMessage({ ev, onPay }: { ev: DueEvent; onPay: () => void }) {
  return (
    <Card className="p-4">
      {/* sender row */}
      <div className="mb-2.5 flex items-center justify-center gap-2 text-[11px] text-alinma-navy/45">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-alinma-lavender/15 text-alinma-lavender">
          <FontAwesomeIcon icon={faMoon} className="text-[10px]" />
        </span>
        <span className="font-bold text-alinma-navy/70">حَوْل</span>
        <span>·</span>
        <span className="tnum">{gregLabel(ev.date)}</span>
      </div>

      {/* incoming gray bubble (start-aligned → right in RTL) */}
      <div className="flex justify-start">
        <div className="relative max-w-[88%] rounded-[20px] rounded-tr-[6px] bg-[#e9e9eb] px-4 py-2.5 text-[13px] leading-relaxed text-[#0d0d0d]">
          اكتمل حول <span className="font-bold">{ev.label}</span> ومقداره{" "}
          <span className="font-bold">
            <Riyal value={ev.amount} decimals={0} />
          </span>{" "}
          وهو فوق النصاب. زكاته المستحقة{" "}
          <span className="font-bold">
            <Riyal value={ev.zakat} decimals={2} />
          </span>
          .
        </div>
      </div>
      <div className="mt-1 pr-1 text-right text-[10.5px] text-alinma-navy/40">
        تم التسليم
      </div>

      <Button onClick={onPay} size="lg" className="mt-3 w-full">
        ادفع زكاة هذه الدفعة
      </Button>
    </Card>
  );
}

function StepBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-alinma-navy/15 bg-white px-3.5 text-[13px] font-medium text-alinma-navy transition-all hover:border-alinma-navy/40 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 rounded-pill py-2 text-[13px] font-bold transition-all " +
        (active
          ? "bg-white text-alinma-navy shadow-card"
          : "text-alinma-navy/55 hover:text-alinma-navy")
      }
    >
      {children}
    </button>
  );
}
