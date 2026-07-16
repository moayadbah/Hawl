import { useState } from "react";
import { BankId, BankSummary } from "@/lib/types";
import { BANK_ORDER, BANK_VISUALS } from "@/components/bankVisuals";
import { AlinmaLogo } from "@/components/brand/AlinmaLogo";
import { RajhiLogo } from "@/components/brand/RajhiLogo";
import { SnbLogo } from "@/components/brand/SnbLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faLinkSlash, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Riyal } from "@/components/ui/Riyal";
import { cn } from "@/lib/cn";

export type ConnState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "connected"; summary: BankSummary };

function BankLogo({ bank, height }: { bank: BankId; height: number }) {
  if (bank === "alinma") {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-2xl bg-alinma-navy px-2.5">
        <AlinmaLogo height={height} variant="white" />
      </div>
    );
  }
  if (bank === "rajhi") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005EB8]">
        <RajhiLogo height={height} variant="white" />
      </div>
    );
  }
  if (bank === "snb") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00754A]">
        <SnbLogo height={height} variant="white" />
      </div>
    );
  }
  return null;
}

export function ConnectBanks({
  conn,
  onConnect,
  onUnlink,
  onAnalyze,
  analyzing,
}: {
  conn: Record<BankId, ConnState>;
  onConnect: (bank: BankId) => Promise<boolean>;
  onUnlink: (bank: BankId) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}) {
  const connectedCount = BANK_ORDER.filter(
    (b) => conn[b].status === "connected",
  ).length;

  // Mock consent-flow modal: "redirecting to the bank" → brief "linked ✓" — mirrors
  // the real Open Banking AIS handoff without actually leaving the app.
  const [modal, setModal] = useState<{ bank: BankId; phase: "connecting" | "success" } | null>(null);

  async function handleConnect(bank: BankId) {
    setModal({ bank, phase: "connecting" });
    const ok = await onConnect(bank);
    if (ok) {
      setModal({ bank, phase: "success" });
      setTimeout(() => setModal(null), 1000);
    } else {
      setModal(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-headline-lg-mobile text-alinma-navy sm:text-headline-lg">
          اربط حساباتك البنكية
        </h2>
        <p className="text-alinma-navy/60">
          نجلب أرصدتك وتاريخ معاملاتك عبر المصرفية المفتوحة بموافقتك الصريحة.
        </p>
      </div>

      <div className="space-y-3">
        {BANK_ORDER.map((bank) => {
          const v = BANK_VISUALS[bank];
          const state = conn[bank];
          const isAlinma = bank === "alinma";
          return (
            <div
              key={bank}
              className={cn(
                "flex items-center justify-between gap-3 rounded-card border bg-white p-4 shadow-card transition-colors",
                state.status === "connected"
                  ? "border-alinma-lavender/40"
                  : "border-alinma-navy/[0.06]",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <BankLogo bank={bank} height={28} />
                <div className="min-w-0">
                  <div className="font-bold leading-snug text-alinma-navy">
                    {v.nameAr}
                  </div>
                  {state.status === "connected" ? (
                    <div className="text-[13px] text-alinma-navy/55">
                      <Riyal value={state.summary.currentBalance} decimals={0} />
                    </div>
                  ) : (
                    <div className="text-[13px] text-alinma-navy/45">
                      {isAlinma ? "الخيار المفضل للدفع" : "متاح للربط"}
                    </div>
                  )}
                </div>
              </div>

              {state.status === "connected" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-alinma-lavender/12 px-4 py-2 text-sm font-medium text-alinma-lavender">
                    <FontAwesomeIcon icon={faCircleCheck} /> متصل
                  </span>
                  <button
                    onClick={() => onUnlink(bank)}
                    aria-label="إلغاء الربط"
                    title="إلغاء الربط"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-alinma-navy/35 transition-colors hover:bg-alinma-red/[0.08] hover:text-alinma-red"
                  >
                    <FontAwesomeIcon icon={faLinkSlash} className="text-[13px]" />
                  </button>
                </div>
              ) : (
                <Button
                  variant={isAlinma ? "primary" : "secondary"}
                  onClick={() => handleConnect(bank)}
                  loading={state.status === "loading"}
                  className="shrink-0"
                >
                  {state.status === "loading" ? "جاري الربط…" : "اضغط للربط"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-sm text-alinma-navy/55">
          {connectedCount} من {BANK_ORDER.length} حسابات مربوطة
        </p>
        <Button
          size="lg"
          onClick={onAnalyze}
          disabled={connectedCount === 0}
          loading={analyzing}
          className="w-full sm:w-auto sm:px-12"
        >
          {analyzing ? "نحلل بياناتك…" : "احسب الحول والزكاة"}
        </Button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-alinma-navy/40 backdrop-blur-sm" />
          <div className="relative flex w-full max-w-xs flex-col items-center gap-4 rounded-card bg-white p-7 text-center shadow-lift">
            {modal.phase === "connecting" ? (
              <>
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-alinma-cream text-alinma-navy/60">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-xl" />
                  <span className="absolute inset-0 animate-spin rounded-full border-2 border-alinma-lavender border-t-transparent" />
                </span>
                <p className="font-bold text-alinma-navy">
                  جاري تحويلك إلى {BANK_VISUALS[modal.bank].nameAr}
                </p>
                <p className="text-[13px] text-alinma-navy/55">
                  لإتمام الربط عبر المصرفية المفتوحة…
                </p>
              </>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-alinma-lavender/15 text-2xl text-alinma-lavender">
                  <FontAwesomeIcon icon={faCircleCheck} />
                </span>
                <p className="font-bold text-alinma-navy">تم الربط بنجاح</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
