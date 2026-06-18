import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Props {
  eventId: string;
}

const AnonymousFeedbackList = ({ eventId }: Props) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["exit-poll-comments", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_exit_poll_comments" as any, {
        _event_id: eventId,
      });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  if (isLoading) return null;
  if (!data.length) return null;

  return (
    <Card className="glass">
      <CardContent className="p-5 space-y-3">
        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
          Anonymous feedback
        </p>
        <div className="space-y-2">
          {data.map((c: any, i: number) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className="rounded-xl bg-white/5 border border-white/10 p-3"
            >
              <p className="text-sm leading-snug">{c.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnonymousFeedbackList;
