import { supabase } from "@/integrations/supabase/client";

/**
 * Time-capsule photos live in a private bucket. Rows store either a raw
 * storage path (new uploads) or a legacy full publicUrl. This helper
 * normalises to a path and then batch-signs short-lived URLs.
 *
 * Supports Supabase image transforms (resize/format) for thumbnails — much
 * smaller payloads than the original. Results are cached in-memory keyed by
 * path + transform so re-renders don't re-sign.
 */
const toPath = (urlOrPath: string) => {
  const m = urlOrPath.match(/\/time-capsule\/(.+?)(\?|$)/);
  return m ? m[1] : urlOrPath;
};

export type CapsuleTransform = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

type CacheEntry = { url: string; exp: number };
const urlCache = new Map<string, CacheEntry>();

const cacheKey = (path: string, t?: CapsuleTransform) =>
  `${path}|${t?.width ?? ""}x${t?.height ?? ""}|q${t?.quality ?? ""}|${t?.resize ?? ""}`;

const SIGN_TTL = 24 * 60 * 60; // 24h

/**
 * Append Supabase image transform params to a signed URL. Supabase's signed
 * URL endpoint accepts width/height/quality/resize as query params on the
 * /render/image/sign/* path. We rewrite /object/sign/ → /render/image/sign/.
 */
function appendTransform(url: string, t: CapsuleTransform): string {
  const rewritten = url.replace("/object/sign/", "/render/image/sign/");
  const u = new URL(rewritten);
  if (t.width) u.searchParams.set("width", String(t.width));
  if (t.height) u.searchParams.set("height", String(t.height));
  if (t.quality) u.searchParams.set("quality", String(t.quality));
  if (t.resize) u.searchParams.set("resize", t.resize);
  return u.toString();
}

export async function signCapsuleUrls<T extends { image_url: string }>(
  photos: T[],
  expiresIn: number = SIGN_TTL,
  transform?: CapsuleTransform,
): Promise<T[]> {
  if (!photos.length) return photos;
  const paths = photos.map((p) => toPath(p.image_url));
  const now = Date.now();

  // Split into cached vs needs-signing
  const needPaths: string[] = [];
  const resolved = new Map<string, string>();
  for (const p of paths) {
    const k = cacheKey(p, transform);
    const hit = urlCache.get(k);
    if (hit && hit.exp > now + 60_000) {
      resolved.set(p, hit.url);
    } else if (!needPaths.includes(p)) {
      needPaths.push(p);
    }
  }

  if (needPaths.length) {
    const { data } = await supabase.storage
      .from("time-capsule")
      .createSignedUrls(needPaths, expiresIn);
    (data ?? []).forEach((d, i) => {
      if (d.signedUrl) {
        const p = needPaths[i];
        const finalUrl = transform ? appendTransform(d.signedUrl, transform) : d.signedUrl;
        resolved.set(p, finalUrl);
        urlCache.set(cacheKey(p, transform), {
          url: finalUrl,
          exp: now + expiresIn * 1000,
        });
      }
    });
  }

  return photos.map((p) => ({
    ...p,
    image_url: resolved.get(toPath(p.image_url)) ?? p.image_url,
  }));
}

export const capsulePathFromUrl = toPath;

/**
 * Prefetch signed capsule URLs (and warm the browser image cache) for the
 * given photos. Use this to make adjacent capsule items feel instant.
 */
export async function prefetchCapsule<T extends { image_url: string }>(
  photos: T[],
  transform?: CapsuleTransform,
): Promise<void> {
  if (!photos.length || typeof window === "undefined") return;
  try {
    const signed = await signCapsuleUrls(photos, SIGN_TTL, transform);
    const { prefetchImages } = await import("./prefetchImages");
    prefetchImages(signed.map((s) => s.image_url));
  } catch {
    /* prefetch is best-effort */
  }
}
