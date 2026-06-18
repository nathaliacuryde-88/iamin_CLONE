import { useMemo, useState } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { parseISO } from "date-fns";
import { format } from "@/lib/dateFormat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDateLocale } from "@/lib/dateLocale";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CapsuleMessage,
  useCapsuleMessages,
  useDeleteCapsuleMessage,
  useSaveCapsuleMessage,
} from "@/hooks/useCapsuleMessages";
import { Hourglass } from "lucide-react";

const schema = z.object({
  content: z.string().trim().min(1).max(500),
});

// Rotating placeholders for the sealed-message composer. Generic enough that
// they never reference a real attendee — and tuned by vibe so a dinner doesn't
// get a "we close the place down" prompt.
const PLACEHOLDERS: Record<string, { en: string[]; de: string[] }> = {
  party: {
    en: [
      "Calling it now — we close the place down.",
      "Someone's losing a jacket tonight.",
      "Bet the line is worth it.",
      "First one to bail owes the next round.",
    ],
    de: [
      "Wir machen den Laden heute zu — versprochen.",
      "Heute geht eine Jacke verloren.",
      "Wetten die Schlange lohnt sich?",
      "Wer zuerst geht, zahlt die nächste Runde.",
    ],
  },
  dinner: {
    en: [
      "We're definitely ordering one too many.",
      "Calling dibs on dessert.",
      "Reservation runs 45min late — screenshot this.",
      "One of us forgets the wine. Place your bets.",
    ],
    de: [
      "Wir bestellen heute garantiert einen Gang zu viel.",
      "Nachtisch gehört mir.",
      "Reservierung verschiebt sich 45 Min — Screenshot speichern.",
      "Einer vergisst den Wein. Tippt mit.",
    ],
  },
  concert: {
    en: [
      "We'll lose our voices by the encore.",
      "Setlist prediction: the deep cut nobody asked for.",
      "Bet we end up way closer to the stage than planned.",
    ],
    de: [
      "Stimme weg spätestens nach der Zugabe.",
      "Setlist-Tipp: irgendein Song, den keiner kennt.",
      "Wir landen näher an der Bühne als geplant.",
    ],
  },
  sports: {
    en: [
      "Underdog wins. Mark it.",
      "Someone forgets sunscreen.",
      "We talk about this match for weeks.",
    ],
    de: [
      "Außenseiter gewinnt. Vormerken.",
      "Einer vergisst die Sonnencreme.",
      "Über dieses Spiel reden wir noch in Wochen.",
    ],
  },
  art: {
    en: [
      "We'll pretend to understand at least one piece.",
      "Someone takes the most pretentious photo.",
      "Hot take incoming once we leave.",
    ],
    de: [
      "Wir tun so, als hätten wir mindestens ein Werk verstanden.",
      "Jemand macht das prätentiöseste Foto.",
      "Heißer Take folgt direkt nach dem Rausgehen.",
    ],
  },
  default: {
    en: [
      "Bet this one runs late.",
      "Predict the plot twist.",
      "Drop your hot take before it starts.",
      "Calling it: this becomes a story we tell again.",
    ],
    de: [
      "Wetten, das wird wieder spät.",
      "Sag den Plot-Twist voraus.",
      "Heißer Take vor dem Start, los.",
      "Daraus wird eine Geschichte, die wir nochmal erzählen.",
    ],
  },
};

const VIBE_BUCKETS: Record<string, keyof typeof PLACEHOLDERS> = {
  party: "party", club: "party", nightlife: "party", rave: "party", festival: "party",
  dinner: "dinner", food: "dinner", brunch: "dinner", restaurant: "dinner",
  concert: "concert", live: "concert", music: "concert", gig: "concert",
  sports: "sports", outdoor: "sports", run: "sports", hike: "sports", game: "sports",
  art: "art", gallery: "art", exhibition: "art", culture: "art", museum: "art",
};

const pickPlaceholder = (vibe: string | null | undefined, lang: string): string => {
  const key = (vibe ?? "").toLowerCase().trim();
  const bucketKey = VIBE_BUCKETS[key] ?? "default";
  const bucket = PLACEHOLDERS[bucketKey];
  const list = lang?.startsWith("de") ? bucket.de : bucket.en;
  return list[Math.floor(Math.random() * list.length)];
};

