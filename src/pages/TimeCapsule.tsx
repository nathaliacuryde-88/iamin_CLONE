import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePlus, Trash2, ArrowRight } from "lucide-react";
import { parseISO } from "date-fns";
import { format } from "@/lib/dateFormat";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import CapsuleGallery from "@/components/CapsuleGallery";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { signCapsuleUrls } from "@/lib/capsuleUrls";
import { useCapsuleUpload } from "@/hooks/useCapsuleUpload";

type Photo = {
  id: string;
  image_url: string;
  user_id: string;
  event_id: string;
};

const eventStartMs = (date: string, time?: string | null) => {
  const cleanTime = time?.match(/^\d{2}:\d{2}/)?.[0] ?? "00:00";
  return new Date(`${date}T${cleanTime}:00`).getTime();
};

const TimeCapsule = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; index: number } | null>(null);
  const [uploadingEventId, setUploadingEventId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const haptic = useHaptics();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Safety: if we arrived here from the Feed (which adds `feed-locked` to
  // html/body to disable scrolling), strip those classes so this page scrolls.
  useEffect(() => {
    document.documentElement.classList.remove("feed-locked");
    document.body.classList.remove("feed-locked");
  }, []);

  const { uploading, uploadFiles, deletePhoto } = useCapsuleUpload(uploadingEventId ?? undefined);

  const { data: pastEvents, isLoading } = useQuery({
    queryKey: ["time-capsule-events", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Scope capsules to events the current user CREATED or RSVP'd to.
      // Without this, RLS-public events would show up for unrelated users
      // (e.g. venue accounts seeing every public party's capsule).
      const { data: rsvpRows } = await supabase
        .from("attendees")
        .select("event_id, status")
        .eq("user_id", user!.id);
      const attendedIds = (rsvpRows ?? [])
        .filter((r: any) => r.status !== "not_going")
        .map((r: any) => r.event_id as string);

      let query = supabase
        .from("events")
        .select("*")
        .is("capsule_dismissed_at" as any, null)
        .order("date", { ascending: false });

      if (attendedIds.length > 0) {
        query = query.or(`created_by.eq.${user!.id},id.in.(${attendedIds.join(",")})`);
      } else {
        query = query.eq("created_by", user!.id);
      }

      const { data: events, error } = await query;
      if (error) throw error;

      const now = Date.now();
      const past = (events ?? []).filter((e) => {
        if (!e.date) return false;
        const t = (e as any).time as string | null | undefined;
        const start = eventStartMs(e.date, t);
        return Number.isFinite(start) && now >= start + 60 * 60 * 1000;
      });
      if (past.length === 0) return [];

      const eventIds = past.map((e) => e.id);
      const [{ data: photos }, { data: messages }, { data: attendees }] = await Promise.all([
        supabase
          .from("time_capsule_photos")
          .select("*")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("time_capsule_messages")
          .select("event_id")
          .in("event_id", eventIds),
        supabase
          .from("attendees")
          .select("event_id, user_id")
          .in("event_id", eventIds),
      ]);

      const signed = await signCapsuleUrls(photos ?? [], 24 * 60 * 60, {
        width: 800, quality: 75, resize: "contain",
      });
      const messageCountByEvent = new Map<string, number>();
      (messages ?? []).forEach((m: any) => {
        messageCountByEvent.set(m.event_id, (messageCountByEvent.get(m.event_id) ?? 0) + 1);
      });
      const peopleByEvent = new Map<string, Set<string>>();
      (attendees ?? []).forEach((a: any) => {
        if (!peopleByEvent.has(a.event_id)) peopleByEvent.set(a.event_id, new Set());
        peopleByEvent.get(a.event_id)!.add(a.user_id);
      });

      return past.map((event) => ({
        ...event,
        photos: signed.filter((p) => p.event_id === event.id),
        messageCount: messageCountByEvent.get(event.id) ?? 0,
        peopleCount: peopleByEvent.get(event.id)?.size ?? 0,
      }));
    },
  });

  const isVideoUrl = (url: string) => /\.(mp4|mov|m4v|webm|quicktime)(\?|$)/i.test(url);

  const handleDeleteCapsule = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    haptic("light");
    const { error } = await supabase
      .from("events")
      .update({ capsule_dismissed_at: new Date().toISOString() } as any)
      .eq("id", eventId);
    if (error) {
      toast({ title: t("capsule_actions.could_not_clear"), description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["time-capsule-events"] });
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `capsule-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const triggerUpload = (eventId: string) => {
    haptic("light");
    setUploadingEventId(eventId);
    fileRef.current?.click();
  };

  const ptr = usePullToRefresh({
    containerRef: scrollRef,
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["time-capsule-events"] });
    },
  });

  return (
    <AppLayout>
      <div
        ref={scrollRef}
        className="relative overflow-y-auto overscroll-contain scrollbar-hide"
        style={{
          height: "calc(100dvh - 3.5rem - env(safe-area-inset-top))",
          WebkitOverflowScrolling: "touch" as any,
        }}
      >
        <PullToRefreshIndicator {...ptr} />
        <div className="max-w-lg mx-auto pt-3 pb-32 md:pb-6 px-4">
          <header className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("capsule.list_title", { defaultValue: "Capsules" })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("capsule.list_subtitle", { defaultValue: "Shared memories, one per night." })}
            </p>
          </header>

          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : pastEvents && pastEvents.length > 0 ? (
            <div className="space-y-6">
              {pastEvents.map((event) => {
                const tiles = event.photos.slice(0, 4);
                const positions = [
                  { top: "4%",  left: "6%",  rot: -7 },
                  { top: "2%",  left: "52%", rot: 5  },
                  { top: "42%", left: "28%", rot: -3 },
                  { top: "48%", left: "60%", rot: 6  },
                ];
                const extra = event.photos.length - 4;
                return (
                  <article key={event.id} className="rounded-3xl capsule-surface p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="font-semibold text-foreground text-base truncate flex-1 min-w-0">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {event.date && format(parseISO(event.date), "EEE d MMM")}
                        </p>
                        {event.created_by === user?.id && event.photos.length === 0 && event.messageCount === 0 && (
                          <button
                            onClick={(e) => handleDeleteCapsule(event.id, e)}
                            className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label={t("capsule_actions.clear_capsule")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    {event.photos.length > 0 ? (
                      <div className="relative h-56 mt-1 mb-3">
                        {tiles.map((photo, idx) => {
                          const pos = positions[idx];
                          const isLast = idx === 3 && extra > 0;
                          return (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => setLightbox({ photos: event.photos, index: isLast ? 0 : idx })}
                              className="absolute w-[42%] aspect-square rounded-2xl overflow-hidden bg-secondary border-2 border-card shadow-[0_8px_28px_-12px_hsl(var(--primary)/0.45)] transition-transform hover:scale-105 active:scale-95"
                              style={{
                                top: pos.top,
                                left: pos.left,
                                transform: `rotate(${pos.rot}deg)`,
                                zIndex: 10 + idx,
                              }}
                              aria-label={`Open photo ${idx + 1}`}
                            >
                              {isVideoUrl(photo.image_url) ? (
                                <video
                                  src={photo.image_url}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                              )}
                              {!isLast && isVideoUrl(photo.image_url) && (
                                <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                </span>
                              )}
                              {isLast && (
                                <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="text-white font-bold text-xl drop-shadow">+{extra}</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => triggerUpload(event.id)}
                        disabled={uploading && uploadingEventId === event.id}
                        className="w-full rounded-2xl border border-dashed border-border/60 bg-card/40 py-12 flex flex-col items-center justify-center text-muted-foreground hover:bg-card/60 hover:text-foreground transition-colors mb-3"
                      >
                        <ImagePlus className="h-6 w-6 mb-2 opacity-60" />
                        <span className="text-xs text-center px-4">
                          {uploading && uploadingEventId === event.id
                            ? t("capsule.uploading")
                            : t("capsule.empty_48h", { defaultValue: "Empty capsule — you have 48h to upload something, otherwise it will be deleted." })}
                        </span>
                      </button>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs">
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <span>{event.photos.length} {t("capsule.photos_short", { defaultValue: "photos" })}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden>🔮</span>
                          {event.messageCount}
                        </span>
                        <span>·</span>
                        <span>{event.peopleCount} {t("capsule.people_short", { defaultValue: "people" })}</span>
                      </p>
                      <Link
                        to={`/time-capsule/${event.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/80"
                      >
                        {t("capsule.open", { defaultValue: "Open" })}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="mx-auto mb-4 text-6xl leading-none animate-wiggle-float origin-center">
                <span role="img" aria-label="Camera">📸</span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">{t("capsule.no_past_events")}</p>
              <p className="text-muted-foreground/60 text-xs mt-1">{t("capsule.events_move_here")}</p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime,video/webm"
            multiple
            className="hidden"
            onChange={(e) => {
              uploadFiles(e.target.files);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />

          {lightbox && (
            <CapsuleGallery
              open
              photos={lightbox.photos}
              startIndex={lightbox.index}
              onClose={() => setLightbox(null)}
              onDownload={handleDownload}
              onDelete={async (photoId) => {
                const photo = lightbox.photos.find((p) => p.id === photoId);
                if (!photo || photo.user_id !== user?.id) return;
                if (!confirm(t("capsule_actions.delete_photo_confirm"))) return;
                setUploadingEventId(photo.event_id);
                const ok = await deletePhoto(photoId);
                if (ok) setLightbox(null);
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default TimeCapsule;
