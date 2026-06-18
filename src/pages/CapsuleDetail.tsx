import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Receipt, X } from "lucide-react";
import { parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEventPulseStats } from "@/hooks/useEventPulseStats";
import { useCapsuleUpload } from "@/hooks/useCapsuleUpload";
import { signCapsuleUrls } from "@/lib/capsuleUrls";
import { format } from "@/lib/dateFormat";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { emojiFallbackProps } from "@/lib/avatarEmoji";
import CapsuleGallery from "@/components/CapsuleGallery";
import RevealedPredictions from "@/components/RevealedPredictions";
import BlurImage from "@/components/BlurImage";
import { useToast } from "@/hooks/use-toast";
import NightReceipt from "@/sheets/NightReceipt";
import { useHaptics } from "@/hooks/useHaptics";

type Photo = { id: string; image_url: string; user_id: string; event_id: string };
type Attendee = { user_id: string; profile?: { display_name: string | null; avatar_url: string | null; username: string | null } | null };

const parseCoverMeta = (description: string | null | undefined) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};

const CapsuleDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const haptic = useHaptics();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const { uploading, uploadFiles, deletePhoto } = useCapsuleUpload(eventId);

  const { data, isLoading } = useQuery({
    queryKey: ["capsule-detail", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const [{ data: event }, { data: photos }, { data: atts }] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId!).maybeSingle(),
        supabase.from("time_capsule_photos").select("*").eq("event_id", eventId!).order("created_at", { ascending: false }),
        supabase.from("attendees").select("user_id, status").eq("event_id", eventId!).eq("status", "going"),
      ]);
      const signed = await signCapsuleUrls(photos ?? [], 24 * 60 * 60, {
        width: 800, quality: 75, resize: "contain",
      });
      const ids = (atts ?? []).map((a) => a.user_id);
      let profs: any[] = [];
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("user_id, display_name, avatar_url, username").in("user_id", ids);
        profs = data ?? [];
      }
      const profMap = new Map(profs.map((p) => [p.user_id, p]));
      const attendees: Attendee[] = (atts ?? []).map((a) => ({ user_id: a.user_id, profile: profMap.get(a.user_id) ?? null }));
      return { event, photos: signed as Photo[], attendees };
    },
  });

  const { data: pulse } = useEventPulseStats(eventId);

  const event = data?.event as any;
  const photos: Photo[] = data?.photos ?? [];
  const attendees: Attendee[] = data?.attendees ?? [];
  const shownAttendees = attendees.slice(0, 3);
  const extraAttendees = Math.max(0, attendees.length - shownAttendees.length);
  const cover = event?.image_url ?? null;
  const coverMeta = !cover ? parseCoverMeta(event?.description) : null;

  const isVideoUrl = (url: string) => /\.(mp4|mov|m4v|webm|quicktime)(\?|$)/i.test(url);

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

  const handleClose = () => {
    haptic("light");
    navigate(-1);
  };

  // Swipe-down-to-close: arms only when the gesture starts at the top of the
  // page AND in the upper region. Translates the WHOLE page via CSS so the
  // entire detail slides, not just the handle.
  const CLOSE_THRESHOLD = 60;
  const touchStartY = useRef<number | null>(null);
  const dragArmed = useRef(false);
  const [closeDrag, setCloseDrag] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const atTop = (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    dragArmed.current = atTop && t.clientY < 320;
    touchStartY.current = t.clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragArmed.current || touchStartY.current == null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      const next = Math.min(220, dy * 0.85);
      if (closeDrag < 24 && next >= 24) haptic("light");
      setCloseDrag(next);
    } else if (dy < -8) {
      dragArmed.current = false;
      setCloseDrag(0);
    }
  };
  const handleTouchEnd = () => {
    if (dragArmed.current && closeDrag >= CLOSE_THRESHOLD) {
      haptic("medium");
      setCloseDrag(0);
      dragArmed.current = false;
      handleClose();
      return;
    }
    dragArmed.current = false;
    setCloseDrag(0);
    touchStartY.current = null;
  };

  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-x-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        transform: closeDrag > 0 ? `translateY(${closeDrag}px)` : undefined,
        transition: closeDrag > 0 ? "none" : "transform 220ms cubic-bezier(0.2,0.8,0.2,1)",
        opacity: closeDrag > 0 ? Math.max(0.7, 1 - closeDrag / 400) : 1,
      }}
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Drag-to-close handle (visual indicator only) */}
      <div
        className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
        style={{ top: "calc(env(safe-area-inset-top) + 4px)" }}
      >
        <div className="h-2 w-16 rounded-full bg-foreground/25 my-2" />
      </div>

      {/* Close button — top right */}
      <button
        type="button"
        onClick={handleClose}
        aria-label={t("common.close", { defaultValue: "Close" })}
        className="fixed right-4 z-40 inline-flex items-center justify-center h-9 w-9 rounded-full bg-background/70 backdrop-blur-xl border border-border/60 text-foreground shadow-md"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <X className="h-4 w-4" />
      </button>



      <div
        className="max-w-lg mx-auto pb-32 px-4 space-y-4 relative z-10"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 56px)" }}
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl bg-muted/40" />
            <Skeleton className="h-40 rounded-3xl bg-muted/40" />
            <Skeleton className="h-60 rounded-3xl bg-muted/40" />
          </div>
        ) : !event ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Event not found.</p>
        ) : (
          <>
            {/* Compact header card — small event thumbnail (calendar-card style) */}
            <section className="rounded-2xl capsule-surface p-3 flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl overflow-hidden bg-secondary shrink-0">
                {cover ? (
                  <BlurImage src={cover} alt={event.name} className="w-full h-full" />
                ) : coverMeta ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `hsl(${coverMeta.color})` }}
                  >
                    <span className="text-2xl">{coverMeta.emoji}</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl opacity-50">✦</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-foreground truncate leading-tight">
                  {event.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {event.date && format(parseISO(event.date), "EEE d MMM")}
                  {event.city ? ` · ${event.city}` : ""}
                </p>
              </div>
              {attendees.length > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center -space-x-2">
                    {shownAttendees.map((a) => (
                      <Avatar key={a.user_id} className="h-6 w-6 ring-2 ring-card">
                        <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[9px]" {...emojiFallbackProps(a.profile?.username ?? a.profile?.display_name ?? a.user_id)} />
                      </Avatar>
                    ))}
                  </div>
                  {extraAttendees > 0 && (
                    <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-secondary text-[10px] font-semibold text-foreground/80 ring-2 ring-card">
                      +{extraAttendees}
                    </span>
                  )}
                </div>
              )}
            </section>

            {/* Revealed predictions */}
            <RevealedPredictions eventId={event.id} />

            {/* Photos */}
            <section className="rounded-3xl capsule-surface p-5">
              <header className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
                  <span aria-hidden>🎞️</span>
                  {t("capsule.detail.photos_title")} ({photos.length})
                </h2>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? t("capsule.uploading") : t("capsule.detail.add_photos")}
                </button>
              </header>

              {photos.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border border-dashed border-border/60 bg-card/40 py-10 flex flex-col items-center justify-center text-muted-foreground hover:bg-card/60 transition-colors"
                >
                  <ImagePlus className="h-6 w-6 mb-2 opacity-60" />
                  <span className="text-xs">{t("capsule.no_photos_cta")}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-secondary active:scale-95 transition-transform"
                      aria-label={`Open photo ${i + 1}`}
                    >
                      {isVideoUrl(p.image_url) ? (
                        <video src={p.image_url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                      ) : (
                        <BlurImage src={p.image_url} alt="" className="w-full h-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Morning-after receipt — widget BEFORE exit poll */}
            <button
              type="button"
              onClick={() => { haptic("light"); setReceiptOpen(true); }}
              className="w-full rounded-2xl capsule-surface px-5 py-4 flex items-center justify-center gap-2.5 text-foreground font-semibold text-sm hover:bg-card/60 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              {t("receipt.widget_title", { defaultValue: "Morning-after receipt" })}
            </button>

            {/* Exit poll */}
            {pulse && pulse.total_ratings > 0 && (
              <section className="rounded-3xl capsule-surface p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t("capsule.detail.exit_poll")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("capsule.detail.votes", { count: pulse.total_ratings })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pulse.fire_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-card/60 border border-border/60 px-3 py-1 text-sm font-semibold">🔥 {pulse.fire_count}</span>
                  )}
                  {pulse.mid_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-card/60 border border-border/60 px-3 py-1 text-sm font-semibold">😐 {pulse.mid_count}</span>
                  )}
                  {pulse.flop_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-card/60 border border-border/60 px-3 py-1 text-sm font-semibold">💀 {pulse.flop_count}</span>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />

        {lightboxIndex !== null && photos.length > 0 && (
          <CapsuleGallery
            open
            photos={photos}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onDownload={handleDownload}
            onDelete={async (photoId) => {
              const photo = photos.find((p) => p.id === photoId);
              if (!photo || photo.user_id !== user?.id) return;
              if (!confirm(t("capsule_actions.delete_photo_confirm"))) return;
              const ok = await deletePhoto(photoId);
              if (ok) setLightboxIndex(null);
            }}
          />
        )}
      </div>

      {event && (
        <NightReceipt eventId={event.id} open={receiptOpen} onOpenChange={setReceiptOpen} />
      )}
    </motion.div>
  );
};

export default CapsuleDetail;
