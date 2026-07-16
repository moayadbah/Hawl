import { BankId } from "@/lib/types";

export interface BankVisual {
  nameAr: string;
  /** badge background for non-Alinma banks (Alinma uses its real logo) */
  badgeBg: string;
  badgeText: string;
  initials: string;
}

export const BANK_VISUALS: Record<BankId, BankVisual> = {
  alinma: {
    nameAr: "مصرف الإنماء",
    badgeBg: "#ffffff",
    badgeText: "#002134",
    initials: "إ",
  },
  rajhi: {
    nameAr: "مصرف الراجحي",
    badgeBg: "#005EB8",
    badgeText: "#ffffff",
    initials: "ر",
  },
  snb: {
    nameAr: "البنك الأهلي السعودي",
    badgeBg: "#00754A",
    badgeText: "#ffffff",
    initials: "AH",
  },
};

export const BANK_ORDER: BankId[] = ["alinma", "rajhi", "snb"];
