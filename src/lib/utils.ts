import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Acronyms preserved in uppercase regardless of input casing.
const ACRONYMS = new Set([
  "DJ", "NYE", "B2B", "EDM", "VIP", "NYC", "LA", "SF", "UK", "EU", "DC", "ID",
  "AM", "PM",
]);

/**
 * Convert any string to sentence case while preserving:
 * - common acronyms (DJ, NYE, B2B, EDM, VIP, ...)
 * - any token containing a digit (e.g. "B2B", "K-pop", "2024")
 *
 * "PARTY NIGHT WITH DJ ALEX" → "Party night with DJ Alex"
 * "hello! how are you?"      → "Hello! How are you?"
 */
export function toSentenceCase(input: string | null | undefined): string {
  if (!input) return "";
  const lowered = input.toLowerCase();
  // Capitalize first letter of every "sentence" (start, or after . ! ?)
  const sentenceCased = lowered.replace(
    /(^\s*\w)|([.!?]\s+\w)/g,
    (m) => m.toUpperCase(),
  );
  // Then preserve acronyms / digit-containing tokens.
  return sentenceCased
    .split(/(\s+)/)
    .map((tok) => {
      if (!tok.trim()) return tok;
      const upper = tok.toUpperCase();
      // Strip surrounding punctuation for the acronym check.
      const core = upper.replace(/[^\p{L}\p{N}]/gu, "");
      if (ACRONYMS.has(core)) {
        // Re-apply punctuation around the acronym.
        return tok.replace(/\p{L}+/gu, (w) =>
          ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w,
        );
      }
      if (/\d/.test(tok)) return tok.toUpperCase();
      return tok;
    })
    .join("");
}
