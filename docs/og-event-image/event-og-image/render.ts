// Renders the OG layout to a PNG with satori (layout -> SVG) + resvg (SVG -> PNG, WebAssembly).
// Works in Supabase Edge (Deno, npm: specifiers) and in Node (same packages).
import satori from "npm:satori@0.56.2";
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";
import jpeg from "npm:jpeg-js@0.4.4";
import { eventOgLayout, type OgCard } from "./layout.ts";

const CDN = "https://cdn.jsdelivr.net/npm";
const FONT_500 = `${CDN}/@fontsource/space-grotesk@5.0.18/files/space-grotesk-latin-500-normal.woff`;
const FONT_700 = `${CDN}/@fontsource/space-grotesk@5.0.18/files/space-grotesk-latin-700-normal.woff`;
const RESVG_WASM = `${CDN}/@resvg/resvg-wasm@2.6.2/index_bg.wasm`;
const TWEMOJI = `${CDN}/@twemoji/svg@15.0.0`;

let ready: Promise<{ fonts: { name: string; data: ArrayBuffer; weight: 500 | 700; style: "normal" }[] }> | null = null;
const boot = () =>
  (ready ??= (async () => {
    const [f5, f7] = await Promise.all([fetch(FONT_500).then((r) => r.arrayBuffer()), fetch(FONT_700).then((r) => r.arrayBuffer())]);
    await initWasm(fetch(RESVG_WASM));
    return {
      fonts: [
        { name: "Space Grotesk", data: f5, weight: 500 as const, style: "normal" as const },
        { name: "Space Grotesk", data: f7, weight: 700 as const, style: "normal" as const },
      ],
    };
  })());

// Emoji (emoji covers like 🧺) -> Twemoji SVG.
const emojiCode = (s: string) => [...s].map((c) => c.codePointAt(0)!.toString(16)).filter((c) => c !== "fe0f").join("-");
const loadAdditionalAsset = async (code: string, segment: string) => {
  if (code !== "emoji") return "";
  const res = await fetch(`${TWEMOJI}/${emojiCode(segment)}.svg`);
  if (!res.ok) return "";
  return `data:image/svg+xml;base64,${btoa(await res.text())}`;
};

// Satori can't decode WebP/AVIF and fails on unreachable URLs: inline images as data URLs, drop the bad ones.
const inlineImage = async (url?: string | null): Promise<string | null> => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!/^image\/(png|jpe?g|gif)$/.test(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${type};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
};

// JPEG keeps the preview light (~100 KB); WhatsApp may drop large images.
export async function renderEventOgJpeg(card: OgCard, quality = 84): Promise<Uint8Array> {
  const { fonts } = await boot();
  const [image_url, ...avatars] = await Promise.all([inlineImage(card.image_url), ...(card.avatars ?? []).slice(0, 4).map(inlineImage)]);
  const svg = await satori(eventOgLayout({ ...card, image_url, avatars: avatars.filter(Boolean) as string[] }) as never, {
    width: 1200, height: 630, fonts, loadAdditionalAsset,
  });
  const out = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render();
  return jpeg.encode({ data: out.pixels, width: out.width, height: out.height }, quality).data;
}
