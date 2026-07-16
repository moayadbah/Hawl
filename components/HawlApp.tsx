"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { BankId, ZakatResult } from "@/lib/types";
import { Basis, basisZakat } from "@/lib/basis";
import { BANK_ORDER } from "@/components/bankVisuals";
import { Header, Footer } from "@/components/AppShell";
import { Stepper } from "@/components/ui/Stepper";
import { Welcome } from "@/components/screens/Welcome";
import { Auth } from "@/components/screens/Auth";
import { SettingsPanel } from "@/components/screens/SettingsPanel";
import { ConnectBanks, ConnState } from "@/components/screens/ConnectBanks";
import { AssetsDashboard } from "@/components/screens/AssetsDashboard";
import { HawlTimeline } from "@/components/screens/HawlTimeline";
import { ZakatResult as ZakatResultScreen } from "@/components/screens/ZakatResult";
import { PaymentSuccess, PaymentInfo } from "@/components/screens/PaymentSuccess";
import { HawlSimulation, SimMethod, eventKey } from "@/components/screens/HawlSimulation";
import { Sources } from "@/components/screens/Sources";
import { Session, getSession, setSession as persistSession, clearSession } from "@/lib/client/session";

type Step =
  | "welcome"
  | "auth"
  | "connect"
  | "assets"
  | "timeline"
  | "result"
  | "paid"
  | "sim"
  | "sources";

const STEP_INDEX: Partial<Record<Step, number>> = {
  connect: 0,
  assets: 1,
  timeline: 2,
  result: 3,
};

const initialConn = (): Record<BankId, ConnState> => ({
  alinma: { status: "idle" },
  rajhi: { status: "idle" },
  snb: { status: "idle" },
});

