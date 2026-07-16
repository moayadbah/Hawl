"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faMoon,
  faBell,
  faShareNodes,
  faDownload,
  faForward,
  faFlask,
} from "@fortawesome/free-solid-svg-icons";
import { ZakatResult } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Riyal, formatAmount } from "@/components/ui/Riyal";
import { AlinmaLogo } from "@/components/brand/AlinmaLogo";
import { Session } from "@/lib/client/session";

export interface PaymentInfo {
  reference: string;
  amount: number;
  provider: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  alinma: "مصرف الإنماء",
  card: "بطاقة بنكية",
  applepay: "Apple Pay",
  samsungpay: "Samsung Pay",
  googlepay: "Google Pay",
};

// The self-hosted fonts the receipt actually uses, inlined as data URIs so the
// captured image renders the real typeface + Riyal glyph without a cross-origin
// fetch. Computed once and cached. IBM Plex Sans Arabic ships as separate
// Arabic-script and Latin (digits/reference number) subset files per weight —
// both are inlined with their own unicode-range so glyphs resolve correctly.
const RECEIPT_FONTS = [
  { family: "IBM Plex Sans Arabic", weight: "400", url: "/fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-400-normal.woff", range: "U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E" },
  { family: "IBM Plex Sans Arabic", weight: "400", url: "/fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-400-normal.woff", range: "U+0000-00FF,U+2000-206F" },
  { family: "IBM Plex Sans Arabic", weight: "500", url: "/fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-500-normal.woff", range: "U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E" },
  { family: "IBM Plex Sans Arabic", weight: "500", url: "/fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-500-normal.woff", range: "U+0000-00FF,U+2000-206F" },
  { family: "IBM Plex Sans Arabic", weight: "700", url: "/fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-700-normal.woff", range: "U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E" },
  { family: "IBM Plex Sans Arabic", weight: "700", url: "/fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-700-normal.woff", range: "U+0000-00FF,U+2000-206F" },
  { family: "sarfont", weight: "400", url: "/fonts/sarfont.woff" },
];
let fontCssCache: string | null = null;
async function sameOriginFontCss(): Promise<string> {
  if (fontCssCache !== null) return fontCssCache;
  const faces = await Promise.all(
    RECEIPT_FONTS.map(async (f) => {
      const blob = await (await fetch(f.url)).blob();
      const dataUrl: string = await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(blob);
      });
      const range = "range" in f && f.range ? `unicode-range:${f.range};` : "";
      return `@font-face{font-family:"${f.family}";font-weight:${f.weight};font-style:normal;${range}src:url(${dataUrl}) format("woff");}`;
    }),
  );
  fontCssCache = faces.join("\n");
  return fontCssCache;
}

