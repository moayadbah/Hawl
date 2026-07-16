"use client";

import { useState } from "react";
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
  faCircle,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { ZakatResult } from "@/lib/types";
import { STATE_LABELS_AR } from "@/lib/fiqhRules";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Riyal } from "@/components/ui/Riyal";
import { hijriMonthYear, makeHijriXAxisTick } from "@/components/charts/HijriXAxisTick";

interface Point {
  date: string;
  hijri: string;
  balance: number;
  nisab: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: Point = payload[0].payload;
  return (
    <div dir="rtl" className="rounded-2xl border border-alinma-navy/10 bg-white px-3 py-2 shadow-lift">
      <div className="text-[12px] text-alinma-navy/55">{p.hijri}</div>
      <div className="font-bold text-alinma-navy">
        <Riyal value={p.balance} decimals={0} />
      </div>
      <div className="mt-0.5 text-[11px] text-alinma-red/80">
        النصاب ذلك اليوم: <Riyal value={p.nisab} decimals={0} />
      </div>
    </div>
  );
}

export function HawlTimeline({
  result,
  onNext,
  onBack,
}: {
  result: ZakatResult;
  onNext: () => void;
  onBack: () => void;
}) {
  const data = result.series;
  const tickMap = new Map<string, { month: string; year: string }>();
  data.forEach((d) => {
    const my = hijriMonthYear(d.hijri);
    if (my) tickMap.set(d.date, my);
  });
  const XAxisTick = makeHijriXAxisTick(tickMap);

  const balanceAt = (date: string | null) =>
    date ? data.find((d) => d.date === date)?.balance ?? 0 : 0;

  const milestones = result.history.filter((h) => h.source);

  // milestone ↔ chart linking: clicking a milestone highlights it on the chart
  const [activeDate, setActiveDate] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <div className="mb-4 text-center">
        <h2 className="mb-1 text-headline-lg-mobile text-alinma-navy sm:text-headline-lg">
          سجل الحول
        </h2>
        <p className="text-sm text-alinma-navy/60 sm:text-base">
          رصيدك اليومي عبر الزمن مع لحظة بلوغ النصاب واكتمال الحول الهجري.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-6">
      <Card className="p-4 sm:p-5">
        <div className="h-[240px] w-full sm:h-[280px] lg:h-[360px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0021341a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={<XAxisTick x={0} y={0} payload={{ value: "" }} />}
                interval="preserveStartEnd"
                minTickGap={56}
                tickMargin={8}
                stroke="#00213433"
              />
              <YAxis
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)} K` : `${v}`)}
                tick={{ fontSize: 11, fill: "#42474c" }}
                width={62}
                stroke="#00213433"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="nisab"
                stroke="#ba1a1a"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#807cd5"
                strokeWidth={2.6}
                dot={false}
                activeDot={{ r: 5, fill: "#002134" }}
              />
              {result.nisabDate && (
                <ReferenceDot
                  x={result.nisabDate}
                  y={balanceAt(result.nisabDate)}
                  r={6}
                  fill="#845142"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
              {result.hawlEndDate && (
                <ReferenceDot
                  x={result.hawlEndDate}
                  y={balanceAt(result.hawlEndDate)}
                  r={7}
                  fill="#002134"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
              {activeDate && (
                <ReferenceLine
                  x={activeDate}
                  stroke="#807cd5"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
              )}
              {activeDate && (
                <ReferenceDot
                  x={activeDate}
                  y={balanceAt(activeDate)}
                  r={9}
                  fill="#807cd5"
                  fillOpacity={0.35}
                  stroke="#807cd5"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[12.5px] text-alinma-navy/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-alinma-lavender" /> الرصيد اليومي
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-alinma-copper" /> بلوغ النصاب
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-alinma-navy" /> اكتمال الحول
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-2 border-dashed border-alinma-red" />{" "}
            خط النصاب
          </span>
        </div>
      </Card>

      {/* milestones */}
      <div className="mt-4 space-y-2 lg:mt-0 lg:max-h-[432px] lg:overflow-y-auto lg:pl-1">
        {milestones.map((m, i) => {
          const isDue = m.toState === "ZAKAT_DUE";
          const isBroken = m.toState === "HAWL_BROKEN";
          const isActive = activeDate === m.date;
          return (
            <Card
              key={i}
              onClick={() => setActiveDate(isActive ? null : m.date)}
              title="اضغط لإبرازها على المخطط"
              className={
                "flex cursor-pointer gap-3 p-3 transition-shadow " +
                (isDue ? "border-alinma-lavender/40 " : "") +
                (isActive
                  ? "ring-2 ring-alinma-lavender shadow-lift"
                  : "hover:border-alinma-navy/20")
              }
            >
              <div
                className={
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-alinma-cream text-sm " +
                  (isDue
                    ? "text-alinma-navy"
                    : isBroken
                      ? "text-alinma-red"
                      : "text-alinma-copper")
                }
              >
                <FontAwesomeIcon icon={isDue ? faMoon : faCircle} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-bold text-alinma-navy">{m.hijri}</span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-alinma-navy/55">
                    {STATE_LABELS_AR[m.fromState]}
                    <FontAwesomeIcon icon={faArrowLeft} className="text-[10px] text-alinma-navy/35" />
                    {STATE_LABELS_AR[m.toState]}
                  </span>
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-alinma-navy/65">
                  {m.note}
                </p>
              </div>
            </Card>
          );
        })}

      </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={onBack}>
          رجوع
        </Button>
        <Button size="lg" onClick={onNext} className="sm:px-12">
          عرض نتيجة الزكاة
          <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
        </Button>
      </div>
    </div>
  );
}
