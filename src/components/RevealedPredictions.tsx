import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCapsuleMessages } from "@/hooks/useCapsuleMessages";
import { getAvatarEmoji } from "@/lib/avatarEmoji";

interface Props {
  eventId: string;
}

/**
 * "Revealed" predictions card section. Renders nothing when no sealed
 * messages exist for the event. Each card flips in on a 3D X-axis with a
 * staggered spring for a polished reveal.
 */
const RevealedPredictions = ({ eventId }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useCapsuleMessages(eventId);

  if (isLoading || messages.length === 0) return null;

  return (
    <section className="rounded-3xl capsule-surface p-5">
      <header className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden>🔮</span>
        <h2 className="text-base font-semibold text-foreground">
          {t("capsule.detail.revealed_title")}
        </h2>
      </header>

      <div className="space-y-3" style={{ perspective: 800 }}>
        {messages.map((m, i) => {
          const isMine = m.user_id === user?.id;
          const name = isMine ? t("common.you") : m.profile?.display_name ?? "—";
          const seed = m.profile?.username ?? m.profile?.display_name ?? m.user_id;
          const { emoji, gradient } = getAvatarEmoji(seed);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, rotateX: 90 }}
              animate={{ opacity: 1, rotateX: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: i * 0.12,
              }}
              style={{ transformOrigin: "top center" }}
              className="rounded-2xl border border-border/60 bg-card/60 p-[14px]"
            >
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                “{m.content}”
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                  <AvatarFallback
                    className="text-[11px] text-foreground"
                    style={{ background: gradient }}
                  >
                    <span aria-hidden>{emoji}</span>
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground/80 font-medium">{name}</span>
                  <span className="mx-1">·</span>
                  {t("capsule.detail.sealed_before")}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default RevealedPredictions;