const CapsuleMessageCard = ({
  eventId,
  eventEnded,
  canCompose,
  vibeCategory,
}: {
  eventId: string;
  eventEnded: boolean;
  canCompose: boolean;
  vibeCategory?: string | null;
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateLocale();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: messages = [], isLoading } = useCapsuleMessages(eventId);
  const save = useSaveCapsuleMessage(eventId);
  const remove = useDeleteCapsuleMessage(eventId);

  const mine = messages.find((m) => m.user_id === user?.id) ?? null;
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const placeholder = useMemo(
    () => pickPlaceholder(vibeCategory, i18n.language),
    [vibeCategory, i18n.language, eventId]
  );

  // After event ends: render each attendee's sealed message as its own card
  if (eventEnded) {
    if (isLoading) return null;
    // Render nothing when no one sealed a message — keeps the capsule clean.
    if (messages.length === 0) return null;
    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground/80 font-medium">
          {t("capsule.message.revealed_title")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {messages.map((m) => (
            <RevealedNote key={m.id} message={m} />
          ))}
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const parsed = schema.safeParse({ content: draft });
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0]?.message ?? "Invalid", variant: "destructive" });
      return;
    }
    save.mutate(
      { id: mine?.id, content: parsed.data.content },
      {
        onSuccess: () => {
          setDraft("");
          setEditing(false);
          toast({ title: t("capsule.message.sealed") });
        },
        onError: (e: any) =>
          toast({ title: e?.message ?? "Failed", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!mine) return;
    remove.mutate(mine.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        setDraft("");
        setEditing(false);
      },
    });
  };

  // Sealed view (own note already written)
  if (mine && !editing) {
    return (
      <Card className="tactile-widget">
        <CardHeader>
          <CardTitle className="tactile-title flex items-center gap-2">
            <Hourglass className="h-3.5 w-3.5 text-primary" />
            {t("capsule.message.title")}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t("capsule.message.your_private_note")}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-sm font-medium">{t("capsule.message.sealed")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("capsule.message.opens_after")}
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-3">
              {t("capsule.message.sealed_on", {
                date: format(new Date(mine.created_at), "PP", { locale: dateLocale }),
              })}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(mine.content);
                setEditing(true);
              }}
            >
              {t("common.edit")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              {t("common.delete")}
            </Button>
          </div>

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("capsule.message.delete_confirm")}</AlertDialogTitle>
                <AlertDialogDescription>{t("capsule.message.opens_after")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  // Compose / edit view
  if (!canCompose) return null;
  const remaining = 500 - draft.length;
  return (
    <Card className="tactile-widget">
      <CardHeader>
        <CardTitle className="tactile-title flex items-center gap-2">
          <Hourglass className="h-3.5 w-3.5 text-primary" />
          {t("capsule.message.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {t("capsule.message.subtitle")}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          placeholder={placeholder}
          rows={4}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span className={`text-xs ${remaining < 50 ? "text-destructive" : "text-muted-foreground"}`}>
            {t("capsule.message.char_count", { count: draft.length })}
          </span>
          <div className="flex gap-2">
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(""); }}>
                {t("common.cancel")}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!draft.trim() || save.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {mine ? t("capsule.message.update") : t("capsule.message.save")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RevealedNote = ({ message }: { message: CapsuleMessage }) => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { user } = useAuth();
  const isMine = message.user_id === user?.id;
  const dateLabel = format(parseISO(message.created_at), "PP", { locale: dateLocale });
  return (
    <div className="rounded-md p-4 shadow-md bg-[#fff3a3] text-[#3a2f00] border border-[#e6d262]/60">
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-7 w-7 ring-1 ring-[#e6d262]/60">
          <AvatarImage src={message.profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[10px] bg-[#fde98a] text-[#3a2f00]">
            {message.profile?.display_name?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {isMine ? t("common.you") : message.profile?.display_name ?? "—"}
          </p>
          <p className="text-[11px] text-[#3a2f00]/70">
            {isMine
              ? t("capsule.message.you_wrote_on", { date: dateLabel })
              : t("capsule.message.wrote_on", { date: dateLabel })}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {message.content}
      </p>
    </div>
  );
};

export default CapsuleMessageCard;