export function HawlApp() {
  const [step, setStep] = useState<Step>("welcome");
  const [session, setSession] = useState<Session | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conn, setConn] = useState<Record<BankId, ConnState>>(initialConn);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [payingProvider, setPayingProvider] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [basis, setBasis] = useState<Basis>("end");
  // time simulation: chosen fiqh method, the simulated "today", and which
  // due-events have been "paid" (namespaced keys, both methods).
  const [method, setMethod] = useState<SimMethod>("simple");
  const [paidKeys, setPaidKeys] = useState<string[]>([]);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [sourcesReturnStep, setSourcesReturnStep] = useState<Step>("welcome");

  function openSources() {
    setSourcesReturnStep(step);
    setStep("sources");
  }

  useEffect(() => {
    setSession(getSession());
  }, []);

  // Restores any banks the user previously linked (re-fetches each one's live summary
  // so the UI never shows "connected" without real balance data). Called both when the
  // session first resolves AND every time the user re-enters the flow from Welcome
  // (home() clears `conn` in memory, but the link itself is still saved server-side).
  function restoreBankLinks(userId: string) {
    fetch(`/api/bank-link?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((links: Record<string, string>) => {
        for (const bank of BANK_ORDER) {
          if (links[bank] === "connected") connect(bank, { persist: false });
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!session) return;
    restoreBankLinks(session.userId);
  }, [session?.userId]);

  // Restore the last-chosen zakat basis so returning users see their own preference.
  useEffect(() => {
    if (!session) return;
    fetch(`/api/settings?userId=${session.userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.payment?.basis === "end" || d?.payment?.basis === "lowest") {
          setBasis(d.payment.basis);
        }
      })
      .catch(() => {});
  }, [session?.userId]);

  function changeBasis(b: Basis) {
    setBasis(b);
    if (session) {
      fetch("/api/settings/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId, basis: b }),
      }).catch(() => {});
    }
  }

  function authenticated(s: Session) {
    persistSession(s);
    setSession(s);
    setStep("connect");
  }

  function logout() {
    clearSession();
    setSession(null);
    home();
  }

  function phoneChanged() {
    setSettingsOpen(false);
    logout();
  }

  async function connect(bank: BankId, opts?: { persist?: boolean }): Promise<boolean> {
    setError(null);
    setConn((c) => ({ ...c, [bank]: { status: "loading" } }));
    try {
      const res = await fetch("/api/connect-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank }),
      });
      if (!res.ok) throw new Error(`connect-bank ${res.status}`);
      const data = await res.json();
      setConn((c) => ({
        ...c,
        [bank]: { status: "connected", summary: data.summary },
      }));
      if (opts?.persist !== false && session) {
        fetch("/api/bank-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.userId, bank }),
        }).catch(() => {});
      }
      return true;
    } catch {
      setConn((c) => ({ ...c, [bank]: { status: "idle" } }));
      setError("تعذّر الاتصال بالبنك، اضغط «اضغط للربط» للمحاولة مرة أخرى.");
      return false;
    }
  }

  function unlink(bank: BankId) {
    setConn((c) => ({ ...c, [bank]: { status: "idle" } }));
    if (session) {
      fetch("/api/bank-link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.userId, bank }),
      }).catch(() => {});
    }
  }

  async function analyze() {
    const banks = BANK_ORDER.filter((b) => conn[b].status === "connected");
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banks }),
      });
      if (!res.ok) throw new Error(`analyze ${res.status}`);
      const data: ZakatResult = await res.json();
      setResult(data);
      setStep("assets");
    } catch {
      setError("تعذّر تحليل البيانات، اضغط «احسب الحول والزكاة» للمحاولة مرة أخرى.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function pay(provider: string) {
    if (!result) return;
    setError(null);
    setPayingProvider(provider);
    try {
      const amount = basisZakat(result, basis);
      const res = await fetch("/api/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, provider }),
      });
      if (!res.ok) throw new Error(`mock-pay ${res.status}`);
      const data = await res.json();
      setPayment({
        reference: data.reference,
        amount: data.amount,
        provider: data.provider,
      });
      // seed the simulation: today's zakat (just paid) marks the "today" event in
      // BOTH methods as paid, and "today" = the first hawl completion.
      const today = result.sim.today;
      const seed: string[] = [];
      const s0 = result.sim.simpleEvents.find((e) => e.date === today);
      if (s0) seed.push(eventKey("simple", s0));
      const p0 = result.sim.preciseEvents.find((e) => e.date === today);
      if (p0) seed.push(eventKey("precise", p0));
      setPaidKeys(seed);
      setAsOf(today);
      setStep("paid");
    } catch {
      setError("تعذّر تنفيذ الدفع، اختر وسيلة الدفع مرة أخرى.");
    } finally {
      setPayingProvider(null);
    }
  }

  function paySimEvent(key: string) {
    setPaidKeys((p) => (p.includes(key) ? p : [...p, key]));
  }

  function home() {
    setStep("welcome");
    setConn(initialConn());
    setResult(null);
    setPayment(null);
    setError(null);
    setBasis("end");
    setMethod("simple");
    setPaidKeys([]);
    setAsOf(null);
  }

  const stepIndex = STEP_INDEX[step];

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onHome={home}
        session={session}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
      />

      <main className="flex flex-1 flex-col py-6 lg:py-8">
        {stepIndex !== undefined && (
          <div className="mx-auto mb-4 w-full max-w-6xl px-5">
            <Stepper current={stepIndex} />
          </div>
        )}

        {error && (
          <div className="mx-auto mb-3 w-full max-w-3xl px-5">
            <div className="flex items-center gap-3 rounded-2xl border border-alinma-red/25 bg-alinma-red/[0.06] px-4 py-2.5 text-[13.5px] text-alinma-navy/80">
              <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0 text-alinma-red" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                aria-label="إغلاق"
                className="shrink-0 rounded-full p-1 text-alinma-navy/45 transition-colors hover:text-alinma-navy"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col lg:min-h-0 lg:justify-center">
          {step === "welcome" && (
            <Welcome
              onStart={() => {
                if (session) {
                  restoreBankLinks(session.userId);
                  setStep("connect");
                } else {
                  setStep("auth");
                }
              }}
            />
          )}

          {step === "auth" && <Auth onAuthenticated={authenticated} />}

          {step === "connect" && (
            <ConnectBanks
              conn={conn}
              onConnect={connect}
              onUnlink={unlink}
              onAnalyze={analyze}
              analyzing={analyzing}
            />
          )}

          {step === "assets" && result && (
            <AssetsDashboard
              result={result}
              onNext={() => setStep("timeline")}
              onBack={() => setStep("connect")}
            />
          )}

          {step === "timeline" && result && (
            <HawlTimeline
              result={result}
              onNext={() => setStep("result")}
              onBack={() => setStep("assets")}
            />
          )}

          {step === "result" && result && (
            <ZakatResultScreen
              result={result}
              basis={basis}
              onBasisChange={changeBasis}
              onPay={pay}
              onBack={() => setStep("timeline")}
              payingProvider={payingProvider}
              session={session}
            />
          )}

          {step === "paid" && payment && result && (
            <PaymentSuccess
              payment={payment}
              result={result}
              onSimulate={() => setStep("sim")}
              onHome={home}
              session={session}
            />
          )}

          {step === "sim" && result && asOf && (
            <HawlSimulation
              result={result}
              method={method}
              onMethodChange={setMethod}
              asOf={asOf}
              onAsOfChange={setAsOf}
              paidKeys={paidKeys}
              onPayEvent={paySimEvent}
              onBack={() => setStep("paid")}
              onHome={home}
            />
          )}

          {step === "sources" && <Sources onBack={() => setStep(sourcesReturnStep)} />}
        </div>
      </main>

      <Footer onOpenSources={openSources} />

      {settingsOpen && session && (
        <SettingsPanel
          session={session}
          onClose={() => setSettingsOpen(false)}
          onPhoneChanged={phoneChanged}
        />
      )}
    </div>
  );
}
