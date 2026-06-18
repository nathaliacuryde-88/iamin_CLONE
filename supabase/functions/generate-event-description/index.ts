import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

interface RequestBody {
  mode: "generate" | "improve";
  name?: string;
  vibe_category?: string;
  city?: string;
  location?: string;
  date?: string;
  time?: string;
  flyer_image_url?: string;
  current_text?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (body.mode !== "generate" && body.mode !== "improve") {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      body.mode === "improve"
        ? "You are an event copywriter. Rewrite the user's draft into a warm, vivid event description that keeps every fact intact. STRICT: 1–2 short paragraphs, max ~80 words total. No bullet lists, no headers, no emojis at the start, no hashtags. Return only the description text, no preamble."
        : "You are an event copywriter. Using the supplied details (and the flyer image if provided), write a warm, vivid event description that helps friends decide to come. STRICT: 1–2 short paragraphs, max ~80 words total. No bullet lists, no headers, no emojis at the start, no hashtags. Return only the description text, no preamble.";

    const facts = [
      body.name && `Event: ${body.name}`,
      body.vibe_category && `Vibe: ${body.vibe_category}`,
      body.date && `Date: ${body.date}`,
      body.time && `Time: ${body.time}`,
      body.location && `Venue: ${body.location}`,
      body.city && `City: ${body.city}`,
    ]
      .filter(Boolean)
      .join("\n");

    const hasImage = body.mode === "generate" && !!body.flyer_image_url;
    const userContent: any[] = [
      {
        type: "text",
        text:
          body.mode === "improve"
            ? `Polish this draft. Facts:\n${facts}\n\nDraft:\n${body.current_text ?? ""}`
            : `Write a description. Facts:\n${facts}${hasImage ? "\n\nFlyer image is attached — pull any extra details from it that match the facts above." : ""}`,
      },
    ];
    if (hasImage) {
      userContent.push({ type: "image_url", image_url: { url: body.flyer_image_url } });
    }

    // Vision-capable model when a flyer is present; cheap text model otherwise.
    const model = hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 220,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(
        JSON.stringify({
          error: upstream.status === 429
            ? "Rate limit hit — try again in a moment."
            : upstream.status === 402
              ? "AI credits exhausted. Add credits in Cloud settings."
              : `AI failed (${upstream.status})`,
          detail: text.slice(0, 500),
        }),
        { status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const json = await upstream.json();
    const description: string = json?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ description: description.trim() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
