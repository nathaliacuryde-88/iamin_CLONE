/**
 * Build deep links into payment apps so users can settle a tab in one tap.
 * All values are user-provided handles — we URL-encode and never trust raw input.
 */
export type PayProvider = "paypal" | "n26" | "revolut";

export interface PayLinkInput {
  handle: string;
  amountCents: number;
  currency: string;
  note?: string;
}

const amountStr = (cents: number) => (cents / 100).toFixed(2);
const cleanHandle = (h: string) => h.trim().replace(/^@/, "").replace(/^https?:\/\/[^/]+\//, "");

export const PROVIDERS: Record<PayProvider, { label: string; emoji: string }> = {
  paypal: { label: "PayPal", emoji: "🅿️" },
  n26: { label: "N26", emoji: "🅽" },
  revolut: { label: "Revolut", emoji: "🟣" },
};

export function buildPayLink(provider: PayProvider, input: PayLinkInput): string | null {
  const h = cleanHandle(input.handle);
  if (!h) return null;
  const amt = amountStr(input.amountCents);
  const cur = encodeURIComponent(input.currency || "EUR");
  switch (provider) {
    case "paypal":
      // paypal.me supports /amount/currency
      return `https://paypal.me/${encodeURIComponent(h)}/${amt}${cur}`;
    case "revolut":
      // revolut.me supports /amount/currency
      return `https://revolut.me/${encodeURIComponent(h)}/${amt}${cur}`;
    case "n26":
      // N26 MoneyBeam doesn't expose an amount-bearing deep link from web — we
      // open the public profile and copy the amount + note to the user's
      // clipboard as a fallback (handled at the call site).
      return `https://n26.com/r/${encodeURIComponent(h)}`;
  }
}
