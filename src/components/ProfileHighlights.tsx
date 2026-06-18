import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CapsuleGallery from "@/components/CapsuleGallery";
import { useHaptics } from "@/hooks/useHaptics";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signCapsuleUrls } from "@/lib/capsuleUrls";
import BlurImage from "@/components/BlurImage";


type EventPhoto = { id: string; image_url: string };
type EventGroup = {
  event_id: string;
  name: string;
  date: string | null;
  image_url: string | null;
  photos: EventPhoto[];
};
type SavedRow = { id: string; event_id: string; photo_id: string };

interface Props {
  /** The profile being viewed. */
  profileUserId: string;
  canEdit?: boolean;
}

/**
 * Instagram-style "Highlights" rail. Each circle = one event the user
 * curated. Multiple photos can be selected per event; opening a circle
 * shows only the selected photos.
 */
const ProfileHighlights = ({ profileUserId, canEdit = false }: Props) => {
  const haptic = useHaptics();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Local draft of photo selections per event in the picker
  const [draft, setDraft] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState(false);

  // Display data via RPC — bypasses RLS for mutual friends
  const { data: displayData, refetch: refetchDisplay } = useQuery<{ groups: { event: EventGroup; photos: EventPhoto[] }[] }>({
    queryKey: ["profile-highlights-display", profileUserId],
    queryFn: async () => {
      const { data: rows } = await supabase.rpc("get_profile_highlights" as any, { _profile_user_id: profileUserId });
      const list = (rows ?? []) as any[];
      if (list.length === 0) return { groups: [] };
      const signed = await signCapsuleUrls(
        list.map((r) => ({ id: r.photo_id, image_url: r.photo_url, event_id: r.event_id })),
        24 * 60 * 60,
        { width: 200, height: 200, quality: 70, resize: "cover" },
      );
      const signedByPhotoId = new Map(signed.map((s: any) => [s.id, s.image_url]));
      const byEvent = new Map<string, { event: EventGroup; photos: EventPhoto[] }>();
      for (const r of list) {
        if (!byEvent.has(r.event_id)) {
          byEvent.set(r.event_id, {
            event: {
              event_id: r.event_id,
              name: r.event_name,
              date: r.event_date,
              image_url: r.event_image_url,
              photos: [],
            },
            photos: [],
          });
        }
        byEvent.get(r.event_id)!.photos.push({
          id: r.photo_id,
          image_url: signedByPhotoId.get(r.photo_id) ?? r.photo_url,
        });
      }
      return { groups: Array.from(byEvent.values()) };
    },
    enabled: !!profileUserId,
  });

  // Picker data — only needed when editing own highlights
  const { data, refetch } = useQuery<{ events: EventGroup[]; saved: SavedRow[] }>({
    queryKey: ["profile-highlights", profileUserId],
    queryFn: async () => {
      const [{ data: attendances }, { data: createdEvents }] = await Promise.all([
        supabase.from("attendees").select("event_id").eq("user_id", profileUserId),
        supabase.from("events").select("id").eq("created_by", profileUserId),
      ]);
      const ids = Array.from(
        new Set([
          ...((attendances ?? []).map((a) => a.event_id)),
          ...((createdEvents ?? []).map((e) => e.id)),
        ]),
      );
      if (ids.length === 0) return { events: [], saved: [] };

      const { data: events } = await supabase
        .from("events")
        .select("id, name, date, image_url")
        .in("id", ids)
        .order("date", { ascending: false });

      const [{ data: photos }, { data: selected }] = await Promise.all([
        supabase.from("time_capsule_photos").select("id, image_url, event_id").in("event_id", ids),
        supabase.from("profile_highlights" as any).select("id, event_id, photo_id").eq("user_id", profileUserId),
      ]);

      const signedPhotos = await signCapsuleUrls(photos ?? [], 24 * 60 * 60, {
        width: 240, height: 240, quality: 70, resize: "cover",
      });

      const grouped: EventGroup[] = (events ?? [])
        .map((e) => ({
          event_id: e.id,
          name: e.name,
          date: e.date,
          image_url: e.image_url,
          photos: signedPhotos
            .filter((p) => p.event_id === e.id)
            .map((p) => ({ id: p.id, image_url: p.image_url })),
        }))
        .filter((e) => e.photos.length > 0);


      return { events: grouped, saved: (selected ?? []) as any as SavedRow[] };
    },
    enabled: !!profileUserId && canEdit,
  });

  const events = data?.events ?? [];
  const saved = data?.saved ?? [];

  const highlightGroups = displayData?.groups ?? [];

  const openPicker = () => {
    // Seed draft from saved selections
    const seed: Record<string, Set<string>> = {};
    for (const s of saved) {
      if (!seed[s.event_id]) seed[s.event_id] = new Set();
      seed[s.event_id].add(s.photo_id);
    }
    setDraft(seed);
    haptic("light");
    setPickerOpen(true);
  };

  const togglePhoto = (eventId: string, photoId: string) => {
    haptic("selection");
    setDraft((prev) => {
      const next = { ...prev, [eventId]: new Set(prev[eventId] ?? []) };
      if (next[eventId].has(photoId)) next[eventId].delete(photoId);
      else next[eventId].add(photoId);
      return next;
    });
  };

  const saveDraft = async () => {
    setSaving(true);
    haptic("medium");
    try {
      const desired = new Set<string>(); // key = `${eventId}:${photoId}`
      for (const [eventId, set] of Object.entries(draft)) {
        for (const photoId of set) desired.add(`${eventId}:${photoId}`);
      }
      const current = new Set(saved.map((s) => `${s.event_id}:${s.photo_id}`));

      const toAdd = [...desired].filter((k) => !current.has(k));
      const toRemoveIds = saved.filter((s) => !desired.has(`${s.event_id}:${s.photo_id}`)).map((s) => s.id);

      if (toAdd.length) {
        const rows = toAdd.map((k) => {
          const [event_id, photo_id] = k.split(":");
          return { user_id: profileUserId, event_id, photo_id };
        });
        await supabase.from("profile_highlights" as any).insert(rows);
      }
      if (toRemoveIds.length) {
        await supabase.from("profile_highlights" as any).delete().in("id", toRemoveIds);
      }
      await refetch(); await refetchDisplay();
      setPickerOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const removeEntireHighlight = async (eventId: string) => {
    haptic("light");
    const ids = saved.filter((s) => s.event_id === eventId).map((s) => s.id);
    if (!ids.length) return;
    await supabase.from("profile_highlights" as any).delete().in("id", ids);
    await refetch(); await refetchDisplay();
  };

  const isLoading = displayData === undefined;

  if (isLoading) {
    return (
      <div className="relative left-1/2 -translate-x-1/2 w-screen">
        <div className="flex gap-4 overflow-x-hidden py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 flex flex-col items-center gap-1.5">
              <span className="h-[72px] w-[72px] rounded-full bg-muted/40 animate-pulse" />
              <span className="h-2.5 w-12 rounded bg-muted/40 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }


  if (highlightGroups.length === 0 && !canEdit) return null;

  return (
    <>
      {/* Full-bleed rail: bleeds to both viewport edges, but inner padding
          keeps the first item aligned with the page gutter (avatar / event cards). */}
      <div className="relative left-1/2 -translate-x-1/2 w-screen">
        <div
          className="flex gap-4 overflow-x-auto scrollbar-hide py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-4 snap-x"
          style={{
            touchAction: "pan-x",
            overscrollBehaviorX: "contain",
          }}
        >




          {canEdit && (
            <button
              type="button"
              onClick={openPicker}
              className="snap-start shrink-0 flex flex-col items-center gap-1.5"
              aria-label="Edit profile highlights"
            >
              <span className="h-[72px] w-[72px] rounded-full border border-dashed border-primary/70 bg-secondary/50 flex items-center justify-center text-primary">
                <Plus className="h-6 w-6" />
              </span>
              <span className="text-[10px] text-muted-foreground font-medium max-w-[72px] truncate text-center">
                {highlightGroups.length > 0 ? "Edit" : "New"}
              </span>
            </button>
          )}
          {highlightGroups.map((g, i) => {
            const cover = g.photos[0]?.image_url ?? g.event.image_url;
            return (
              <div
                key={g.event.event_id}
                className="snap-start shrink-0 relative flex flex-col items-center gap-1.5 group"
              >
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeEntireHighlight(g.event.event_id)}
                    className="absolute -top-0.5 right-0 z-10 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground"
                    aria-label="Remove highlight"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { haptic("light"); setOpenIdx(i); }}
                  className="flex flex-col items-center gap-1.5"
                  aria-label={`Open highlights from ${g.event.name}`}
                >
                  <span className="relative inline-block p-[2px] rounded-full bg-gradient-to-tr from-primary via-accent to-primary group-active:scale-95 transition-transform">
                    <span className="block bg-background p-[2px] rounded-full">
                      <span
                        className="block h-16 w-16 rounded-full bg-secondary bg-cover bg-center"
                        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                      />
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium max-w-[72px] truncate text-center">
                    {g.event.name}
                  </span>
                  {g.event.date && (
                    <span className="text-[9px] text-muted-foreground/60 -mt-1">
                      {format(parseISO(g.event.date), "MMM d")}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          {/* End spacer so the last ring can fully scroll into view */}
          <div aria-hidden="true" className="shrink-0 w-2" />
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm max-h-[82dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick highlights</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pb-2">
            {events.map((event) => (
              <section key={event.event_id}>
                <div className="mb-2">
                  <p className="text-sm font-semibold truncate">{event.name}</p>
                  {event.date && <p className="text-xs text-muted-foreground">{format(parseISO(event.date), "MMM d")}</p>}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {event.photos.map((photo) => {
                    const selected = draft[event.event_id]?.has(photo.id) ?? false;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => togglePhoto(event.event_id, photo.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden bg-secondary border transition-all active:scale-95 ${
                          selected ? "border-primary ring-2 ring-primary/60" : "border-border"
                        }`}
                        aria-pressed={selected}
                        aria-label={`Toggle photo from ${event.name}`}
                      >
                        <BlurImage src={photo.image_url} alt="" className="h-full w-full" />
                        {selected && (
                          <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <div className="sticky bottom-0 bg-background pt-3 -mx-6 px-6 pb-1 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPickerOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveDraft} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {openIdx !== null && (() => {
        const g = highlightGroups[openIdx];
        if (!g) return null;
        return (
          <CapsuleGallery
            open
            photos={g.photos}
            startIndex={0}
            onClose={() => setOpenIdx(null)}
          />
        );
      })()}
    </>
  );
};

export default ProfileHighlights;
