import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Force AI-extracted dates to never be in the past:
 * - If no year is present, use the current year (and roll forward if past).
 * - If a year < current year is present, bump the year forward.
 */
const enforceCurrentYear = (raw: string): string => {
  if (!raw) return raw;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Match YYYY-MM-DD or MM-DD / MM/DD shapes
  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    let year = Number(y);
    const candidate = new Date(`${year}-${mo}-${d}T00:00:00`);
    if (candidate < today) year = today.getFullYear() + (candidate.getMonth() < today.getMonth() ? 1 : 0);
    if (Number(y) < today.getFullYear()) year = today.getFullYear();
    return `${year}-${mo}-${d}`;
  }
  m = raw.match(/^(\d{2})[-\/](\d{2})$/);
  if (m) {
    const [, mo, d] = m;
    return `${today.getFullYear()}-${mo}-${d}`;
  }
  return raw;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ~3.75 MB raw image after base64 decode
    if (image.length > 5_000_000) {
      return new Response(JSON.stringify({ error: "Image too large (max ~3.5MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              `You extract event information from images. Return structured data only. ` +
              `The current date is ${new Date().toISOString().slice(0, 10)}. ` +
              `If a year is missing from the source, ALWAYS assume the current year. ` +
              `Never output a date in the past — if the parsed date would be in the past, roll it forward to the next matching date. ` +
              `For city: if a city is not printed explicitly, INFER it from the venue name, street address, postal code, phone area code, or language cues on the flyer. Only leave city blank if no signal is present at all.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract event details from this image. Return the information as structured data.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_event",
              description: "Extract event details from an image",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Event name/title" },
                  date: { type: "string", description: "Start date in YYYY-MM-DD format" },
                  end_date: { type: "string", description: "End date in YYYY-MM-DD format if the event spans multiple days (omit if single-day)" },
                  time: { type: "string", description: "Start time in HH:MM format (24h)" },
                  end_time: { type: "string", description: "End time in HH:MM format (24h) if explicitly mentioned (e.g. '8pm - 11pm'). Omit if no end time on the flyer." },
                  location: { type: "string", description: "Venue, address, or full location string" },
                  city: { type: "string", description: "City name only (e.g. 'Berlin', 'Stuttgart'). Extract from location/address if present." },
                  description: { type: "string", description: "Brief description of the event" },
                  vibe_category: { type: "string", description: "Category/vibe. Choose one of: music, party, festival, birthday, art, food, brunch, cinema, sports, street markets, other." },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_event" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text().catch(() => "");
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI is busy right now — try again in a few seconds.", code: "rate_limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up to keep parsing screenshots.", code: "payment_required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "AI key isn't set up — contact support.", code: "unauthorized" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI couldn't read that screenshot. Try a clearer image or fill it in manually.", code: "ai_error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      if (parsed.date) parsed.date = enforceCurrentYear(parsed.date);
      if (parsed.end_date) parsed.end_date = enforceCurrentYear(parsed.end_date);

      // City fallback — if AI didn't return a city but did return a location/venue,
      // reverse-geocode via Nominatim (same provider as CityAutocomplete).
      if ((!parsed.city || !String(parsed.city).trim()) && parsed.location) {
        try {
          const q = encodeURIComponent(String(parsed.location));
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=1`,
            { headers: { "Accept-Language": "en", "User-Agent": "iamin-app/1.0" } },
          );
          if (geoRes.ok) {
            const geo = await geoRes.json();
            const addr = geo?.[0]?.address ?? {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
            if (city) parsed.city = city;
          }
        } catch (_e) { /* silent fallback */ }
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Couldn't find any event info in that image. Try a clearer screenshot.", code: "no_event" }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong reading that screenshot. Try again or add it manually.", code: "internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
