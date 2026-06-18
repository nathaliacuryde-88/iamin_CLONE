import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type TextBoxStyle = "none" | "solid" | "translucent" | "outline";

export interface BirthdayCard {
  id: string;
  sender_id: string;
  recipient_id: string;
  birthday_date: string;
  emoji: string;
  message: string | null;
  color: string;
  opened_at: string | null;
  created_at: string;
  background_image_url: string | null;
  text_box_enabled: boolean;
  text_box_style: TextBoxStyle;
  sender?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/** Cards received by the current user that haven't been opened yet. */
export function useUnopenedBirthdayCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["birthday-cards", "unopened", user?.id],
    queryFn: async (): Promise<BirthdayCard[]> => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("birthday_cards")
        .select("*")
        .eq("recipient_id", user.id)
        .is("opened_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const cards = (data ?? []) as BirthdayCard[];
      if (cards.length === 0) return cards;
      const senderIds = Array.from(new Set(cards.map((c) => c.sender_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", senderIds);
      const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      return cards.map((c) => ({ ...c, sender: profMap.get(c.sender_id) ?? null }));
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
}

export function useSendBirthdayCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  return async (params: {
    recipientId: string;
    birthdayDate: string; // YYYY-MM-DD (this year's birthday)
    emoji: string;
    message: string;
    color: string;
    backgroundImageUrl?: string | null;
    textBoxEnabled?: boolean;
    textBoxStyle?: TextBoxStyle;
  }) => {
    if (!user) return { ok: false as const, error: "Not signed in" };
    const { error } = await (supabase as any).from("birthday_cards").insert({
      sender_id: user.id,
      recipient_id: params.recipientId,
      birthday_date: params.birthdayDate,
      emoji: params.emoji,
      message: params.message.trim() || null,
      color: params.color,
      background_image_url: params.backgroundImageUrl ?? null,
      text_box_enabled: !!params.textBoxEnabled,
      text_box_style: params.textBoxStyle ?? "none",
    });
    if (error) {
      const dup = error.code === "23505";
      toast({
        title: dup ? "Already sent" : "Couldn't send card",
        description: dup ? "You've already sent a card for this birthday." : error.message,
        variant: dup ? "default" : "destructive",
      });
      return { ok: false as const, error: error.message };
    }
    toast({ title: "Birthday card sent 🎉" });
    qc.invalidateQueries({ queryKey: ["birthday-cards"] });
    return { ok: true as const };
  };
}

export function useMarkCardOpened() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return async (cardId: string) => {
    if (!user) return;
    await (supabase as any)
      .from("birthday_cards")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", cardId)
      .eq("recipient_id", user.id);
    qc.invalidateQueries({ queryKey: ["birthday-cards"] });
  };
}
