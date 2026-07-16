"use client";

import { useEffect, useState, FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faUser,
  faCreditCard,
  faBell,
  faTrash,
  faPlus,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { Session } from "@/lib/client/session";
import {
  CardFormErrors,
  formatCardNumber,
  formatExpiry,
  validateCardForm,
} from "@/lib/client/cardInput";

type Tab = "profile" | "payment" | "notification";

interface CardData {
  id: string;
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
}

interface SettingsData {
  profile: { displayName: string | null; phone: string | null; email: string | null };
  payment: {
    autoPayEnabled: boolean;
    autoPayFrequency: "monthly" | "annual";
    defaultCardId: string | null;
    basis: "end" | "lowest";
  };
  notification: {
    enabled: boolean;
    remindBeforeDays: number;
    notifySms: boolean;
    notifyEmail: boolean;
  };
  cards: CardData[];
}

const REMIND_OPTIONS = [3, 5, 7, 30];
const TABS: { id: Tab; label: string; icon: typeof faUser }[] = [
  { id: "profile", label: "الملف الشخصي", icon: faUser },
  { id: "payment", label: "المدفوعات", icon: faCreditCard },
  { id: "notification", label: "الإشعارات", icon: faBell },
];

const inputClass =
  "w-full rounded-xl border border-alinma-navy/15 bg-white px-3.5 py-2.5 text-[14px] text-alinma-navy outline-none transition-colors focus:border-alinma-lavender";

export function SettingsPanel({
  session,
  onClose,
  onPhoneChanged,
}: {
  session: Session;
  onClose: () => void;
  onPhoneChanged: () => void;
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const [data, setData] = useState<SettingsData | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvv: "" });
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({});
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    fetch(`/api/settings?userId=${session.userId}`)
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setData(d);
        setName(d.profile.displayName ?? "");
        setEmail(d.profile.email ?? "");
        setPhone(d.profile.phone ?? "");
      });
  }, [session.userId]);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const patch: Record<string, string> = {};
    if (name !== data?.profile.displayName) patch.displayName = name;
    if (email !== data?.profile.email) patch.email = email;
    const phoneEdited = phone !== (data?.profile.phone ?? "");
    if (phoneEdited) patch.phone = phone;
    if (Object.keys(patch).length === 0) return;

    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, ...patch }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "تعذّر حفظ البيانات.");
      return;
    }
    if (json.phoneChanged) {
      onPhoneChanged();
      return;
    }
    flashSaved();
  }

  async function savePayment(patch: Partial<SettingsData["payment"]>) {
    setData((d) => (d ? { ...d, payment: { ...d.payment, ...patch } } : d));
    await fetch("/api/settings/payment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, ...patch }),
    });
    flashSaved();
  }

  async function saveNotification(patch: Partial<SettingsData["notification"]>) {
    setData((d) => (d ? { ...d, notification: { ...d.notification, ...patch } } : d));
    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, ...patch }),
    });
    flashSaved();
  }

  async function addCard(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
      if (!res.ok) throw new Error(card.error || "تعذّر إضافة البطاقة.");
      setData((d) => (d ? { ...d, cards: [...d.cards, card] } : d));
      setNewCard({ number: "", expiry: "", cvv: "" });
      setCardErrors({});
      flashSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إضافة البطاقة.");
    } finally {
      setAddingCard(false);
    }
  }

  async function deleteCard(cardId: string) {
    setData((d) =>
      d
        ? {
            ...d,
            cards: d.cards.filter((c) => c.id !== cardId),
            payment: d.payment.defaultCardId === cardId ? { ...d.payment, defaultCardId: null } : d.payment,
          }
        : d,
    );
    await fetch("/api/settings/cards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, cardId }),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="إغلاق" onClick={onClose} className="absolute inset-0 bg-alinma-navy/40 backdrop-blur-sm" />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-card bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-alinma-navy/[0.06] px-5 py-4">
          <h2 className="text-lg font-bold text-alinma-navy">الإعدادات</h2>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-[12.5px] text-alinma-lavender">
                <FontAwesomeIcon icon={faCheck} /> تم الحفظ
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="rounded-full p-1.5 text-alinma-navy/45 transition-colors hover:bg-alinma-cream/60 hover:text-alinma-navy"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b border-alinma-navy/[0.06] px-5 py-2.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12.5px] font-medium transition-colors sm:px-3.5 sm:text-[13px]",
                tab === t.id
                  ? "bg-alinma-navy text-white"
                  : "text-alinma-navy/55 hover:bg-alinma-cream/60",
              )}
            >
              <FontAwesomeIcon icon={t.icon} className="text-[11px]" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!data ? (
            <p className="py-8 text-center text-sm text-alinma-navy/45">جاري التحميل…</p>
          ) : (
            <>
              {error && (
                <p className="mb-3 rounded-xl bg-alinma-red/[0.06] px-3 py-2 text-[12.5px] text-alinma-red">
                  {error}
                </p>
              )}

              {tab === "profile" && (
                <form onSubmit={saveProfile} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[12.5px] text-alinma-navy/55">الاسم</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12.5px] text-alinma-navy/55">رقم الجوال</label>
                    <input
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={inputClass + " text-left"}
                    />
                    <p className="mt-1 text-[11.5px] text-alinma-navy/40">
                      تغيير الرقم يتطلب تسجيل الدخول مرة أخرى بالرقم الجديد.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12.5px] text-alinma-navy/55">البريد الإلكتروني</label>
                    <input
                      dir="ltr"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass + " text-left"}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    حفظ التغييرات
                  </Button>
                </form>
              )}

              {tab === "payment" && (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-[12.5px] font-bold text-alinma-navy/70">البطاقات المحفوظة</p>
                    <div className="space-y-2">
                      {data.cards.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-alinma-navy/10 px-3 py-2.5"
                        >
                          <label className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              checked={data.payment.defaultCardId === c.id}
                              onChange={() => savePayment({ defaultCardId: c.id })}
                            />
                            <FontAwesomeIcon icon={faCreditCard} className="text-alinma-navy/40" />
                            <span className="text-[13.5px] text-alinma-navy">
                              {c.brand} •••• {c.last4}
                            </span>
                          </label>
                          <button
                            onClick={() => deleteCard(c.id)}
                            aria-label="حذف البطاقة"
                            className="rounded-full p-1.5 text-alinma-navy/35 hover:bg-alinma-red/[0.08] hover:text-alinma-red"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
                          </button>
                        </div>
                      ))}
                      {data.cards.length === 0 && (
                        <p className="text-[12.5px] text-alinma-navy/40">لا توجد بطاقات محفوظة بعد.</p>
                      )}
                    </div>
                    <form onSubmit={addCard} className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-[2]">
                          <input
                            dir="ltr"
                            value={newCard.number}
                            onChange={(e) => setNewCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                            placeholder="رقم البطاقة"
                            className={cn(inputClass, "text-right tracking-wide", cardErrors.number && "border-alinma-red/50")}
                          />
                          {cardErrors.number && <p className="mt-1 text-[11px] text-alinma-red">{cardErrors.number}</p>}
                        </div>
                        <div className="w-24 shrink-0">
                          <input
                            dir="ltr"
                            value={newCard.expiry}
                            onChange={(e) => setNewCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                            placeholder="YY/MM"
                            className={cn(inputClass, "text-right", cardErrors.expiry && "border-alinma-red/50")}
                          />
                          {cardErrors.expiry && <p className="mt-1 text-[11px] text-alinma-red">{cardErrors.expiry}</p>}
                        </div>
                        <div className="w-20 shrink-0">
                          <input
                            dir="ltr"
                            value={newCard.cvv}
                            onChange={(e) => setNewCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                            placeholder="CVV"
                            className={cn(inputClass, "text-right", cardErrors.cvv && "border-alinma-red/50")}
                          />
                          {cardErrors.cvv && <p className="mt-1 text-[11px] text-alinma-red">{cardErrors.cvv}</p>}
                        </div>
                      </div>
                      <Button type="submit" variant="secondary" loading={addingCard} className="w-full gap-1.5">
                        <FontAwesomeIcon icon={faPlus} className="text-[12px]" /> إضافة بطاقة
                      </Button>
                    </form>
                  </div>

                  <div className="h-px bg-alinma-navy/[0.06]" />

                  <div>
                    <p className="mb-2 text-[12.5px] font-bold text-alinma-navy/70">الدفع التلقائي</p>
                    <label className="flex items-center justify-between rounded-xl border border-alinma-navy/10 px-3.5 py-3">
                      <span className="text-[13.5px] text-alinma-navy">تفعيل الدفع التلقائي للزكاة</span>
                      <input
                        type="checkbox"
                        checked={data.payment.autoPayEnabled}
                        onChange={(e) => savePayment({ autoPayEnabled: e.target.checked })}
                      />
                    </label>
                    {data.payment.autoPayEnabled && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {(["monthly", "annual"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => savePayment({ autoPayFrequency: f })}
                            className={cn(
                              "rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors",
                              data.payment.autoPayFrequency === f
                                ? "border-alinma-lavender bg-alinma-lavender/10 text-alinma-navy"
                                : "border-alinma-navy/10 text-alinma-navy/55",
                            )}
                          >
                            {f === "monthly" ? "دقيقة: زكاة كل مبلغ عند تمام حوله" : "سنوي: على كامل المبلغ"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "notification" && (
                <div className="space-y-4">
                  <label className="flex items-center justify-between rounded-xl border border-alinma-navy/10 px-3.5 py-3">
                    <span className="text-[13.5px] text-alinma-navy">تفعيل التنبيهات</span>
                    <input
                      type="checkbox"
                      checked={data.notification.enabled}
                      onChange={(e) => saveNotification({ enabled: e.target.checked })}
                    />
                  </label>

                  <div>
                    <p className="mb-2 text-[12.5px] font-bold text-alinma-navy/70">
                      التنبيه قبل اكتمال الحول بـ
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {REMIND_OPTIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => saveNotification({ remindBeforeDays: d })}
                          className={cn(
                            "rounded-xl border px-2 py-2.5 text-[13px] font-medium transition-colors",
                            data.notification.remindBeforeDays === d
                              ? "border-alinma-lavender bg-alinma-lavender/10 text-alinma-navy"
                              : "border-alinma-navy/10 text-alinma-navy/55",
                          )}
                        >
                          {d === 30 ? "شهر" : `${d} أيام`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between rounded-xl border border-alinma-navy/10 px-3.5 py-3">
                      <span className="text-[13.5px] text-alinma-navy">تنبيه عبر رسالة نصية</span>
                      <input
                        type="checkbox"
                        checked={data.notification.notifySms}
                        onChange={(e) => saveNotification({ notifySms: e.target.checked })}
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-alinma-navy/10 px-3.5 py-3">
                      <span className="text-[13.5px] text-alinma-navy">تنبيه عبر البريد الإلكتروني</span>
                      <input
                        type="checkbox"
                        checked={data.notification.notifyEmail}
                        onChange={(e) => saveNotification({ notifyEmail: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
