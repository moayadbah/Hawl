// Plain validation/formatting logic (no DOM dependency) — usable from client
// components and server API routes alike.
import valid from "card-validator";

/** Live-format a card number with a space every 4 digits as the user types. */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Live-format the expiry field as a single YY/MM input — year first, then month. */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export interface CardFormErrors {
  number?: string;
  expiry?: string;
  cvv?: string;
}

/**
 * Mock-payment validation — this is a prototype with no real card network, so the
 * number check is deliberately lenient (16 digits, no Luhn/brand-range check): any
 * 16-digit number is accepted. Expiry (must be a real, non-expired month) and CVV
 * length still use real checks via card-validator.
 */
export function validateCardForm(fields: { number: string; expiry: string; cvv: string }): CardFormErrors {
  const errors: CardFormErrors = {};

  const digits = fields.number.replace(/\s/g, "");
  if (!/^\d{16}$/.test(digits)) {
    errors.number = "رقم البطاقة يجب أن يتكون من 16 رقمًا.";
  }

  const [yy, mm] = fields.expiry.split("/");
  if (!yy || !mm || mm.length < 2) {
    errors.expiry = "أدخل تاريخ الانتهاء كاملًا (YY/MM).";
  } else {
    const expResult = valid.expirationDate(`${mm}/${yy}`);
    if (!expResult.isValid) {
      errors.expiry = "تاريخ الانتهاء غير صحيح أو منتهٍ.";
    }
  }

  const cvvSize = valid.number(digits).card?.code.size ?? 3;
  const cvvResult = valid.cvv(fields.cvv, cvvSize);
  if (!cvvResult.isValid) {
    errors.cvv = `رمز الأمان يجب أن يكون ${cvvSize} أرقام.`;
  }

  return errors;
}

// Maps card-validator's detected type to this app's DB-allowed brand set
// (payment_cards.brand CHECK constraint: mada|visa|mastercard|amex). Anything
// outside Visa/Mastercard/Amex falls back to "mada" (the generic/local bucket).
const BRAND_MAP: Record<string, "visa" | "mastercard" | "amex"> = {
  visa: "visa",
  mastercard: "mastercard",
  "american-express": "amex",
};

export function cardBrandName(number: string): "mada" | "visa" | "mastercard" | "amex" {
  const result = valid.number(number.replace(/\s/g, ""));
  const type = result.card?.type;
  return (type && BRAND_MAP[type]) || "mada";
}
