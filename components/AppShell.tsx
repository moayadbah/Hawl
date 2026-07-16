"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faGear, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { HawlLogo } from "@/components/brand/HawlLogo";
import { Session } from "@/lib/client/session";

export function Header({
  onHome,
  session,
  onOpenSettings,
  onLogout,
}: {
  onHome?: () => void;
  session?: Session | null;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-alinma-navy/[0.06] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <button onClick={onHome} className="transition-opacity hover:opacity-80">
          <HawlLogo size={34} />
        </button>

        <div className="flex items-center gap-4">
          {session && (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label="الحساب"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-alinma-navy text-base text-white shadow-soft ring-2 ring-white transition-transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faUser} />
              </button>

              {open && (
                <>
                  <button
                    aria-label="إغلاق"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="absolute left-0 top-11 z-40 w-56 rounded-2xl border border-alinma-navy/[0.08] bg-white p-2 shadow-lift">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-bold text-alinma-navy">
                        {session.isGuest ? "ضيف" : session.displayName || "مستخدم"}
                      </p>
                      {session.phone && (
                        <p dir="ltr" className="text-left text-[12.5px] text-alinma-navy/50">
                          {session.phone}
                        </p>
                      )}
                    </div>
                    <div className="my-1 h-px bg-alinma-navy/[0.06]" />
                    <button
                      onClick={() => {
                        setOpen(false);
                        onOpenSettings?.();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-alinma-navy transition-colors hover:bg-alinma-cream/50"
                    >
                      <FontAwesomeIcon icon={faGear} className="text-alinma-navy/45" />
                      الإعدادات
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        onLogout?.();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-alinma-red transition-colors hover:bg-alinma-red/[0.06]"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} />
                      تسجيل الخروج
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer({ onOpenSources }: { onOpenSources: () => void }) {
  return (
    <footer className="mt-8 border-t border-alinma-navy/[0.06] bg-alinma-sand/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-1 px-5 py-3 text-center sm:py-2.5">
        <HawlLogo size={20} />
        <button
          onClick={onOpenSources}
          className="text-[12px] text-alinma-navy/45 underline-offset-4 hover:text-alinma-navy/70 hover:underline"
        >
          طريقة حساب الزكاة
        </button>
      </div>
    </footer>
  );
}
