"use client";

import { useState, FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faUser, faEnvelope, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HawlMark } from "@/components/brand/HawlLogo";
import { Session } from "@/lib/client/session";

type Phase = "phone" | "verifying" | "profile";

const inputClass =
  "w-full rounded-pill border border-alinma-navy/15 bg-white py-3 pr-11 pl-4 text-[15px] text-alinma-navy outline-none transition-colors focus:border-alinma-lavender disabled:opacity-60";

export function Auth({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPhone(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^05\d{8}$/.test(phone)) {
      setError("رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.");
      return;
    }
    setPhase("verifying");
    // Mock OTP verification delay — no real code is sent.
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "");
      if (data.isNew) {
        setPendingUserId(data.userId);
        setPhase("profile");
      } else {
        onAuthenticated({
          userId: data.userId,
          phone,
          displayName: data.displayName,
          email: data.email,
          isGuest: false,
        });
      }
    } catch {
      setError("تعذّر تسجيل الدخول، حاول مرة أخرى.");
      setPhase("phone");
    }
  }

  async function submitProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pendingUserId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, displayName: name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "تعذّر حفظ البيانات.");
      onAuthenticated({
        userId: pendingUserId,
        phone,
        displayName: data.displayName,
        email: data.email,
        isGuest: false,
      });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "تعذّر حفظ البيانات.");
    } finally {
      setBusy(false);
    }
  }

  async function continueAsGuest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "");
      onAuthenticated({
        userId: data.userId,
        phone: data.phone ?? "0500000000",
        displayName: data.displayName ?? "ضيف",
        email: data.email ?? "guest@gmail.com",
        isGuest: true,
      });
    } catch {
      setError("تعذّر إنشاء حساب ضيف، حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-5">
      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex justify-center">
          <HawlMark size={56} />
        </div>

        {phase !== "profile" ? (
          <>
            <h2 className="mb-1 text-center text-title-md text-alinma-navy">تسجيل الدخول</h2>
            <p className="mb-6 text-center text-sm text-alinma-navy/55">أدخل رقم جوالك للمتابعة</p>
            <form onSubmit={submitPhone} className="space-y-3">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-alinma-navy/35"
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="05XXXXXXXX"
                  disabled={phase === "verifying"}
                  className={inputClass + " text-left tracking-wide"}
                />
              </div>
              {error && <p className="text-center text-[13px] text-alinma-red">{error}</p>}
              <Button type="submit" size="lg" loading={phase === "verifying"} className="w-full">
                {phase === "verifying" ? "جاري التحقق من الرقم…" : "متابعة"}
              </Button>
            </form>
            <button
              onClick={continueAsGuest}
              disabled={busy || phase === "verifying"}
              className="mt-4 block w-full text-center text-[13px] font-medium text-alinma-lavender underline-offset-4 hover:underline disabled:opacity-40"
            >
              استمرار كضيف
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-center text-title-md text-alinma-navy">أكمل بياناتك</h2>
            <p className="mb-6 text-center text-sm text-alinma-navy/55">
              أول مرة لك، أدخل اسمك وبريدك الإلكتروني
            </p>
            <form onSubmit={submitProfile} className="space-y-3">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-alinma-navy/35"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم"
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-alinma-navy/35"
                />
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={inputClass + " text-left"}
                />
              </div>
              {error && <p className="text-center text-[13px] text-alinma-red">{error}</p>}
              <Button type="submit" size="lg" loading={busy} className="w-full">
                متابعة
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
