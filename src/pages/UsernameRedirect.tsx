import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a short /u/:username URL to the canonical /profile/:userId route.
 * Lets us share nicer-looking links like iamin.lovable.app/u/maria.
 */
const UsernameRedirect = () => {
  const { username } = useParams<{ username: string }>();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    if (!username) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      if (!active) return;
      setUserId(data?.user_id ?? null);
    })();
    return () => { active = false; };
  }, [username]);

  if (userId === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-sm text-muted-foreground">
        Finding profile…
      </div>
    );
  }
  if (!userId) return <Navigate to="/" replace />;
  return <Navigate to={`/profile/${userId}`} replace />;
};

export default UsernameRedirect;
