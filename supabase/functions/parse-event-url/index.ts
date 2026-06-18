import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const enforceCurrentYear = (raw: string): string => {
  if (!raw) return raw;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    let year = Number(y);
    if (year < today.getFullYear()) year = today.getFullYear();
    const candidate = new Date(`${year}-${mo}-${d}T00:00:00`);
    if (candidate < today) year = today.getFullYear() + 1;
    return `${year}-${mo}-${d}`;
  }
  m = raw.match(/^(\d{2})[-\/](\d{2})$/);
  if (m) return `${today.getFullYear()}-${m[1]}-${m[2]}`;
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

    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL to prevent SSRF
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: "Only http/https URLs are allowed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (url.length > 2048) {
      return new Response(JSON.stringify({ error: "URL too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Block private/internal IPs (IPv4 + IPv6)
    const hostname = parsedUrl.hostname;
    const hostLowered = hostname.toLowerCase();
    if (
      hostLowered === "localhost" ||
      hostLowered.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      hostLowered === "[::1]" ||
      hostLowered === "[::]" ||
      hostLowered.startsWith("[::ffff:") ||
      /^\[f[cd][0-9a-f]{2}:/i.test(hostname) || // ULA fc00::/7
      /^\[fe[89ab][0-9a-f]:/i.test(hostname)    // link-local fe80::/10
    ) {
      return new Response(JSON.stringify({ error: "Internal URLs are not allowed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Instagram / Threads aren't scrapeable for event details (login wall + thin OG).
    // Fail loud instead of fabricating an event from empty content.
    if (/(^|\.)instagram\.com$|(^|\.)threads\.net$|(^|\.)threads\.com$/.test(hostLowered)) {
      return new Response(JSON.stringify({
        error: "unsupported_source",
        message: "Instagram & Threads links aren't supported yet — try a screenshot or fill it in manually.",
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let pageContent = "";
    let ogImage: string | null = null;

    // Try Firecrawl first if available — request markdown + html so we can also
    // pull an OG/Twitter cover image to seed the cropper on the client.
    if (FIRECRAWL_API_KEY) {
      try {
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown", "html"],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const root = scrapeData.data ?? scrapeData;
          pageContent = root.markdown ?? "";
          const html: string = root.html ?? root.rawHtml ?? "";

          // Heuristic: detect login/auth-walled pages so we don't grab their
          // generic "Log in to <Site>" preview image and use it as the event cover.
          const lowerUrl = url.toLowerCase();
          const lowerContent = (pageContent + " " + html).toLowerCase().slice(0, 4000);
          const looksLikeLogin =
            /\/(login|signin|sign-in|auth|account)(\/|$|\?)/.test(lowerUrl) ||
            /(log in to continue|sign in to continue|please log in|please sign in|create an account to|you must be logged in)/.test(lowerContent) ||
            (pageContent.trim().length < 400 && /(log in|sign in)/.test(lowerContent));

          if (html && !looksLikeLogin) {
            const og =
              html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
            if (og?.[1]) {
              try {
                const abs = new URL(og[1], url).toString();
                if (/^https?:/.test(abs)) ogImage = abs;
              } catch { /* ignore bad URLs */ }
            }
          } else if (looksLikeLogin) {
            console.log("Skipping OG image — page looks like a login wall:", url);
          }
        }
      } catch (e) {
        console.error("Firecrawl error:", e);
      }
    }

    // Fallback: just send the URL to AI
    if (!pageContent) {
      pageContent = `Please extract event details from this URL: ${url}`;
    }

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
              `You extract event information from web page content. Return structured data only. ` +
              `The current date is ${new Date().toISOString().slice(0, 10)}. ` +
              `If a year is missing from the source, ALWAYS assume the current year. ` +
              `Never output a date in the past — if the parsed date would be in the past, roll it forward to the next matching date.`,
          },
          {
            role: "user",
            content: `Extract event details from this web page content:\n\n${pageContent.slice(0, 8000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_event",
              description: "Extract event details from web page content",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Event name/title" },
                  date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  time: { type: "string", description: "Time in HH:MM format (24h)" },
                  location: { type: "string", description: "Venue, address, or full location string" },
                  city: { type: "string", description: "City name only (e.g. 'Berlin', 'Stuttgart'). Extract from location/address if present." },
                  description: { type: "string", description: "Brief description of the event" },
                  vibe_category: { type: "string", description: "Category/vibe. Choose one of: music, party, festival, birthday, art, food, brunch, cinema, sports, street markets, other." },
                  image_url: { type: "string", description: "Absolute URL to a hero/cover image for the event found in the page (og:image, twitter:image, or first prominent image). Empty string if none." },
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      if (parsed.date) parsed.date = enforceCurrentYear(parsed.date);
      // Prefer the OG image we extracted from HTML; fall back to whatever the
      // model surfaced from the markdown.
      const finalImage = ogImage || (typeof parsed.image_url === "string" && /^https?:/.test(parsed.image_url) ? parsed.image_url : null);
      return new Response(JSON.stringify({ ...parsed, image_url: finalImage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not parse event from URL" }), {
      status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
