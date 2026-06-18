// Public OG/share landing page for an event.
// Returns HTML with per-event Open Graph + Twitter Card meta so that messaging
// apps (WhatsApp, iMessage, Telegram, Slack, X, Facebook, Discord) show the
// event cover image and a friendly title when the link is pasted.
// Real browsers are immediately redirected to the SPA route /event/:id.
//
// URL shape: /functions/v1/event-share/<eventId>
//
// Note: verify_jwt is disabled below so crawlers can fetch this without auth.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "https://iamin.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same regex used in the React app to pull emoji-cover metadata out of description.
const parseCoverMeta = (description: string | null) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};
const stripCoverMeta = (s: string | null) =>
  (s ?? "").replace(/\[\[cover:[^\]]+\]\]\s*/g, "").trim();

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Tiny SVG fallback so emoji-cover events still render an image preview in chat
// apps (most crawlers want a real image URL — they handle SVG poorly, so we use
// a data URL PNG-like rendering). We cheat with a colored SVG; many messengers
// accept SVG; for the rest the unfurl will just show no image, which is still
// far better than the wrong screenshot of a login page.
const emojiCoverSvg = (emoji: string, hsl: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="hsl(${hsl})"/><text x="600" y="380" font-size="320" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${emoji}</text></svg>`
  )}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const userAgent = req.headers.get("user-agent") ?? "";
  const isCrawler = /(whatsapp|facebookexternalhit|twitterbot|slackbot|discordbot|telegrambot|linkedinbot|skypeuripreview|googlebot|applebot|bot|crawler|spider)/i.test(userAgent);

  // Path is /functions/v1/event-share/<id>; grab the last non-empty segment.
  const segments = url.pathname.split("/").filter(Boolean);
  const eventId = segments[segments.length - 1];

  if (!eventId || eventId === "event-share") {
    return new Response("Missing event id", { status: 400 });
  }

  // Strict UUID validation prevents reflected XSS via path injection.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(eventId)) {
    return new Response("Invalid event id", { status: 400 });
  }

  const spaUrl = `${APP_BASE_URL}/event/${eventId}`;
  const shareUrl = req.url;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: event, error } = await supabase
      .from("events")
      .select("id,name,description,date,time,location,city,image_url,vibe_category,visibility")
      .eq("id", eventId)
      .maybeSingle();

    // Private events should never leak metadata via shared link previews.
    if (error || !event || event.visibility === "private") {
      const html = renderShell({
        title: "I am in — Keep track and share your events",
        description:
          "Capture events from screenshots and links, see who's going, split costs, and never miss the plans your friends are making.",
        image: `${APP_BASE_URL}/og-default.png`,
        redirectTo: spaUrl,
        shareUrl,
        isCrawler,
      });
      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    const cleanDescription = stripCoverMeta(event.description);
    const cover = parseCoverMeta(event.description);

    let image = event.image_url || "";
    if (!image && cover) image = emojiCoverSvg(cover.emoji, cover.color);
    if (!image) image = `${APP_BASE_URL}/og-default.png`;

    const parts: string[] = [];
    if (event.date) {
      const d = new Date(event.date + "T00:00:00");
      parts.push(
        d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      );
    }
    if (event.time) parts.push(event.time.slice(0, 5));
    const where = event.location || event.city;
    if (where) parts.push(where);
    const subtitle = parts.join(" · ");

    const desc =
      cleanDescription ||
      (subtitle ? `${subtitle} — Tap to see who's in.` : "Tap to see who's in.");

    const html = renderShell({
      title: event.name,
      description: desc.length > 200 ? desc.slice(0, 197) + "..." : desc,
      image,
      redirectTo: spaUrl,
      shareUrl,
      isCrawler,
    });

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error("event-share error", e);
    return Response.redirect(spaUrl, 302);
  }
});

function renderShell(opts: {
  title: string;
  description: string;
  image: string;
  redirectTo: string;
  shareUrl: string;
  isCrawler: boolean;
}) {
  const t = escapeHtml(opts.title);
  const d = escapeHtml(opts.description);
  const img = escapeHtml(opts.image);
  const to = escapeHtml(opts.redirectTo);
  const share = escapeHtml(opts.shareUrl);
  const redirectMeta = opts.isCrawler ? "" : `<meta http-equiv="refresh" content="0; url=${to}" />`;
  const redirectScript = opts.isCrawler ? "" : `<script>window.location.replace(${JSON.stringify(opts.redirectTo).replace(/<\/script>/gi, "<\\/script>")});</script>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t}</title>
<meta name="description" content="${d}" />

<meta property="og:type" content="website" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:secure_url" content="${img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${share}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${img}" />

${redirectMeta}
<link rel="canonical" href="${share}" />
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background:#0b0b0f; color:#fff; margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; text-align:center; }
  a { color:#a78bfa; }
</style>
</head>
<body>
  <div>
    <h1 style="font-size:20px;margin:0 0 8px;">${t}</h1>
    <p style="opacity:.7;margin:0 0 16px;">${d}</p>
    <p><a href="${to}">Open in I am in →</a></p>
  </div>
  ${redirectScript}
</body>
</html>`;
}
