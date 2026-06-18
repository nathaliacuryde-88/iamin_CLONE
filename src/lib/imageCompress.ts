/**
 * Client-side image compression — keeps phone-screen quality without
 * shipping multi-MB uploads. Roughly WhatsApp-equivalent: max 1600px on
 * the long edge, JPEG quality 0.82.
 *
 * Falls back to the original file when compression would not help (smaller
 * than the cap, non-image, or browser missing canvas support).
 */
export async function compressImage(
  file: File | Blob,
  opts: { maxEdge?: number; quality?: number; mimeType?: string } = {},
): Promise<File> {
  const maxEdge = opts.maxEdge ?? 1600;
  const quality = opts.quality ?? 0.82;
  const outType = opts.mimeType ?? "image/jpeg";
  const name = (file as File).name ?? `image-${Date.now()}.jpg`;

  if (!(file as Blob).type?.startsWith("image/")) {
    return file as File;
  }
  // GIFs and SVGs — leave untouched to preserve animation/vector.
  if ((file as Blob).type === "image/gif" || (file as Blob).type === "image/svg+xml") {
    return file as File;
  }

  try {
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const img: HTMLImageElement = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });
    const longest = Math.max(img.width, img.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    if (scale === 1 && (file as Blob).size < 600_000) {
      return file as File;
    }
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file as File;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob = await new Promise((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), outType, quality),
    );
    const ext = outType === "image/jpeg" ? "jpg" : outType === "image/webp" ? "webp" : "png";
    const baseName = name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.${ext}`, { type: outType });
  } catch {
    return file as File;
  }
}
