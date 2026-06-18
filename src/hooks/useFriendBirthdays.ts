import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FriendBirthday {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  birthday: string; // YYYY-MM-DD (original birth date)
}

/**
 * Birthdays of the current user's mutual friends.
 * Uses a SECURITY DEFINER RPC so birthdays stay private to mutual friends only.
 */
export const useFriendBirthdays = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friend-birthdays", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("get_friend_birthdays");
      return ((data ?? []) as unknown) as FriendBirthday[];
    },
  });
};

/** Returns "MM-DD" key from a YYYY-MM-DD birthday. */
export const birthdayKey = (iso: string) => iso.slice(5);
