// Share image (Open Graph, 1200x630 JPEG) for a public event.
// URL: /functions/v1/event-og-image/<eventId>
// Used as og:image by event-share. Private / unknown events get the generic brand card.
// verify_jwt = false (crawlers fetch it without auth) — see supabase/config.toml.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { renderEventOgJpeg } from "./render.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  const eventId = (segments[segments.length - 1] ?? "").replace(/\.(png|jpe?g)$/i, "");
  if (!UUID_RE.test(eventId)) return new Response("Invalid event id", { status: 400 });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: card } = await supabase.rpc("get_public_event_card", { _event_id: eventId });
    // Never leak private events: render the neutral brand card instead.
    const safe = card && !card.private
      ? card
      : { name: "Keep track and share your events" };

    const jpg = await renderEventOgJpeg(safe);
    return new Response(jpg, {
      headers: {
        "content-type": "image/jpeg",
        // Crawlers re-fetch rarely; 10 min fresh, then serve stale while re-rendering.
        "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    });
  } catch (e) {
    console.error("event-og-image error", e);
    return Response.redirect("https://i-am-in.app/app-icon-512.png", 302);
  }
});
