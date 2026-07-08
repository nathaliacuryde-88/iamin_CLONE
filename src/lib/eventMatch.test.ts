import { describe, it, expect } from "vitest";
import {
  normalizeEventName,
  normalizeSourceUrl,
  nameSimilarity,
  dayDiff,
  scoreCandidate,
  rankDuplicates,
  type EventCandidate,
} from "./eventMatch";

describe("normalizeEventName", () => {
  it("lowercases, strips punctuation and collapses whitespace", () => {
    expect(normalizeEventName("Tanz-Demo")).toBe("tanz demo");
    expect(normalizeEventName("  Tanz   Demo!! ")).toBe("tanz demo");
    expect(normalizeEventName("TanzDemo")).toBe("tanzdemo");
  });
  it("strips accents", () => {
    expect(normalizeEventName("Café Crawl")).toBe("cafe crawl");
    expect(normalizeEventName("Zürich Fête")).toBe("zurich fete");
  });
  it("handles null/empty", () => {
    expect(normalizeEventName(null)).toBe("");
    expect(normalizeEventName(undefined)).toBe("");
    expect(normalizeEventName("")).toBe("");
  });
});

describe("normalizeSourceUrl", () => {
  it("drops protocol, www and trailing slash", () => {
    expect(normalizeSourceUrl("https://www.eventbrite.com/e/tanz-123/")).toBe(
      "eventbrite.com/e/tanz-123",
    );
  });
  it("strips tracking params but keeps meaningful ones", () => {
    expect(
      normalizeSourceUrl("https://site.com/e/9?utm_source=ig&fbclid=xx&id=42"),
    ).toBe("site.com/e/9?id=42");
  });
  it("treats two shares of the same link as equal despite tracking noise", () => {
    const a = normalizeSourceUrl("https://instagram.com/p/ABC123/?igshid=aaa");
    const b = normalizeSourceUrl("http://www.instagram.com/p/ABC123?utm_medium=copy");
    expect(a).toBe(b);
    expect(a).toBe("instagram.com/p/ABC123");
  });
  it("accepts bare hosts and rejects garbage", () => {
    expect(normalizeSourceUrl("eventbrite.com/e/1")).toBe("eventbrite.com/e/1");
    expect(normalizeSourceUrl("not a url")).toBe("");
    expect(normalizeSourceUrl(null)).toBe("");
  });
});

describe("nameSimilarity", () => {
  it("is 1 for identical after normalization", () => {
    expect(nameSimilarity("Tanz Demo", "tanz-demo")).toBe(1);
  });
  it("is high for a superset name", () => {
    expect(nameSimilarity("Tanz Demo", "Tanz Demo Berlin")).toBeGreaterThan(0.6);
  });
  it("is low for unrelated names", () => {
    expect(nameSimilarity("Tanz Demo", "Birthday Dinner")).toBeLessThan(0.3);
  });
  it("is 0 when either side is empty", () => {
    expect(nameSimilarity("", "x")).toBe(0);
  });
});

describe("dayDiff", () => {
  it("computes absolute day distance", () => {
    expect(dayDiff("2026-07-08", "2026-07-08")).toBe(0);
    expect(dayDiff("2026-07-08", "2026-07-09")).toBe(1);
    expect(dayDiff("2026-07-09", "2026-07-08")).toBe(1);
    expect(dayDiff("2026-07-08", "2026-07-20")).toBe(12);
  });
  it("returns null when a date is missing/invalid", () => {
    expect(dayDiff(null, "2026-07-08")).toBeNull();
    expect(dayDiff("2026-07-08", undefined)).toBeNull();
  });
});

describe("scoreCandidate", () => {
  const base: EventCandidate = {
    id: "e1",
    name: "Tanz Demo",
    date: "2026-07-08",
    city: "Berlin",
    source_url: null,
    created_by: "friend",
  };

  it("flags a same-name same-date event as a duplicate", () => {
    const s = scoreCandidate({ name: "Tanz Demo", date: "2026-07-08", city: "Berlin" }, base);
    expect(s.score).toBeGreaterThan(0);
    expect(s.reasons).toContain("same date");
  });

  it("catches punctuation variants (Tanz-Demo)", () => {
    const s = scoreCandidate({ name: "Tanz-Demo", date: "2026-07-08" }, base);
    expect(s.score).toBeGreaterThan(0);
  });

  it("catches a superset title (Tanz Demo Berlin)", () => {
    const s = scoreCandidate({ name: "Tanz Demo Berlin", date: "2026-07-08" }, base);
    expect(s.score).toBeGreaterThan(0);
  });

  it("still matches within the ±1 day window", () => {
    const s = scoreCandidate({ name: "Tanz Demo", date: "2026-07-09" }, base);
    expect(s.score).toBeGreaterThan(0);
    expect(s.reasons).toContain("nearby date");
  });

  it("does NOT match when dates are far apart and no link", () => {
    const s = scoreCandidate({ name: "Tanz Demo", date: "2026-08-20" }, base);
    expect(s.score).toBe(0);
  });

  it("does NOT match unrelated events on the same date", () => {
    const s = scoreCandidate({ name: "Grandma's Birthday", date: "2026-07-08" }, base);
    expect(s.score).toBe(0);
  });

  it("matches on shared source link even if names/dates differ", () => {
    const withUrl: EventCandidate = { ...base, name: "Techno night", date: "2026-07-10", source_url: "https://ra.co/events/999?utm_source=ig" };
    const s = scoreCandidate(
      { name: "totally different", date: "2026-07-08", sourceUrl: "http://www.ra.co/events/999/" },
      withUrl,
    );
    expect(s.score).toBeGreaterThanOrEqual(0.9);
    expect(s.reasons).toContain("same link");
  });

  it("boosts score when city matches", () => {
    // Use a non-exact name so the score isn't already saturated at 1.
    const sameCity = scoreCandidate({ name: "Tanz Demo night", date: "2026-07-08", city: "Berlin" }, base);
    const noCity = scoreCandidate({ name: "Tanz Demo night", date: "2026-07-08", city: "Munich" }, base);
    expect(sameCity.score).toBeGreaterThan(noCity.score);
    expect(sameCity.reasons).toContain("same city");
  });
});

describe("rankDuplicates — the reported 3x Tanz Demo scenario", () => {
  it("surfaces the friend's and brother's events, best first, drops noise", () => {
    const candidates: EventCandidate[] = [
      { id: "friend", name: "Tanz Demo", date: "2026-07-08", city: "Berlin", created_by: "friend" },
      { id: "brother", name: "Tanz-Demo Berlin", date: "2026-07-08", city: "Berlin", created_by: "brother" },
      { id: "unrelated", name: "Sunday Brunch", date: "2026-07-08", city: "Berlin", created_by: "other" },
      { id: "far", name: "Tanz Demo", date: "2026-09-01", city: "Berlin", created_by: "x" },
    ];
    const ranked = rankDuplicates({ name: "Tanz Demo", date: "2026-07-08", city: "Berlin" }, candidates);
    const ids = ranked.map((r) => r.id);
    expect(ids).toContain("friend");
    expect(ids).toContain("brother");
    expect(ids).not.toContain("unrelated");
    expect(ids).not.toContain("far");
    // exact match should rank at or above the punctuation-variant superset
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });

  it("returns empty when nothing is similar", () => {
    const ranked = rankDuplicates(
      { name: "My Quiet Dinner", date: "2026-07-08" },
      [{ id: "a", name: "Rave", date: "2026-07-08" }],
    );
    expect(ranked).toEqual([]);
  });
});
