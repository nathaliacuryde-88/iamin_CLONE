// Event duplicate-matching helpers.
//
// Pure, dependency-free logic so it can be unit-tested and reused by both the
// client-side duplicate check and (mirrored) the `find_similar_events` RPC.
// The DB does the authoritative, visibility-scoped trigram match; the client
// uses these to rank candidates and to fall back gracefully when the RPC
// isn't deployed yet.

/** Lowercase, strip accents & punctuation, collapse whitespace. */
export function normalizeEventName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // punctuation -> space
    .trim()
    .replace(/\s+/g, " ");
}

// Query params that identify tracking/session, not the event itself.
const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "igshid", "igsh", "si", "ref", "ref_src", "ref_url",
  "feature", "mc_cid", "mc_eid", "_ga", "yclid", "aff", "affiliate",
]);

/**
 * Canonicalize a source URL so the same real-world event links match across
 * users: lowercase host, drop `www.`, drop protocol, strip trailing slash,
 * remove tracking params, sort the rest. Returns "" for empty/invalid input.
 */
export function normalizeSourceUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    try {
      url = new URL("https://" + raw.trim());
    } catch {
      return "";
    }
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, ""); // drop trailing slashes
  const kept: string[] = [];
  url.searchParams.forEach((v, k) => {
    if (!TRACKING_PARAMS.has(k.toLowerCase())) kept.push(`${k.toLowerCase()}=${v}`);
  });
  kept.sort();
  const query = kept.length ? "?" + kept.join("&") : "";
  return host + path + query;
}

/** Character-bigram Dice coefficient in [0,1]. Robust to word-order/spacing. */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeEventName(a);
  const nb = normalizeEventName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const bigrams = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    const compact = s.replace(/\s+/g, " ");
    for (let i = 0; i < compact.length - 1; i++) {
      const bg = compact.slice(i, i + 2);
      m.set(bg, (m.get(bg) ?? 0) + 1);
    }
    return m;
  };
  const ma = bigrams(na);
  const mb = bigrams(nb);
  let overlap = 0;
  let totalA = 0;
  let totalB = 0;
  ma.forEach((c) => (totalA += c));
  mb.forEach((c) => (totalB += c));
  ma.forEach((c, bg) => {
    const other = mb.get(bg);
    if (other) overlap += Math.min(c, other);
  });
  if (totalA + totalB === 0) return 0;
  return (2 * overlap) / (totalA + totalB);
}

/** Absolute day difference between two ISO date strings, or null if unknown. */
export function dayDiff(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  const da = Date.parse(a + "T00:00:00Z");
  const db = Date.parse(b + "T00:00:00Z");
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.abs(Math.round((da - db) / 86_400_000));
}

export interface EventMatchInput {
  name: string;
  date?: string | null;
  city?: string | null;
  sourceUrl?: string | null;
}

export interface EventCandidate {
  id: string;
  name: string;
  date?: string | null;
  city?: string | null;
  source_url?: string | null;
  created_by?: string | null;
}

export interface ScoredCandidate extends EventCandidate {
  score: number;
  reasons: string[];
}

// Tunables.
const NAME_THRESHOLD = 0.55; // min name similarity when there's no link match
const DATE_WINDOW_DAYS = 1; // events within ±1 day count as the same occasion

/**
 * Score a single candidate against the event the user is creating.
 * Returns score 0 when it isn't a plausible duplicate.
 */
export function scoreCandidate(input: EventMatchInput, cand: EventCandidate): ScoredCandidate {
  const reasons: string[] = [];

  // 1. Same source link is a near-certain match regardless of name wording.
  const inUrl = normalizeSourceUrl(input.sourceUrl);
  const candUrl = normalizeSourceUrl(cand.source_url);
  const sameLink = !!inUrl && inUrl === candUrl;

  // 2. Date proximity gate (when both have dates).
  const dd = dayDiff(input.date, cand.date);
  const dateClose = dd !== null && dd <= DATE_WINDOW_DAYS;
  const dateFar = dd !== null && dd > DATE_WINDOW_DAYS;

  const nameSim = nameSimilarity(input.name, cand.name);

  if (sameLink) {
    reasons.push("same link");
    if (dateClose) reasons.push("same date");
    // Even if dates differ, a shared source link is a strong signal.
    return { ...cand, score: Math.max(0.9, nameSim), reasons };
  }

  // Without a link match, a far-apart date rules it out.
  if (dateFar) return { ...cand, score: 0, reasons };

  if (nameSim < NAME_THRESHOLD) return { ...cand, score: 0, reasons };

  reasons.push(nameSim >= 0.85 ? "very similar name" : "similar name");
  let score = nameSim;

  if (dateClose) {
    reasons.push(dd === 0 ? "same date" : "nearby date");
    score += 0.05;
  }

  const sameCity =
    !!input.city && !!cand.city &&
    normalizeEventName(input.city) === normalizeEventName(cand.city);
  if (sameCity) {
    reasons.push("same city");
    score += 0.05;
  }

  return { ...cand, score: Math.min(score, 1), reasons };
}

/** Rank candidates, keep only plausible duplicates, best first. */
export function rankDuplicates(input: EventMatchInput, candidates: EventCandidate[]): ScoredCandidate[] {
  return candidates
    .map((c) => scoreCandidate(input, c))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}
