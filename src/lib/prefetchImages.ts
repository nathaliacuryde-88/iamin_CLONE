/**
 * Tiny image prefetcher. Kicks off browser image downloads for the given
 * URLs so subsequent renders find them warm in the HTTP cache.
 *
 * - Deduped via an in-memory `Set`; calling with the same URL is free.
 * - Uses `Image()` (rather than `<link rel=preload>`) because Vite-built apps
 *   often run cross-origin with a service worker — `Image()` honours the same
 *   credentials/cache that subsequent React `<img>` tags will use.
 * - Runs inside `requestIdleCallback` when available so prefetching never
 *   competes with above-the-fold work.
 */
const seen = new Set<string>();

const schedule = (fn: () => void) => {
  if (typeof window === "undefined") return;
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) ric(fn, { timeout: 1500 });
  else window.setTimeout(fn, 100);
};

export function prefetchImages(urls: Array<string | null | undefined>): void {
  if (typeof window === "undefined") return;
  for (const raw of urls) {
    if (!raw) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    schedule(() => {
      const img = new Image();
      // Match how <img> is fetched (anonymous) so the cache entry is reusable.
      img.decoding = "async";
      img.referrerPolicy = "no-referrer-when-downgrade";
      img.src = raw;
    });
  }
}
