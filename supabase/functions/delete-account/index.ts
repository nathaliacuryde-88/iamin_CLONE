// Edge function: deletes the calling user's account and all their data.
// Required by App Store Review Guideline 5.1.1(v) and Google Play User Data policy.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller's identity using their JWT.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uid = userData.user.id;

    // Service-role client for cleanup + final auth user delete.
    const admin = createClient(supabaseUrl, serviceKey);

    // Best-effort cleanup of user-owned rows.
    // (Most rows will cascade via auth.users FKs where they exist; we delete the
    // rest explicitly so the user's footprint is fully removed.)
    const tables: Array<{ table: string; col: string }> = [
      { table: "attendees", col: "user_id" },
      { table: "availability_blocks", col: "user_id" },
      { table: "comments", col: "user_id" },
      { table: "event_invites", col: "invitee_id" },
      { table: "event_invites", col: "inviter_id" },
      { table: "event_reactions", col: "user_id" },
      { table: "expense_shares", col: "user_id" },
      { table: "event_expenses", col: "created_by" },
      { table: "event_expenses", col: "payer_id" },
      { table: "follows", col: "follower_id" },
      { table: "follows", col: "following_id" },
      { table: "friend_requests", col: "requester_id" },
      { table: "friend_requests", col: "recipient_id" },
      { table: "notifications", col: "recipient_id" },
      { table: "notifications", col: "sender_id" },
      { table: "profile_highlights", col: "user_id" },
      { table: "time_capsule_photos", col: "user_id" },
      { table: "events", col: "created_by" },
      { table: "user_roles", col: "user_id" },
      { table: "profiles", col: "user_id" },
    ];

    for (const { table, col } of tables) {
      try {
        await admin.from(table).delete().eq(col, uid);
      } catch (_) {
        /* keep going — some rows may already be gone */
      }
    }

    // Finally, delete the auth user.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
