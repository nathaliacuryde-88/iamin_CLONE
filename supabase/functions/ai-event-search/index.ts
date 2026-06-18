import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ ids: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pull a candidate pool of upcoming public events to rank
    const today = new Date().toISOString().slice(0, 10);
    const { data: events, error } = await supabase
      .from("events")
      .select("id, name, description, vibe_category, location, date")
      .eq("visibility", "public")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(150);

    if (error) throw error;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ ids: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const catalog = events.map((e, i) => ({
      i,
      id: e.id,
      name: e.name,
      vibe: e.vibe_category,
      location: e.location,
      date: e.date,
      desc: (e.description ?? "").slice(0, 280),
    }));

    const sys = `You are a semantic event-search ranker. Given a natural-language user query and a JSON list of events, return ONLY a JSON object {"ids": ["uuid", ...]} listing up to 20 matching event ids ordered by relevance. Match on vibe (e.g. "house music", "chill", "rave"), description, location, and name. If nothing matches, return {"ids": []}. No prose, no markdown.`;

    const userMsg = `Query: ${query.trim()}\n\nEvents:\n${JSON.stringify(catalog)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai_error", detail: text }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let ids: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.ids)) {
        const valid = new Set(events.map((e) => e.id));
        ids = parsed.ids.filter((x: unknown) => typeof x === "string" && valid.has(x as string));
      }
    } catch {
      ids = [];
    }

    return new Response(JSON.stringify({ ids }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
