import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faScaleBalanced,
  faPlus,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import { faApple, faGoogle } from "@fortawesome/free-brands-svg-icons";
import { ZakatResult as ZakatResultType } from "@/lib/types";
import {
  Basis,
  BASIS_HEADLINE,
  BASIS_HINTS,
  BASIS_LABELS,
  basisBalance,
  basisZakat,
} from "@/lib/basis";
import { Button } from "@/components/ui/Button";
import { Riyal, formatAmount } from "@/components/ui/Riyal";
import { AlinmaLogo } from "@/components/brand/AlinmaLogo";
import { Session } from "@/lib/client/session";
import {
  CardFormErrors,
  formatCardNumber,
  formatExpiry,
  validateCardForm,
} from "@/lib/client/cardInput";
import { cn } from "@/lib/cn";

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

interface CardData {
  id: string;
  brand: string;
  last4: string;
}

export function ZakatResult({
  result,
  basis,
  onBasisChange,
  onPay,
  onBack,
  payingProvider,
  session,
}: {
  result: ZakatResultType;
  basis: Basis;
  onBasisChange: (b: Basis) => void;
  onPay: (provider: string) => void;
  onBack: () => void;
  payingProvider: string | null;
  session: Session | null;
}) {
  const ratePct = (result.zakatRate * 100).toString();
  const busy = payingProvider !== null;

  const due = result.finalState === "ZAKAT_DUE";
  const lowest = result.lowestDuringHawl;

  const chosenBalance = basisBalance(result, basis);
  const chosenZakat = basisZakat(result, basis);
  // Always offer both fiqh opinions once zakat is due — "lowest" just zakats a
  // smaller (or equal) portion, it's never invalid to offer it.
  const bases: Basis[] = !!lowest ? ["end", "lowest"] : ["end"];

  const [cardFlowOpen, setCardFlowOpen] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvv: "" });
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({});
  const [addingCard, setAddingCard] = useState(false);

  // The card sub-flow's auto-pay cadence follows the basis choice directly — "end"
  // (full balance, annually) → annual; "lowest" (money whose hawl completed) →
  // monthly per lot — so we never ask the user to pick it a second time here.
  const autoPayFrequency: "monthly" | "annual" = basis === "lowest" ? "monthly" : "annual";

  useEffect(() => {
    if (!session || !cardFlowOpen) return;
    fetch(`/api/settings?userId=${session.userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setCards(d.cards);
        setSelectedCardId(d.payment.defaultCardId);
        setAutoPayEnabled(d.payment.autoPayEnabled);
      })
      .catch(() => {});
  }, [session, cardFlowOpen]);

  async function addCard() {
    if (!session) return;
    const errors = validateCardForm(newCard);
    setCardErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const [yy, mm] = newCard.expiry.split("/");
    setAddingCard(true);
    try {
      const res = await fetch("/api/settings/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          cardNumber: newCard.number,
          expMonth: mm,
          expYear: `20${yy}`,
        }),
      });
      const card = await res.json();
      if (res.ok) {
        setCards((c) => [...c, card]);
        setSelectedCardId(card.id);
        setNewCard({ number: "", expiry: "", cvv: "" });
        setCardErrors({});
      }
    } finally {
      setAddingCard(false);
    }
  }

  function confirmCardPayment() {
    if (session) {
      fetch("/api/settings/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          defaultCardId: selectedCardId,
          autoPayEnabled,
          autoPayFrequency,
        }),
      }).catch(() => {});
    }
    onPay("card");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5">
      <div className="mb-4 text-center">
        <h2 className="mb-1 text-headline-lg-mobile text-alinma-navy sm:text-headline-lg">
          نتيجة الزكاة
        </h2>
        <p className="text-alinma-navy/60">
          اكتمل حولك الهجري وهذه زكاتك الواجبة بدقة.
        </p>
      </div>

      <div className={cn(!due && "mx-auto max-w-xl")}>
      <div className={cn(due && "lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-8")}>
      {/* fiqh basis selector — pick which balance the zakat is computed on.
          Styled as a real card (white/border/shadow, like every other card in
          the app) and, now that the amount card is its own grid sibling, both
          stretch to the same row height (`lg:items-stretch`) and center their
          content vertically so the two read as one matched, balanced pair. */}
      {due && (
        <div className="flex flex-col justify-center rounded-card border border-alinma-navy/[0.06] bg-white p-5 shadow-card">
          <p className="mb-3 flex items-center gap-2 text-[13px] font-bold text-alinma-navy">
            <FontAwesomeIcon icon={faScaleBalanced} className="text-alinma-copperDark" />
            اختر طريقة دفع الزكاة:
          </p>
          <div className="space-y-2.5">
            {bases.map((b) => {
              const active = basis === b;
              return (
                <button
                  key={b}
                  onClick={() => onBasisChange(b)}
                  className={cn(
                    "flex w-full flex-col rounded-2xl border bg-white px-4 py-3 text-right transition-all",
                    active
                      ? "border-alinma-lavender ring-2 ring-alinma-lavender/60"
                      : "border-alinma-navy/10 hover:border-alinma-navy/25",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-bold text-alinma-navy">
                      {BASIS_LABELS[b]}
                    </span>
                    <span className="text-[14px] font-bold text-alinma-navy">
                      <Riyal value={basisZakat(result, b)} decimals={2} />
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-alinma-navy/50">
                    {BASIS_HINTS[b]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* headline amount — its own grid item alongside the basis card so
          `lg:items-stretch` equalizes their heights; content stays centered
          via flex so extra stretched space doesn't look like dead air. */}
      <div
        className={cn(
          "relative flex flex-col justify-center overflow-hidden rounded-card p-6 text-center text-white shadow-soft sm:p-7",
          due && "mt-6 lg:mt-0",
        )}
        style={{ background: "#002134" }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-alinma-lavender/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-alinma-copper/15 blur-3xl" />
        <div className="relative">
          <p className="mb-2 text-sm text-white/70">{BASIS_HEADLINE[basis]}</p>
          <div className="text-5xl font-bold sm:text-6xl">
            <Riyal value={chosenZakat} decimals={2} />
          </div>
          <p className="mt-3 text-sm text-white/70">
            الأساس:{" "}
            <span className="text-white">{formatAmount(chosenBalance, 0)}</span> ×{" "}
            {ratePct}%
          </p>
        </div>
      </div>
      </div>

      {/* Alinma primary + other payment methods — full width below both cards */}
      <div className="mt-5">
        {/* Alinma — tagged with a frame, since PIS isn't live yet. The frame hugs the
            button (tight padding) and the legend straddles the border line itself,
            like a fieldset legend, so the two read as one connected element. */}
        <div className="relative mb-5 rounded-pill border-2 border-alinma-copper/40 p-1">
          <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-white px-2 text-[10.5px] font-bold text-alinma-copperDark">
            عند دعم PIS
          </span>
          <Button
            size="lg"
            onClick={() => onPay("alinma")}
            loading={payingProvider === "alinma"}
            disabled={busy}
            className="w-full gap-3"
          >
            {payingProvider === "alinma" ? (
              "جاري تنفيذ الدفع…"
            ) : (
              <>
                دفع مباشر من حسابك البنكي
                <span className="inline-flex items-center rounded-md bg-white/15 px-2.5 py-1">
                  <AlinmaLogo height={18} variant="white" />
                </span>
              </>
            )}
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-3 text-[12.5px] text-alinma-navy/45">
          <span className="h-px flex-1 bg-alinma-navy/10" />
          أو ادفع بطريقة أخرى
          <span className="h-px flex-1 bg-alinma-navy/10" />
        </div>

        {/* Four payment methods in a single row (card, Samsung, Google, Apple) —
            kept to one row instead of stacking the card above the icon row, and
            sized to stay legible without overlapping at narrow widths. Each item
            has `min-w-0` + `truncate` so long labels shrink/ellipsize instead of
            spilling into the next column when the viewport (or browser zoom)
            shrinks. */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* bank card — the "auto-pay" tag sits directly on the button's own top
              border (no separate outer frame), so the button's edge bisects it. */}
          <div className="relative min-w-0">
            <span className="pointer-events-none absolute inset-x-0 top-0 z-10 flex -translate-y-1/2 justify-center">
              <span className="whitespace-nowrap rounded-full bg-white px-1.5 text-[9px] font-bold text-alinma-lavender">
                دفع تلقائي
              </span>
            </span>
            <button
              onClick={() => setCardFlowOpen((v) => !v)}
              disabled={busy}
              className={cn(
                "flex h-12 w-full min-w-0 items-center justify-center gap-1 rounded-pill border px-1 text-[10.5px] font-medium transition-all active:scale-[0.98] disabled:opacity-40",
                cardFlowOpen
                  ? "border-alinma-lavender bg-alinma-lavender/10 text-alinma-navy"
                  : "border-alinma-navy/15 bg-white text-alinma-navy hover:border-alinma-navy/40",
              )}
            >
              {payingProvider === "card" ? (
                <Spinner />
              ) : (
                <>
                  <FontAwesomeIcon icon={faCreditCard} className="shrink-0 text-[12px]" />
                  <span className="truncate">بطاقة</span>
                </>
              )}
            </button>
          </div>

          {/* Samsung Pay */}
          <button
            onClick={() => onPay("samsungpay")}
            disabled={busy}
            className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-pill px-1 text-[10.5px] font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            style={{ background: "#1428A0" }}
          >
            {payingProvider === "samsungpay" ? (
              <Spinner />
            ) : (
              <span className="truncate">Samsung Pay</span>
            )}
          </button>

          {/* Google Pay — logo to the left of the label */}
          <button
            onClick={() => onPay("googlepay")}
            disabled={busy}
            className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-pill border border-alinma-navy/15 bg-white px-1 text-[10.5px] font-medium text-alinma-navy transition-all hover:border-alinma-navy/40 active:scale-[0.98] disabled:opacity-40"
          >
            {payingProvider === "googlepay" ? (
              <Spinner />
            ) : (
              <>
                <span>Pay</span>
                <FontAwesomeIcon icon={faGoogle} className="shrink-0 text-[13px]" />
              </>
            )}
          </button>

          {/* Apple Pay — logo to the left of the label */}
          <button
            onClick={() => onPay("applepay")}
            disabled={busy}
            className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-pill bg-black px-1 text-[10.5px] font-medium text-white transition-all hover:bg-black/85 active:scale-[0.98] disabled:opacity-40"
          >
            {payingProvider === "applepay" ? (
              <Spinner />
            ) : (
              <>
                <span>Pay</span>
                <FontAwesomeIcon icon={faApple} className="shrink-0 text-[14px]" />
              </>
            )}
          </button>
        </div>

        {cardFlowOpen && (
          <div className="mt-4 space-y-3 rounded-card border border-alinma-navy/10 bg-alinma-cream/30 p-4">
            {cards.length > 0 && (
              <div className="space-y-2">
                {cards.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2.5 rounded-xl border border-alinma-navy/10 bg-white px-3 py-2.5"
                  >
                    <input
                      type="radio"
                      name="zakat-card"
                      checked={selectedCardId === c.id}
                      onChange={() => setSelectedCardId(c.id)}
                    />
                    <FontAwesomeIcon icon={faCreditCard} className="text-alinma-navy/40" />
                    <span className="text-[13.5px] text-alinma-navy">
                      {c.brand} •••• {c.last4}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="min-w-0 flex-[2]">
                  <input
                    dir="ltr"
                    value={newCard.number}
                    onChange={(e) => setNewCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                    placeholder="رقم البطاقة"
                    className={cn(
                      "w-full rounded-xl border bg-white px-2.5 py-2 text-right text-[13px] tracking-wide text-alinma-navy outline-none focus:border-alinma-lavender",
                      cardErrors.number ? "border-alinma-red/50" : "border-alinma-navy/15",
                    )}
                  />
                  {cardErrors.number && <p className="mt-1 text-[11px] text-alinma-red">{cardErrors.number}</p>}
                </div>
                <div className="w-[4.5rem] shrink-0">
                  <input
                    dir="ltr"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    placeholder="YY/MM"
                    className={cn(
                      "w-full rounded-xl border bg-white px-2.5 py-2 text-right text-[13px] text-alinma-navy outline-none focus:border-alinma-lavender",
                      cardErrors.expiry ? "border-alinma-red/50" : "border-alinma-navy/15",
                    )}
                  />
                  {cardErrors.expiry && <p className="mt-1 text-[11px] text-alinma-red">{cardErrors.expiry}</p>}
                </div>
                <div className="w-16 shrink-0">
                  <input
                    dir="ltr"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="CVV"
                    className={cn(
                      "w-full rounded-xl border bg-white px-2.5 py-2 text-right text-[13px] text-alinma-navy outline-none focus:border-alinma-lavender",
                      cardErrors.cvv ? "border-alinma-red/50" : "border-alinma-navy/15",
                    )}
                  />
                  {cardErrors.cvv && <p className="mt-1 text-[11px] text-alinma-red">{cardErrors.cvv}</p>}
                </div>
              </div>
              <Button variant="secondary" onClick={addCard} loading={addingCard} className="w-full gap-1.5">
                <FontAwesomeIcon icon={faPlus} className="text-[12px]" /> إضافة بطاقة
              </Button>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-alinma-navy/10 bg-white px-3.5 py-2.5">
              <span className="flex items-center gap-1.5 text-[13px] text-alinma-navy">
                <FontAwesomeIcon icon={faBolt} className="text-alinma-copperDark" />
                {autoPayFrequency === "monthly" ? "تفعيل الدفع التلقائي عند اكتمال كل حول" : "تفعيل الدفع السنوي التلقائي"}
              </span>
              <input
                type="checkbox"
                checked={autoPayEnabled}
                onChange={(e) => setAutoPayEnabled(e.target.checked)}
              />
            </label>

            <Button
              onClick={confirmCardPayment}
              loading={payingProvider === "card"}
              disabled={busy || !selectedCardId}
              className="w-full"
            >
              {payingProvider === "card" ? "جاري تنفيذ الدفع…" : "ادفع بالبطاقة المختارة"}
            </Button>
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            onClick={onBack}
            disabled={busy}
            className="text-sm text-alinma-navy/55 underline-offset-4 hover:underline disabled:opacity-40"
          >
            رجوع إلى سجل الحول
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
