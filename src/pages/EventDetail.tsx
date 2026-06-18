import { useState, useRef, useCallback, useEffect } from "react";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendIds } from "@/hooks/useFriendIds";
import { useFeedFilters } from "@/hooks/useFeedFilters";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/StatusBadge";
import { linkifyText } from "@/lib/linkify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar, MapPin, HelpCircle, Check, Clock, ExternalLink, MessageCircle, Send, Camera, Trash2, Image as ImageIcon, Smile, Edit2, Save, X, LogOut, Upload, Download, UserPlus, Share2, Users } from "lucide-react";
import InvitePeopleSheet from "@/components/InvitePeopleSheet";
import SuggestGuestSheet from "@/components/SuggestGuestSheet";
import RequestCohostSheet from "@/components/RequestCohostSheet";
import CoCreatorsSheet from "@/components/CoCreatorsSheet";
import EventLogisticsCard from "@/components/EventLogisticsCard";
import EventTabSection from "@/components/EventTabSection";
import IOSDateTimePicker from "@/components/IOSDateTimePicker";
import EmojiCoverPicker, { COVER_COLORS, EmojiCover } from "@/components/EmojiCoverPicker";
import ImageCropper from "@/components/ImageCropper";
import { parseISO, isPast, differenceInHours, endOfDay } from "date-fns";
import { format } from "@/lib/dateFormat";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "@/lib/dateLocale";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useRsvpMutation } from "@/hooks/useEvents";
import { toSentenceCase } from "@/lib/utils";
import BringListSection from "@/components/BringListSection";
import { useBringItems, useAddBringItem, useDeleteBringItem } from "@/hooks/useBringItems";
import { Plus, X as XIcon, Receipt } from "lucide-react";
import NightReceipt from "@/sheets/NightReceipt";
import EventScoreStrip from "@/components/EventScoreStrip";
import CreatorScoreBadge from "@/components/CreatorScoreBadge";
import PactSection from "@/components/PactSection";
import LiveRadarSection from "@/components/LiveRadarSection";
import { useUserHasExpenseAccess } from "@/hooks/useUserHasExpenseAccess";
import GhostKnockSection from "@/components/GhostKnockSection";
import EventPulseSection from "@/components/EventPulseSection";
import AttendeeLineCard from "@/components/AttendeeLineCard";
import { signCapsuleUrls } from "@/lib/capsuleUrls";
import { compressImage } from "@/lib/imageCompress";
import CapsuleMessageCard from "@/components/CapsuleMessageCard";
import BlurImage from "@/components/BlurImage";
import DeferredRender from "@/components/DeferredRender";
import LockedEventPreview, { type EventPreview } from "@/components/LockedEventPreview";

const LockedPreviewGate = ({ eventId, onClose, notFoundLabel }: { eventId: string; onClose: () => void; notFoundLabel: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["event-preview", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_preview", { _event_id: eventId });
      if (error) throw error;
      return (data as unknown as EventPreview) ?? null;
    },
    enabled: !!eventId,
  });
  if (isLoading) {
    return <AppLayout><div className="text-center py-20 text-muted-foreground">…</div></AppLayout>;
  }
  if (!data) {
    return <AppLayout><div className="text-center py-20 text-muted-foreground">{notFoundLabel}</div></AppLayout>;
  }
  return <LockedEventPreview preview={data} onClose={onClose} />;
};

const parseCoverMeta = (description: string | null) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};
const stripCoverMeta = (s: string | null) => (s ?? "").replace(/\[\[cover:[^\]]+\]\]\s*/g, "").trim();

