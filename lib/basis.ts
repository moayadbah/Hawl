import { ZakatResult } from "./types";

// Which balance the zakat is computed on. "end" = balance at hawl completion —
// zakat on your FULL balance, the well-known & most cautious opinion (الأحوط
// والأشهر, Ibn Baz), the default. "lowest" = lowest balance during the hawl —
// pay only the amount that certainly completed a full hawl now, and get
// notified for the rest of your money as each part completes its own hawl.
// Pure/client-safe — no moment import.
export type Basis = "end" | "lowest";

export const BASIS_LABELS: Record<Basis, string> = {
  end: "رصيد نهاية الحول",
  lowest: "زكاة المال الذي حال عليه الحول",
};

export const BASIS_HINTS: Record<Basis, string> = {
  end: "تُخرج زكاة كامل رصيدك دفعة واحدة كل سنة هجرية عند اكتمال الحول، وتشمل حتى الأموال المضافة حديثًا",
  lowest: "يُخرج زكاة كل مبلغ فور تمام حوله الخاص فقط، دون انتظار بقية رصيدك",
};

// Headline label above the paid amount — differs by basis: "end" zakats the FULL
// current balance (so it's a broader claim than "الزكاة الواجبة"); "lowest" zakats
// only the portion whose hawl has definitively completed, so it keeps the plain label.
export const BASIS_HEADLINE: Record<Basis, string> = {
  end: "زكاة كامل المبلغ المتوفر",
  lowest: "الزكاة الواجبة",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function basisBalance(r: ZakatResult, b: Basis): number {
  return b === "lowest" && r.lowestDuringHawl
    ? r.lowestDuringHawl.balance
    : r.basisBalance;
}

export function basisZakat(r: ZakatResult, b: Basis): number {
  return round2(basisBalance(r, b) * r.zakatRate);
}