export function PaymentSuccess({
  payment,
  result,
  onSimulate,
  onHome,
  session,
}: {
  payment: PaymentInfo;
  result: ZakatResult;
  onSimulate: () => void;
  onHome: () => void;
  session: Session | null;
}) {
  const [reminded, setReminded] = useState(false);
  const [autoPayFrequency, setAutoPayFrequency] = useState<"monthly" | "annual">("annual");
  const [working, setWorking] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/settings?userId=${session.userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setAutoPayFrequency(d.payment.autoPayFrequency);
        setReminded(d.notification.enabled);
      })
      .catch(() => {});
  }, [session]);

  function remindMe() {
    setReminded(true);
    if (session) {
      fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId, enabled: true }),
      }).catch(() => {});
    }
  }

  // Next due date, respecting the chosen auto-pay cadence: monthly follows the
  // precise per-lot schedule (only the money that completes its own hawl next),
  // annual keeps the full-year countdown on the whole balance.
  const nextPreciseEvent =
    autoPayFrequency === "monthly"
      ? result.sim.preciseEvents.find((e) => e.date > result.sim.today)
      : undefined;

  const providerLabel = PROVIDER_LABELS[payment.provider] ?? payment.provider;

  const caption =
    `زكاة حَوْل: تم الدفع بنجاح\n` +
    `المبلغ: ${formatAmount(payment.amount, 2)} ريال\n` +
    `عبر: ${providerLabel}\n` +
    `رقم العملية: ${payment.reference}\n` +
    (result.hawlEndHijri ? `اكتمال الحول: ${result.hawlEndHijri}` : "");

  const fileName = `hawl-receipt-${payment.reference}.png`;

  // Render the receipt DOM (#receipt) to a PNG blob. html-to-image preserves the
  // real fonts (IBM Plex Sans Arabic + the Riyal sarfont glyph), RTL, and the Alinma SVG.
  // We inline ONLY the same-origin fonts as `fontEmbedCSS` so html-to-image never
  // fetches the cross-origin Google-Fonts @import (which would taint the canvas and
  // make toBlob return null).
  async function buildReceiptPng(): Promise<Blob | null> {
    const node = document.getElementById("receipt");
    if (!node) return null;
    try {
      await document.fonts.ready;
      const fontEmbedCSS = await sameOriginFontCss();
      const { toBlob } = await import("html-to-image");
      return await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        fontEmbedCSS,
      });
    } catch {
      return null;
    }
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function flashDownloaded() {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  }

  // Share the receipt IMAGE together with the text caption where the device
  // supports file sharing; otherwise fall back to downloading the image.
  async function share() {
    if (working) return;
    setWorking(true);
    try {
      const blob = await buildReceiptPng();
      if (blob) {
        const file = new File([blob], fileName, { type: "image/png" });
        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: caption });
          return;
        }
        downloadBlob(blob);
        flashDownloaded();
        return;
      }
      // last resort if the image couldn't be built: share the text only
      if (navigator.share) await navigator.share({ text: caption });
    } catch {
      /* user cancelled the share sheet, or an error — ignore */
    } finally {
      setWorking(false);
    }
  }

  async function downloadImage() {
    if (working) return;
    setWorking(true);
    try {
      const blob = await buildReceiptPng();
      if (blob) {
        downloadBlob(blob);
        flashDownloaded();
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5">
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* ── the receipt (clean node — printed & captured as image) ── */}
        <Card id="receipt" className="overflow-hidden p-8 text-center animate-scale-in">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-alinma-lavender/15">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-alinma-lavender text-2xl text-white">
              <FontAwesomeIcon icon={faCheck} />
            </div>
          </div>
          <h2 className="mb-6 text-2xl font-bold text-alinma-navy">تم الدفع بنجاح</h2>

          <div className="space-y-2.5 rounded-card bg-alinma-cream/50 p-5 text-right">
            <Row label="المبلغ المدفوع">
              <span className="font-bold text-alinma-navy">
                <Riyal value={payment.amount} decimals={2} />
              </span>
            </Row>
            <Row label="عبر">
              {payment.provider === "alinma" ? (
                <span className="inline-flex items-center rounded-xl bg-alinma-navy px-3 py-1.5">
                  <AlinmaLogo height={16} variant="white" />
                </span>
              ) : (
                <span className="font-medium text-alinma-navy">{providerLabel}</span>
              )}
            </Row>
            <Row label="رقم العملية">
              <span className="tnum text-[13px] font-medium text-alinma-navy/80">
                {payment.reference}
              </span>
            </Row>
            {result.hawlEndHijri && (
              <Row label="اكتمال الحول">
                <span className="text-[13px] font-medium text-alinma-navy/80">
                  {result.hawlEndHijri}
                </span>
              </Row>
            )}
          </div>
        </Card>

        {/* ── actions ── */}
        <div className="mt-6 lg:mt-0">
          {/* share the receipt as an image + caption, or download it */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={share}
              disabled={working}
              className="flex h-11 items-center justify-center gap-2 rounded-pill border border-alinma-navy/15 bg-white text-[13.5px] font-medium text-alinma-navy transition-all hover:border-alinma-navy/40 active:scale-[0.98] disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faShareNodes} />
              مشاركة الإيصال
            </button>
            <button
              onClick={downloadImage}
              disabled={working}
              className="flex h-11 items-center justify-center gap-2 rounded-pill border border-alinma-navy/15 bg-white text-[13.5px] font-medium text-alinma-navy transition-all hover:border-alinma-navy/40 active:scale-[0.98] disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faDownload} />
              تنزيل الصورة
            </button>
          </div>
          <p
            className={
              "mt-2 text-center text-[12px] text-alinma-lavender transition-opacity " +
              (downloaded ? "opacity-100" : "opacity-0")
            }
          >
            تم تنزيل صورة الإيصال ✓
          </p>

          {/* the cycle continues — next due date, respecting the auto-pay cadence */}
          {(nextPreciseEvent || result.nextHawlEndHijri) && (
            <div className="rounded-card bg-alinma-navy/[0.04] px-4 py-3.5 text-right">
              <p className="flex items-center gap-2 text-[13.5px] leading-relaxed text-alinma-navy/80">
                <FontAwesomeIcon icon={faMoon} className="shrink-0 text-alinma-lavender" />
                {nextPreciseEvent ? (
                  <span>
                    دفعة الزكاة القادمة في{" "}
                    <span className="font-bold text-alinma-navy">{nextPreciseEvent.hijri}</span>
                    {" "}(<Riyal value={nextPreciseEvent.zakat} decimals={2} /> عن {nextPreciseEvent.label})
                  </span>
                ) : (
                  <span>
                    حولك القادم يكتمل في{" "}
                    <span className="font-bold text-alinma-navy">{result.nextHawlEndHijri}</span>
                    {result.nextHawlDaysRemaining !== null && (
                      <> (بعد نحو {result.nextHawlDaysRemaining} يوماً)</>
                    )}
                  </span>
                )}
              </p>
              <button
                onClick={reminded ? undefined : remindMe}
                disabled={reminded}
                className={
                  "mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-pill text-[13.5px] font-medium transition-all active:scale-[0.98] " +
                  (reminded
                    ? "bg-alinma-lavender/12 text-alinma-lavender"
                    : "border border-alinma-navy/15 bg-white text-alinma-navy hover:border-alinma-navy/40")
                }
              >
                <FontAwesomeIcon icon={reminded ? faCheck : faBell} />
                {reminded ? "سنذكّرك قبل اكتمال حولك" : "ذكّرني قبل اكتمال الحول"}
              </button>
            </div>
          )}

          {/* demo-only: hypothetical future-years simulation (not in the product) */}
          <div className="mt-4 rounded-card border border-dashed border-alinma-navy/20 bg-alinma-navy/[0.03] p-4">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-alinma-copper/15 px-2.5 py-1 text-[11px] font-bold text-alinma-copperDark">
              <FontAwesomeIcon icon={faFlask} className="text-[10px]" />
              عرض توضيحي
            </span>
            <p className="mt-2 text-[12.5px] leading-relaxed text-alinma-navy/60">
              محاكاة افتراضية تُظهر كيف تتكرر الزكاة في سيناريوهات مختلفة للأعوام القادمة.
              ليست جزءاً من المنتج النهائي.
            </p>
            <Button onClick={onSimulate} size="lg" className="mt-3 w-full gap-2">
              <FontAwesomeIcon icon={faForward} className="text-sm" />
              شاهد محاكاة الأعوام القادمة
            </Button>
          </div>

          <Button onClick={onHome} variant="secondary" className="mt-3 w-full">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-alinma-navy/55">{label}</span>
      {children}
    </div>
  );
}