// Immersive full-bleed cover. Same object-cover/object-center as the feed card,
// so the visual transition from feed → detail keeps the same center pixels.
// The inner image is taller than the container so the parallax shift never
// reveals an un-cropped edge.
const ParallaxCover = ({
  src,
  alt,
  emoji,
  color,
}: {
  src?: string;
  alt?: string;
  emoji?: string;
  color?: string;
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -60]);
  const scale = useTransform(scrollY, [-200, 0], [1.2, 1]);
  const [loaded, setLoaded] = useState(!src);
  return (
    <div
      className="relative w-screen left-1/2 -translate-x-1/2 h-[42vh] max-h-[360px] min-h-[280px] overflow-hidden bg-muted/30"
      style={emoji ? { background: `hsl(${color})` } : undefined}
    >
      {!loaded && src && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/50 to-muted/20" aria-hidden="true" />
      )}
      {src ? (
        <motion.img
          src={src}
          alt={alt}
          style={{ y, scale }}
          onLoad={() => setLoaded(true)}
          loading="eager"
          // @ts-expect-error fetchpriority valid HTML
          fetchpriority="high"
          decoding="async"
          className="absolute inset-x-0 top-0 w-full h-[120%] object-cover object-center will-change-transform"
        />
      ) : (
        <motion.div
          style={{ y, scale }}
          className="absolute inset-0 flex items-center justify-center overflow-hidden will-change-transform px-6"
        >
          <span className="text-[7rem] leading-none drop-shadow-md whitespace-nowrap tracking-tight text-center">
            {emoji}
          </span>
        </motion.div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
    </div>
  );
};

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: friendIds = [] } = useFriendIds();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const backTo = (routerLocation.state as any)?.from === "city-pulse"
    ? () => navigate("/discover")
    : () => navigate(-1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const haptic = useHaptics();
  const rsvp = useRsvpMutation();
  const { setChromeHidden } = useFeedFilters();
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Hide top header + bottom nav for the entire detail subpage.
  useEffect(() => {
    setChromeHidden(true);
    if (id && typeof window !== "undefined") {
      window.sessionStorage.setItem("iamin.lastEventId", id);
    }
    return () => setChromeHidden(false);
  }, [setChromeHidden, id]);

  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVibe, setEditVibe] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "circle" | "tentative" | "private">("circle");
  const [editCapacity, setEditCapacity] = useState<string>("");
  const [editTicketEnabled, setEditTicketEnabled] = useState(false);
  const [editTicketPrice, setEditTicketPrice] = useState<string>("");
  const [editTicketCurrency, setEditTicketCurrency] = useState<string>("EUR");
  const [editBringListEnabled, setEditBringListEnabled] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [suggestGuestOpen, setSuggestGuestOpen] = useState(false);
  const [cohostRequestOpen, setCohostRequestOpen] = useState(false);
  const [coCreatorsOpen, setCoCreatorsOpen] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Cover edit state (only used when isOwner && editing)
  const [editCoverMode, setEditCoverMode] = useState<"image" | "emoji">("image");
  const [editImageBlob, setEditImageBlob] = useState<Blob | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageRemoved, setEditImageRemoved] = useState(false);
  const [editEmojiCover, setEditEmojiCover] = useState<EmojiCover>({ emoji: "✨", color: COVER_COLORS[0].value });
  const [editCropSrc, setEditCropSrc] = useState<string | null>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  // @mentions state
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [pendingMentions, setPendingMentions] = useState<{ user_id: string; handle: string }[]>([]);
  const commentRef = useRef<HTMLInputElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const [closeDrag, setCloseDrag] = useState(0);
  const dragArmed = useRef(false);


  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();
      if (error) throw error;

      const [{ data: attendees }, { data: comments }, { data: photos }] = await Promise.all([
        supabase.from("attendees").select("*").eq("event_id", id!),
        supabase.from("comments").select("*").eq("event_id", id!).order("created_at", { ascending: true }),
        supabase.from("time_capsule_photos").select("*").eq("event_id", id!).order("created_at", { ascending: false }),
      ]);

      const userIds = [
        ...new Set([
          data.created_by,
          ...(attendees?.map((a) => a.user_id) ?? []),
          ...(comments?.map((c) => c.user_id) ?? []),
          ...(photos?.map((p) => p.user_id) ?? []),
        ]),
      ];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("*").in("user_id", userIds)
        : { data: [] };

      return {
        ...data,
        creator_profile: profiles?.find((p) => p.user_id === data.created_by) ?? null,
        attendees: (attendees ?? []).map((a) => ({
          ...a,
          profile: profiles?.find((p) => p.user_id === a.user_id) ?? null,
        })),
        comments: (comments ?? []).map((c) => ({
          ...c,
          profile: profiles?.find((p) => p.user_id === c.user_id) ?? null,
        })),
        photos: await signCapsuleUrls(
          (photos ?? []).map((p) => ({
            ...p,
            profile: profiles?.find((pr) => pr.user_id === p.user_id) ?? null,
          })),
          24 * 60 * 60,
          { width: 1200, quality: 78, resize: "contain" },
        ),
      };
    },
    enabled: !!id,
  });

  const isOwner = event?.created_by === user?.id;
  const myAttendance = event?.attendees?.find((a: any) => a.user_id === user?.id);
  const eventPassed = event?.date ? isPast(endOfDay(parseISO(event.date))) : false;
  const isGhost = event?.visibility === "tentative";
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const { data: hasTabAccess } = useUserHasExpenseAccess(id, isOwner);

  // Account type — only organizer ("commercial") accounts can publish public events
  const { data: myAccountType } = useQuery({
    queryKey: ["my-account-type", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("account_type").eq("user_id", user.id).maybeSingle();
      return (data as any)?.account_type ?? "person";
    },
    enabled: !!user && isOwner,
  });
  const canPickPublic = myAccountType === "organizer";

  // Determine if this user was invited (for private/list events)
  const { data: isInvitee } = useQuery({
    queryKey: ["is-invitee", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data } = await supabase
        .from("event_invites")
        .select("id")
        .eq("event_id", id)
        .eq("invitee_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id && !isOwner && event?.visibility === "private",
  });

  // Knock — gate non-owner from full event until revealed (ghost or list)
  const isList = event?.visibility === "private";
  const isKnockable = isGhost || isList;
  const { data: myKnock } = useQuery({
    queryKey: ["my-knock", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data } = await supabase
        .from("event_knocks")
        .select("id, status")
        .eq("event_id", id)
        .eq("knocker_id", user.id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!user && !!id && isKnockable && !isOwner,
  });
  const ghostLocked = isGhost && !isOwner && myKnock?.status !== "revealed";
  const listLocked =
    isList && !isOwner && !isInvitee && myKnock?.status !== "revealed";

  const handleStatus = (status: "interested" | "going") => {
    if (!user || !id) return;
    if (myAttendance?.status === status) {
      haptic("selection");
      rsvp.mutate({ kind: "delete", eventId: id });
    } else if (myAttendance) {
      if (status === "going") haptic("success"); else haptic("light");
      rsvp.mutate({ kind: "update", eventId: id, status });
    } else {
      if (status === "going") haptic("success"); else haptic("light");
      rsvp.mutate({ kind: "insert", eventId: id, status });
    }
  };

  const handleLeave = async () => {
    if (!user || !id || !myAttendance) return;
    await supabase.from("attendees").delete().eq("event_id", id).eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["event", id] });
    haptic("warning");
    toast({ title: "You left the event" });
  };

  const handleDelete = async () => {
    if (!isOwner || !id) return;
    await supabase.from("events").delete().eq("id", id);
    navigate("/");
    toast({ title: "Event deleted" });
  };

  const handleEdit = () => {
    if (!event) return;
    const cover = parseCoverMeta(event.description);
    setEditName(event.name);
    setEditDate(event.date ?? "");
    setEditTime(event.time ?? "");
    setEditLocation(event.location ?? "");
    setEditDescription(stripCoverMeta(event.description));
    setEditVibe(event.vibe_category ?? "");
    setEditVisibility((event.visibility as any) ?? "circle");
    setEditCapacity((event as any).capacity ? String((event as any).capacity) : "");
    const cents = (event as any).ticket_price_cents as number | null | undefined;
    setEditTicketEnabled(!!cents);
    setEditTicketPrice(cents ? (cents / 100).toString() : "");
    setEditTicketCurrency((event as any).ticket_currency ?? "EUR");
    setEditBringListEnabled(!!(event as any).bring_list_enabled);
    // Seed cover state from existing event
    if (event.image_url) {
      setEditCoverMode("image");
      setEditImagePreview(event.image_url);
    } else if (cover) {
      setEditCoverMode("emoji");
      setEditEmojiCover({ emoji: cover.emoji, color: cover.color });
    } else {
      setEditCoverMode("image");
      setEditImagePreview(null);
    }
    setEditImageBlob(null);
    setEditImageRemoved(false);
    setEditing(true);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setEditCropSrc(URL.createObjectURL(file));
  };

  const handleEditCropConfirm = (blob: Blob, previewUrl: string) => {
    setEditImageBlob(blob);
    setEditImagePreview(previewUrl);
    setEditImageRemoved(false);
    setEditCropSrc(null);
    setEditCoverMode("image");
  };

  const handleSaveEdit = async () => {
    if (!id || !user) return;
    let nextImageUrl: string | null | undefined = undefined; // undefined => leave unchanged

    try {
      if (editCoverMode === "image") {
        if (editImageBlob) {
          // New / re-cropped image — compress + upload
          const compressed = await compressImage(
            editImageBlob instanceof File ? editImageBlob : new File([editImageBlob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" }),
          );
          const filePath = `${user.id}/${Date.now()}-cover.jpg`;
          const { error: upErr } = await supabase.storage
            .from("event-images")
            .upload(filePath, compressed, { contentType: compressed.type || "image/jpeg" });
          if (upErr) throw upErr;
          const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(filePath);
          nextImageUrl = urlData.publicUrl;
        } else if (editImageRemoved) {
          nextImageUrl = null;
        }
        // else: keep existing image_url unchanged
      } else {
        // Emoji cover — clear image_url
        nextImageUrl = null;
      }

      // Build description: prefix emoji meta when in emoji mode
      const baseDesc = editDescription.trim();
      const finalDescription =
        editCoverMode === "emoji"
          ? `[[cover:${editEmojiCover.emoji}|${editEmojiCover.color}]] ${baseDesc}`.trim()
          : baseDesc || null;

      const safeVisibility = editVisibility;
      const isOrganizerEvent = myAccountType === "organizer" && safeVisibility === "public";
      const capNum = editCapacity ? Number(editCapacity) : null;
      const hasTicket = isOrganizerEvent && editTicketEnabled && !!editTicketPrice;
      const updatePayload: Record<string, unknown> = {
        name: toSentenceCase(editName),
        date: editDate || null,
        time: editTime || null,
        location: editLocation || null,
        description: finalDescription,
        vibe_category: editVibe.trim() || null,
        visibility: safeVisibility,
        capacity: isOrganizerEvent && Number.isFinite(capNum as number) ? capNum : null,
        ticket_price_cents: hasTicket ? Math.round(Number(editTicketPrice) * 100) : null,
        // ticket_currency is NOT NULL in the DB — always send a valid value.
        ticket_currency: hasTicket ? editTicketCurrency : (editTicketCurrency || "EUR"),
        bring_list_enabled: isOrganizerEvent ? false : editBringListEnabled,
        ...(nextImageUrl !== undefined ? { image_url: nextImageUrl } : {}),
      };

      const { error } = await supabase.from("events").update(updatePayload as any).eq("id", id);
      if (error) throw error;

      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      toast({ title: "Event updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // @mention search
  const handleCommentChange = useCallback(async (value: string) => {
    setComment(value);
    const lastAt = value.lastIndexOf("@");
    if (lastAt >= 0) {
      const afterAt = value.slice(lastAt + 1);
      if (afterAt.length > 0 && !afterAt.includes(" ")) {
        setMentionSearch(afterAt);
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .or(`display_name.ilike.%${afterAt}%,username.ilike.%${afterAt}%`)
          .limit(5);
        setMentionResults(data ?? []);
        return;
      }
    }
    setMentionSearch(null);
    setMentionResults([]);
  }, []);

  const insertMention = (profile: any) => {
    const lastAt = comment.lastIndexOf("@");
    const name = profile.username || profile.display_name || "user";
    setComment(comment.slice(0, lastAt) + `@${name} `);
    setPendingMentions((prev) => [...prev, { user_id: profile.user_id, handle: name }]);
    setMentionSearch(null);
    setMentionResults([]);
    commentRef.current?.focus();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !comment.trim()) return;
    setCommentLoading(true);
    const content = comment.trim();
    const { data: insertedComment, error } = await supabase
      .from("comments")
      .insert({ event_id: id, user_id: user.id, content })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Parse @mentions and create notifications
      const recipientIds = new Set<string>();

      // 1. Resolved mentions from suggestion picks (only if handle still appears)
      pendingMentions.forEach((m) => {
        if (content.toLowerCase().includes(`@${m.handle.toLowerCase()}`) && m.user_id !== user.id) {
          recipientIds.add(m.user_id);
        }
      });

      // 2. Fallback regex for manually-typed mentions (Unicode + multi-word, case-insensitive)
      const mentionRegex = /@([\p{L}\p{N}_.\-]+(?:\s[\p{L}\p{N}_.\-]+){0,2})/gu;
      const candidates = Array.from(content.matchAll(mentionRegex)).flatMap((m) => {
        const phrase = m[1];
        const first = phrase.split(/\s+/)[0];
        return phrase === first ? [phrase] : [phrase, first];
      });

      if (candidates.length > 0) {
        const orFilter = candidates
          .flatMap((c) => [`username.ilike.${c}`, `display_name.ilike.${c}`])
          .join(",");
        const { data: mentionedProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .or(orFilter);
        (mentionedProfiles ?? []).forEach((p) => {
          if (p.user_id !== user.id) recipientIds.add(p.user_id);
        });
      }

      if (recipientIds.size > 0) {
        await supabase.from("notifications").insert(
          Array.from(recipientIds).map((rid) => ({
            recipient_id: rid,
            sender_id: user.id,
            type: "mention",
            event_id: id,
            comment_id: insertedComment?.id ?? null,
            content: `You were mentioned in a comment on "${event?.name ?? "an event"}"`,
          }))
        );
        toast({ title: `Notified ${recipientIds.size} ${recipientIds.size === 1 ? "person" : "people"}` });
      }
      setComment("");
      setPendingMentions([]);
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["event", id] });
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!user || !id || !files) return;
    setPhotoLoading(true);
    try {
      for (const rawFile of Array.from(files)) {
        const file = rawFile.type.startsWith("image/") ? await compressImage(rawFile) : rawFile;
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("time-capsule").upload(filePath, file, { contentType: file.type || undefined });
        if (uploadError) throw uploadError;
        await supabase.from("time_capsule_photos").insert({
          event_id: id, user_id: user.id, image_url: filePath,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      toast({ title: "Photos added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPhotoLoading(false);
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

  const getGoogleMapsUrl = (location: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  const buildShareMessage = () => {
    if (!event) return { title: "", text: "", url: "" };
    // Share the in-app event URL directly so the link opens the event page,
    // not the backend share function HTML.
    const url = `${window.location.origin}/event/${event.id}`;
    const name = event.name;
    const dateStr = event.date ? format(parseISO(event.date), "EEE, MMM d", { locale: dateLocale }) : null;
    const timeStr = event.time ? event.time.slice(0, 5) : null;
    const where = event.location || event.city;

    const openers = [
      `Yo! You HAVE to come to ${name} with me 🔥`,
      `Okay hear me out — ${name} is going to be unreal ✨`,
      `Drop everything, we're going to ${name} 🎉`,
      `I just found our next plan: ${name} 👀`,
    ];
    const opener = openers[Math.floor(Math.random() * openers.length)];

    const bits: string[] = [opener];
    if (dateStr || timeStr) bits.push(`📅 ${[dateStr, timeStr].filter(Boolean).join(" • ")}`);
    if (where) bits.push(`📍 ${where}`);
    if (event.vibe_category) bits.push(`✨ Vibe: ${event.vibe_category}`);
    bits.push("Tap in 👉");

    return { title: name, text: bits.join("\n"), url };
  };

  const handleShare = async () => {
    const { title, text, url } = buildShareMessage();
    haptic("light");
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Link copied!", description: "Share it with your friends." });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast({ title: "Couldn't share", description: err.message, variant: "destructive" });
      }
    }
  };

  const getRotation = (index: number) => {
    const rotations = [-3, 2, -1, 3, -2, 1];
    return rotations[index % rotations.length];
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </AppLayout>
    );
  }
  if (!event) {
    return <LockedPreviewGate eventId={id!} onClose={backTo} notFoundLabel={t("events.not_found")} />;
  }

  const goingUsers = event.attendees?.filter((a: any) => a.status === "going") ?? [];
  const interestedUsers = event.attendees?.filter((a: any) => a.status === "interested") ?? [];

  // Swipe-down-to-close: only arms when the gesture starts in the top region
  // AND the page is already scrolled to the very top. We translate the page
  // via CSS only (no preventDefault) so normal scrolling stays untouched.
  const CLOSE_THRESHOLD = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const atTop =
      (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    dragArmed.current = atTop && t.clientY < 320;
    touchStartY.current = t.clientY;
    touchStartTime.current = Date.now();
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragArmed.current || touchStartY.current == null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      // Lighter resistance — feels responsive without much force
      const next = Math.min(220, dy * 0.85);
      // Peek haptic when crossing arming threshold
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
      backTo();
      return;
    }
    dragArmed.current = false;
    setCloseDrag(0);
    touchStartY.current = null;
  };

  // Ghost-locked: non-owner who hasn't been revealed sees only the knock prompt.
  if (ghostLocked || listLocked) {
    return (
      <AppLayout>
        <div
          className="max-w-2xl mx-auto space-y-6 relative px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="sticky top-3 z-30 ml-auto flex items-center gap-2 w-fit">
            <button
              onClick={backTo}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-md border border-border/50 hover:bg-secondary text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="rounded-2xl card-surface p-8 text-center space-y-3">
            <div className="text-5xl">{listLocked ? "🔒" : "👻"}</div>
            <h2 className="text-lg font-bold">
              {listLocked ? "Invite-only event" : "Ghost event"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {myKnock?.status === "pending" && (listLocked ? "Request sent — waiting for the host." : "Knock sent — waiting for the host to reveal.")}
              {myKnock?.status === "ignored" && (listLocked ? "The host didn't add you to the list." : "The host didn't reveal this event.")}
              {!myKnock && (listLocked ? "Ask the host to add you to the list." : "Knock to ask the host to reveal what this is.")}
            </p>
          </div>
          {id && <GhostKnockSection eventId={id} isOwner={false} visibility={listLocked ? "private" : "tentative"} />}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div
        className="max-w-2xl mx-auto relative"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
          touchAction: "pan-y",
          overscrollBehaviorY: "contain",
          transform: closeDrag > 0 ? `translateY(${closeDrag}px)` : undefined,
          transition: closeDrag > 0 ? "none" : "transform 220ms cubic-bezier(0.2,0.8,0.2,1)",
          opacity: closeDrag > 0 ? Math.max(0.7, 1 - closeDrag / 400) : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Top action bar: Share + Close — sits above the hero, just below the
            phone safe area so it never overlaps the iOS clock / battery. */}
        <div
          className="absolute right-3 z-30 flex items-center gap-2"
          style={{ top: editing ? "calc(env(safe-area-inset-top) + 12px)" : "calc(env(safe-area-inset-top) + 50px)" }}
        >
          {!editing && event && (
            <button
              onClick={handleShare}
              aria-label="Share event"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 backdrop-blur-xl border border-primary/30 hover:bg-primary/35 text-white shadow-[0_0_18px_-2px_rgba(124,58,237,0.55)] transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={backTo}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 backdrop-blur-xl border border-primary/30 hover:bg-primary/35 text-white shadow-[0_0_18px_-2px_rgba(124,58,237,0.55)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!editing && (() => {
          // Hero stays flush at the viewport top. Drop the previous negative
          // bottom margin so the vibe pill + title sit clearly below the image
          // instead of being pulled up behind its bottom fade.
          if (event.image_url) {
            return <ParallaxCover src={event.image_url} alt={event.name} />;
          }
          const cover = parseCoverMeta(event.description);
          if (cover) {
            return <ParallaxCover emoji={cover.emoji} color={cover.color} />;
          }
          return null;
        })()}

        <div
          className="space-y-4"
          style={editing ? { paddingTop: "calc(env(safe-area-inset-top) + 64px)" } : undefined}
        >
          {editing ? (
            <div className="space-y-3">
              {/* Cover edit — image (with crop) or emoji */}
              <div className="rounded-xl border border-border p-3 space-y-3 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{t("events.cover")}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("events.image_or_emoji")}</span>
                </div>
                <Tabs value={editCoverMode} onValueChange={(v) => setEditCoverMode(v as "image" | "emoji")}>
                  <TabsList className="grid grid-cols-2 w-full h-8">
                    <TabsTrigger value="image" className="gap-1.5 text-xs">
                      <ImageIcon className="h-3.5 w-3.5" /> Image
                    </TabsTrigger>
                    <TabsTrigger value="emoji" className="gap-1.5 text-xs">
                      <Smile className="h-3.5 w-3.5" /> Emoji
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="image" className="mt-3">
                    {editImagePreview && !editImageRemoved ? (
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={editImagePreview} alt="Preview" className="w-full h-[180px] object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <Button
                            type="button"
                            size="icon" variant="ghost"
                            className="h-7 w-7 bg-black/50 rounded-full text-white hover:bg-black/70"
                            onClick={() => editImagePreview && setEditCropSrc(editImagePreview)}
                            title="Crop image"
                          >
                            <Camera className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon" variant="ghost"
                            className="h-7 w-7 bg-black/50 rounded-full text-white hover:bg-black/70"
                            onClick={() => { setEditImageBlob(null); setEditImagePreview(null); setEditImageRemoved(true); }}
                            title="Remove image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => editCoverInputRef.current?.click()}
                      >
                        <Camera className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Add & crop event image</p>
                      </div>
                    )}
                    <input
                      ref={editCoverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="hidden"
                    />
                  </TabsContent>

                  <TabsContent value="emoji" className="mt-3">
                    <EmojiCoverPicker value={editEmojiCover} onChange={setEditEmojiCover} />
                  </TabsContent>
                </Tabs>
              </div>

              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Event name" />
              <div className="grid grid-cols-2 gap-3">
                <IOSDateTimePicker mode="date" value={editDate} onChange={setEditDate} label="DATE" />
                <IOSDateTimePicker mode="time" value={editTime} onChange={setEditTime} label="TIME" />
              </div>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" />
              <Input
                placeholder="Vibe (music, party, festival, birthday, art, food, brunch, cinema, sports, street markets)"
                value={editVibe}
                onChange={(e) => setEditVibe(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "music", emoji: "🎵" },
                  { label: "party", emoji: "🎉" },
                  { label: "festival", emoji: "🎪" },
                  { label: "birthday", emoji: "🎂" },
                  { label: "art", emoji: "🎨" },
                  { label: "food", emoji: "🍽️" },
                  { label: "brunch", emoji: "🥂" },
                  { label: "cinema", emoji: "🎬" },
                  { label: "sports", emoji: "⚡" },
                  { label: "street markets", emoji: "🛍️" },
                ].map((v) => {
                  const active = editVibe.toLowerCase() === v.label;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setEditVibe(active ? "" : v.label)}
                      className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors border ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary hover:bg-primary/20 border-border"
                      }`}
                    >
                      {v.emoji} {v.label}
                    </button>
                  );
                })}
              </div>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" rows={3} />
              {/* Privacy — non-organizer accounts cannot pick Public */}
              <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("events.privacy")}</span>
                {(() => {
                  const opts = [
                    { v: "circle", label: "Circle" },
                    { v: "private", label: "List" },
                    { v: "tentative", label: "Ghost" },
                    ...(myAccountType === "organizer" ? [{ v: "public" as const, label: "Open" }] : []),
                  ] as const;
                  return (
                    <div className={`grid ${opts.length === 4 ? "grid-cols-4" : "grid-cols-3"} gap-2`}>
                      {opts.map(({ v, label }) => {
                        const active = editVisibility === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setEditVisibility(v as any)}
                            className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all ${
                              active
                                ? "bg-primary text-primary-foreground glow-sm"
                                : "bg-card text-foreground border border-border hover:border-primary/40"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Capacity + Tickets — organizer-only and only for Open (public) events */}
              {myAccountType === "organizer" && editVisibility === "public" && (
                <div className="rounded-xl bg-secondary/40 p-3 space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Capacity (optional)</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder="e.g. 80"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("events.sell_tickets")}</span>
                    <Switch checked={editTicketEnabled} onCheckedChange={setEditTicketEnabled} />
                  </div>
                  {editTicketEnabled && (
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <select
                        value={editTicketCurrency}
                        onChange={(e) => setEditTicketCurrency(e.target.value)}
                        className="h-10 rounded-md bg-background border border-input px-2 text-sm"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="Price per ticket"
                        value={editTicketPrice}
                        onChange={(e) => setEditTicketPrice(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Bring-what? list — available for personal-style events (circle / list / ghost) */}
              {editVisibility !== "public" && (
                <div className="rounded-xl bg-secondary/40 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold">"Bring what?" list</span>
                      <p className="text-[10px] text-muted-foreground leading-tight">Let attendees claim items to bring (snacks, speaker, ball…)</p>
                    </div>
                    <Switch checked={editBringListEnabled} onCheckedChange={setEditBringListEnabled} />
                  </div>
                  {editBringListEnabled && id && (
                    <EditBringItems eventId={id} />
                  )}
                </div>
              )}



              <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("events.people")}</span>
                <div className="grid grid-cols-2 gap-2">
                  {editVisibility !== "public" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Invite friends
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => setCoCreatorsOpen(true)}>
                    <Users className="h-3.5 w-3.5 mr-1.5" /> Co-creators
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Vibe pill row — pill on the left, owner actions on the right */}
              <div className="flex items-center justify-between gap-3">
                {event.vibe_category ? (
                  <span className="inline-block w-fit px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-[11px] font-semibold tracking-[0.15em] uppercase backdrop-blur-xl">
                    {event.vibe_category}
                  </span>
                ) : <span />}
                {isOwner && (
                  <div className="flex items-center gap-1 shrink-0 -mr-1">
                    {event.visibility !== "public" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-primary"
                        onClick={() => setInviteOpen(true)}
                        aria-label="Invite people"
                        title="Invite people"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEdit} aria-label="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1
                className="text-[34px] leading-[1.05] font-bold tracking-tight"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                {toSentenceCase(event.name)}
              </h1>

              {eventPassed && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 w-fit">
                  Past Event
                </Badge>
              )}

              {/* Unified When / Where / Weather card */}
              <EventLogisticsCard
                name={event.name}
                date={event.date}
                endDate={(event as any).end_date}
                time={event.time}
                location={event.location}
                city={event.city}
                lat={(event as any).lat}
                lng={(event as any).lng}
                description={event.description}
              />

              {/* Organizer card — glass, with score + friends going */}
              {(() => {
                const creator = (event as any).creator_profile;
                const friendsGoingCount = goingUsers.filter((a: any) => friendIds.includes(a.user_id)).length;
                if (!creator) return null;
                return (
                  <div className="flex items-center justify-between p-4 rounded-2xl card-surface dark:bg-white/[0.04] dark:border-white/10 dark:backdrop-blur-md">
                    <Link
                      to={`/profile/${event.created_by}`}
                      aria-label={`Open ${creator.display_name ?? "creator"}'s profile`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <Avatar className="h-11 w-11 ring-1 ring-white/15 shrink-0">
                        <AvatarImage src={creator.avatar_url ?? undefined} />
                        <AvatarFallback className="text-sm" {...avatarFallbackProps(creator.display_name ?? event.created_by)}>
                          {creator.display_name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold truncate">{creator.display_name ?? "Someone"}</span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wider">Host</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <CreatorScoreBadge userId={event.created_by} />
                          {friendsGoingCount > 0 && (
                            <span className="text-[11px] text-primary font-semibold">
                              · {friendsGoingCount} {friendsGoingCount === 1 ? "friend" : "friends"} going
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })()}

              {event.source_url && /^https?:\/\//i.test(event.source_url) && (
                <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> View original
                </a>
              )}

              {/* Description */}
              {(() => {
                const desc = stripCoverMeta(event.description);
                if (!desc) return null;
                return (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Description</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{desc}</p>
                  </div>
                );
              })()}
            </>
          )}

          {/* RSVP — segmented pill with glowing primary */}
          {!eventPassed && (
            <div className="card-surface dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/10 rounded-full p-1.5 flex items-center shadow-sm dark:shadow-2xl">
              <button
                type="button"
                onClick={() => handleStatus("interested")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all active:scale-95 text-sm font-medium ${
                  myAttendance?.status === "interested"
                    ? "bg-primary/20 text-primary"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                Maybe ({interestedUsers.length})
              </button>
              <button
                type="button"
                onClick={() => handleStatus("going")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all active:scale-95 text-sm font-bold ${
                  myAttendance?.status === "going"
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(124,58,237,0.45)]"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Check className="h-4 w-4" />
                I am in ({goingUsers.length})
              </button>
            </div>
          )}
          {/* Creator opt-out — removed: unchecking "I am in" already removes
              the RSVP, so the explanatory sentence is unnecessary. */}

          {/* Ticket — perforated card */}
          {!eventPassed && (event as any).ticket_price_cents > 0 && (
            <div className="relative bg-gradient-to-br from-primary/15 to-card border border-primary/30 rounded-2xl p-5 overflow-hidden">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-r border-primary/30" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-l border-primary/30" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.15em]">{t("events.ticket")}</p>
                  <p className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: (event as any).ticket_currency ?? "EUR",
                    }).format(((event as any).ticket_price_cents ?? 0) / 100)}
                  </p>
                  {(event as any).capacity && (
                    <p className="text-[11px] text-muted-foreground">
                      {Math.max(0, (event as any).capacity - goingUsers.length)} of {(event as any).capacity} left
                    </p>
                  )}
                </div>
                {!isOwner && (
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(124,58,237,0.4)] shrink-0 rounded-xl"
                    onClick={() => {
                      haptic("light");
                      if (event.source_url && /^https?:\/\//i.test(event.source_url)) {
                        window.open(event.source_url, "_blank", "noopener,noreferrer");
                      } else {
                        toast({
                          title: "Checkout coming soon",
                          description: "Card payments are being set up for this organizer.",
                        });
                      }
                    }}
                  >
                    Get tickets
                  </Button>
                )}
              </div>
            </div>
          )}
          {/* Non-host collaboration — only available to friends of the host on
              circle-visibility events. */}
          {!isOwner &&
            user &&
            !eventPassed &&
            event.visibility === "circle" &&
            friendIds.includes(event.created_by) && (
            <div className="flex justify-around px-2 text-[11px] font-medium text-foreground/40 uppercase tracking-widest">
              <button
                type="button"
                onClick={() => { haptic("light"); setSuggestGuestOpen(true); }}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Suggest a guest
              </button>
              <span aria-hidden className="w-px h-3 bg-white/10 self-center" />
              <button
                type="button"
                onClick={() => { haptic("light"); setCohostRequestOpen(true); }}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                Help organize
              </button>
            </div>
          )}

          {/* Attendees widget */}
          {(goingUsers.length > 0 || interestedUsers.length > 0) && (
            <div className="tactile-widget p-4 space-y-4">
              {goingUsers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                    {eventPassed ? "Went" : "Going"} ({goingUsers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {goingUsers.map((a: any) => (
                      <Link
                        key={a.id}
                        to={`/profile/${a.user_id}`}
                        aria-label={`Open ${a.profile?.display_name ?? "user"}'s profile`}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-1 pr-3 py-1 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]" {...avatarFallbackProps(a.profile?.display_name ?? a.user_id)}>{a.profile?.display_name?.[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <StatusBadge userId={a.user_id} />
                        </div>
                        <span className="text-xs font-medium">{a.profile?.display_name ?? "User"}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {!eventPassed && interestedUsers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                    {t("events.maybe_heading")} ({interestedUsers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {interestedUsers.map((a: any) => (
                      <Link
                        key={a.id}
                        to={`/profile/${a.user_id}`}
                        aria-label={`Open ${a.profile?.display_name ?? "user"}'s profile`}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-1 pr-3 py-1 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]" {...avatarFallbackProps(a.profile?.display_name ?? a.user_id)}>{a.profile?.display_name?.[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <StatusBadge userId={a.user_id} />
                        </div>
                        <span className="text-xs font-medium">{a.profile?.display_name ?? "User"}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past-event: Vibe check (score) + Time Capsule rendered right after attendees */}
          {eventPassed && id && <EventScoreStrip eventId={id} />}
          {eventPassed && id && (
            <Card className="tactile-widget">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-accent" />
                  {t("receipt.widget_title", { defaultValue: "Morning-after receipt" })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass gap-1.5"
                  onClick={() => setReceiptOpen(true)}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Open receipt
                </Button>
              </CardContent>
            </Card>
          )}
          {eventPassed && (
            <Card className="tactile-widget">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5 text-accent" />
                  Time Capsule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass"
                    onClick={() => photoRef.current?.click()}
                    disabled={photoLoading}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {photoLoading ? "Uploading..." : "Add Photos"}
                  </Button>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                </div>
                {event.photos && event.photos.length > 0 ? (
                  <div className="relative flex flex-wrap gap-2 justify-center py-2">
                    {event.photos.map((photo: any, idx: number) => (
                      <button
                        key={photo.id}
                        onClick={() => setLightboxUrl(photo.image_url)}
                        className="relative w-24 h-24 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 hover:z-10"
                        style={{
                          transform: `rotate(${getRotation(idx)}deg)`,
                          marginTop: idx % 2 === 0 ? 0 : 8,
                        }}
                      >
                        <BlurImage src={photo.image_url} alt="" className="w-full h-full" rounded="rounded-lg" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">{t("events.no_photos_share")}</p>
                )}
                {/* Sealed capsule messages — revealed once the event has ended */}
                {id && (
                  <div className="pt-2">
                    <CapsuleMessageCard eventId={id} eventEnded canCompose={false} vibeCategory={event.vibe_category} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ghost / List knocks — only when user isn't already in (skip if owner/attendee/invitee) */}
          {id && (event.visibility === "tentative" || event.visibility === "private") && !myAttendance && !isInvitee && (
            <GhostKnockSection eventId={id} isOwner={isOwner} visibility={event.visibility} />
          )}


          {/* Weather is now in the unified EventLogisticsCard above */}

          {/* Comments — moved here: right after weather forecast; never on ghost events */}
          {!isGhost && (
          <div className="tactile-widget p-4 space-y-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                Comments ({event.comments?.length ?? 0})
              </h4>
            </div>
              {(() => {
                const all = event.comments ?? [];
                const visible = commentsExpanded ? all : all.slice(0, 3);
                return (
                  <>
                    {visible.map((c: any) => (
                      <div key={c.id} className="flex gap-3 animate-fade-in">
                        <Link to={`/profile/${c.user_id}`} aria-label={`Open ${c.profile?.display_name ?? "user"}'s profile`} className="shrink-0">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={c.profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs" {...avatarFallbackProps(c.profile?.display_name ?? c.user_id)}>{c.profile?.display_name?.[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link to={`/profile/${c.user_id}`} className="text-sm font-medium hover:underline">{c.profile?.display_name ?? "User"}</Link>
                            <span className="text-xs text-muted-foreground">{format(parseISO(c.created_at), "MMM d, h:mm a", { locale: dateLocale })}</span>
                            {c.user_id === user?.id && (
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteComment(c.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {c.content.split(/(@[\p{L}\p{N}_.\-]+(?:\s[\p{L}\p{N}_.\-]+){0,2})/gu).map((part: string, i: number) =>
                              part.startsWith("@") ? (
                                <span key={i} className="text-primary font-medium">{part}</span>
                              ) : (
                                <span key={i}>{linkifyText(part)}</span>
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    {all.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setCommentsExpanded((v) => !v)}
                      >
                        {commentsExpanded ? "Show less" : `Show more (${all.length - 3})`}
                      </Button>
                    )}
                  </>
                );
              })()}

              {/* Comment input with @mentions */}
              <div className="relative">
                {mentionSearch !== null && mentionResults.length > 0 && (
                  <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                    {mentionResults.map((p) => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                        onClick={() => insertMention(p)}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={p.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px]" {...avatarFallbackProps(p.display_name ?? p.user_id)}>{p.display_name?.[0] ?? "?"}</AvatarFallback>
                        </Avatar>
                        <span>{p.display_name ?? p.username ?? "User"}</span>
                        {p.username && <span className="text-muted-foreground">@{p.username}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleComment} className="relative">
                  <Input
                    ref={commentRef}
                    placeholder="Write a comment... (use @ to mention)"
                    value={comment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    className="w-full bg-foreground/5 dark:bg-black/40 border-foreground/10 dark:border-white/10 rounded-full py-3 pl-4 pr-11 text-sm focus-visible:ring-1 focus-visible:ring-primary/60 placeholder:text-foreground/40"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !comment.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 shadow-[0_0_14px_rgba(124,58,237,0.4)] disabled:opacity-40 disabled:shadow-none transition-all"
                    aria-label="Send"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
          </div>
          )}

          {/* Live Radar — share location */}
          {!eventPassed && id && (
            <DeferredRender minHeight={200}>
              <LiveRadarSection
                eventId={id}
                eventDate={event.date}
                eventTime={event.time}
                isAttending={!!myAttendance || isOwner}
                attendees={[
                  ...(isOwner && !event.attendees?.some((a: any) => a.user_id === user?.id)
                    ? [{ user_id: user!.id, display_name: "Me", avatar_url: null }]
                    : []),
                  ...(event.attendees ?? []).map((a: any) => ({
                    user_id: a.user_id,
                    display_name: a.profile?.display_name ?? null,
                    avatar_url: a.profile?.avatar_url ?? null,
                  })),
                ]}
                venueLat={event.lat ?? null}
                venueLng={event.lng ?? null}
                venueName={event.location ?? event.name}
              />
            </DeferredRender>
          )}

          {/* Capsule message — moved here: right after Live Radar */}
          {!eventPassed && id && (!!myAttendance || isOwner) && (
            <DeferredRender minHeight={140}>
              <CapsuleMessageCard eventId={id} eventEnded={false} canCompose vibeCategory={event.vibe_category} />
            </DeferredRender>
          )}

          {/* 4. Bring what — only when the creator originally enabled it (no later toggle), and never on ghost events */}
          {!eventPassed && !isGhost && id && event.bring_list_enabled && (
            <DeferredRender minHeight={200}>
              <BringListSection
                eventId={id}
                isOwner={isOwner}
                vibeCategory={event.vibe_category}
                attendees={[
                  ...(isOwner && !event.attendees?.some((a: any) => a.user_id === user?.id)
                    ? [{ user_id: user!.id, display_name: "Me", avatar_url: null }]
                    : []),
                  ...(event.attendees ?? []).map((a: any) => ({
                    user_id: a.user_id,
                    display_name: a.profile?.display_name ?? null,
                    avatar_url: a.profile?.avatar_url ?? null,
                  })),
                ]}
              />
            </DeferredRender>
          )}

          {/* 5. Pact — mutual-friends only, never on ghost or past events */}
          {!eventPassed && !isGhost && id && user && (
            <DeferredRender minHeight={160}>
              <PactSection eventId={id} eventName={event.name} />
            </DeferredRender>
          )}

          {/* Line — attendee-driven, auto-open during the event's day window */}
          {id && (
            <DeferredRender minHeight={140}>
              <AttendeeLineCard
                eventId={id}
                eventDate={event.date}
                eventEndDate={(event as any).end_date}
                eventTime={event.time}
                vibeCategory={event.vibe_category}
                isAttendee={!!myAttendance || isOwner}
                eligible={event.visibility === "public" && (event as any).creator_profile?.account_type === "organizer"}
              />
            </DeferredRender>
          )}

          {/* "Are we actually doing this?" pulse — appears in the 48h pre-event */}
          {!eventPassed && !isGhost && id && (
            <DeferredRender minHeight={140}>
              <EventPulseSection
                eventId={id}
                eventDate={event.date}
                eventTime={event.time}
                isAttending={!!myAttendance || isOwner}
                isOwner={isOwner}
                goingCount={(event.attendees ?? []).filter((a: any) => a.status === "going").length}
              />
            </DeferredRender>
          )}

          {/* Group Tab — always available for every non-ghost event */}
          {!isGhost && (
            <DeferredRender minHeight={200}>
              <EventTabSection
                eventId={id!}
                eventName={event.name}
                isOwner={isOwner}
                attendees={[
                  ...(isOwner && !event.attendees?.some((a: any) => a.user_id === user?.id)
                    ? [{ user_id: user!.id, display_name: "Me", avatar_url: null }]
                    : []),
                  ...(event.attendees ?? []).map((a: any) => ({
                    user_id: a.user_id,
                    display_name: a.profile?.display_name ?? null,
                    avatar_url: a.profile?.avatar_url ?? null,
                  })),
                ]}
              />
            </DeferredRender>
          )}





        </div>
      </div>

      {/* Cover image cropper */}
      {editCropSrc && (
        <ImageCropper
          open={!!editCropSrc}
          src={editCropSrc}
          onCancel={() => setEditCropSrc(null)}
          onConfirm={handleEditCropConfirm}
        />
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="" className="max-w-full max-h-[90vh] rounded-xl object-contain" />
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md"
                onClick={() => handleDownload(lightboxUrl)}
              >
                <Download className="h-4 w-4 text-white" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md"
                onClick={() => setLightboxUrl(null)}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {id && (
        <>
          <InvitePeopleSheet open={inviteOpen} onOpenChange={setInviteOpen} eventId={id} />
          <CoCreatorsSheet open={coCreatorsOpen} onOpenChange={setCoCreatorsOpen} eventId={id} />
          <SuggestGuestSheet open={suggestGuestOpen} onOpenChange={setSuggestGuestOpen} eventId={id} />
          <RequestCohostSheet open={cohostRequestOpen} onOpenChange={setCohostRequestOpen} eventId={id} />
          {id && <NightReceipt eventId={id} open={receiptOpen} onOpenChange={setReceiptOpen} />}
        </>
      )}
    </AppLayout>
  );
};

const EditBringItems = ({ eventId }: { eventId: string }) => {
  const { data: items = [] } = useBringItems(eventId);
  const addItem = useAddBringItem();
  const delItem = useDeleteBringItem();
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.some((i) => i.label.toLowerCase() === v.toLowerCase())) return;
    addItem.mutate({ eventId, label: v });
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add item (e.g. Speaker)"
          className="h-9 text-sm"
        />
        <Button type="button" size="sm" onClick={add} disabled={!draft.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => (
            <span key={it.id} className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1 text-[11px]">
              {it.label}
              <button type="button" onClick={() => delItem.mutate({ itemId: it.id, eventId })} className="text-muted-foreground hover:text-destructive">
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventDetail;
