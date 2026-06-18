import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users, Clock, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

type Status = "none" | "pending" | "approved" | "declined";

/**
 * Non-host flow: a friend can ask the host to make them a co-host. On
 * approval, the host trigger inserts them into `event_collaborators` so they
 * get full collaborator permissions (invite directly, edit bring list, etc.).
 */
export default function RequestCohostSheet({ open, onOpenChange, eventId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("none");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("event_cohost_requests" as any)
        .select("status, message")
        .eq("event_id", eventId)
        .eq("requester_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const row = data as any;
      setStatus((row?.status as Status) ?? "none");
      setMessage(row?.message ?? "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, eventId, user?.id]);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("event_cohost_requests" as any)
        .upsert(
          { event_id: eventId, requester_id: user.id, message: message.trim() || null, status: "pending" },
          { onConflict: "event_id,requester_id" },
        );
      if (error) throw error;
      setStatus("pending");
      toast({ title: "Request sent", description: "The host will get a notification." });
    } catch (err: any) {
      toast({ title: "Couldn't send request", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await supabase
        .from("event_cohost_requests" as any)
        .delete()
        .eq("event_id", eventId)
        .eq("requester_id", user.id);
      setStatus("none");
      setMessage("");
      toast({ title: "Request cancelled" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Help organize
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Ask the host to make you a co-host. You'll be able to invite people
            directly, edit the bring-list and see RSVPs.
          </p>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : status === "approved" ? (
          <div className="mt-6 rounded-2xl bg-primary/10 border border-primary/30 p-4 text-center">
            <Check className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-semibold">You're a co-host</p>
            <p className="text-xs text-muted-foreground mt-1">
              The host added you. You now have collaborator access.
            </p>
          </div>
        ) : status === "pending" ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-secondary/40 border border-border p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold">Waiting for host</p>
              <p className="text-xs text-muted-foreground mt-1">
                They'll get a notification with Approve / Decline.
              </p>
            </div>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={cancel} disabled={submitting}>
              Cancel request
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Message (optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hey — happy to help with invites and the bring list."
                rows={3}
                maxLength={280}
              />
              {status === "declined" && (
                <p className="text-[11px] text-muted-foreground italic">
                  Previous request was declined. You can ask again.
                </p>
              )}
            </div>
            <Button
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 glow-sm"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send request"}
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
