import { useCallback, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendIds } from "@/hooks/useFriendIds";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SegmentedControl from "@/components/SegmentedControl";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Camera, Link as LinkIcon, Loader2, Sparkles, Upload, X, Eye, EyeOff, Lock, Users as UsersIcon,
  PenTool, Smile, ImageIcon, Users, AlertCircle, ClipboardPaste, Package, UserCheck,
  Calendar, Clock, MapPin, Tag, MessageSquare, Mic, FileText, Image as ImgIcon, Check, HelpCircle,
} from "lucide-react";
import EmojiCoverPicker, { COVER_COLORS, EmojiCover } from "@/components/EmojiCoverPicker";
import CoverStudio from "@/components/CoverStudio";
import ImageCropper from "@/components/ImageCropper";
import CityAutocomplete from "@/components/CityAutocomplete";
import IOSDateTimePicker from "@/components/IOSDateTimePicker";
import InviteFriendsInline from "@/components/InviteFriendsInline";
import BringListDraftEditor from "@/components/BringListDraftEditor";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toSentenceCase } from "@/lib/utils";
import { toFriendlyError } from "@/lib/errors";
import { compressImage } from "@/lib/imageCompress";

const VIBE_PERSON = [
  { label: "party", emoji: "🎉" },
  { label: "birthday", emoji: "🎂" },
  { label: "brunch", emoji: "🥂" },
  { label: "dinner", emoji: "🍽️" },
  { label: "drinks", emoji: "🍸" },
  { label: "concert", emoji: "🎵" },
  { label: "club", emoji: "🪩" },
  { label: "festival", emoji: "🎪" },
  { label: "cinema", emoji: "🎬" },
  { label: "day event", emoji: "☀️" },
];
const VIBE_ORGANIZER = [
  { label: "music", emoji: "🎵" },
  { label: "party", emoji: "🎉" },
  { label: "festival", emoji: "🎪" },
  { label: "art", emoji: "🎨" },
  { label: "food", emoji: "🍽️" },
  { label: "sports", emoji: "⚡" },
  { label: "streetmarket", emoji: "🛍️" },
];
const VIBE_PLACEHOLDER_PERSON = "Vibe (party, birthday, brunch, dinner, drinks, concert, club, festival, cinema, day event)";
const VIBE_PLACEHOLDER_ORGANIZER = "Vibe (music, party, festival, art, food, sports, streetmarket)";


type CoverMode = "image" | "emoji";

type ParsedDraft = {
  name: string;
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  location: string;
  city: string;
  description: string;
  vibeCategory: string;
};

type EventVisibility = "public" | "tentative" | "circle" | "private";

type DraftItem = {
  id: string;
  file?: File;
  preview?: string;
  status: "parsing" | "done" | "error";
  error?: string;
  draft: ParsedDraft;
  visibility: EventVisibility;
  rsvp: "going" | "interested";
  inviteIds: string[];
  bringListEnabled: boolean;
  bringListItems: string[];
};

const emptyDraft = (): ParsedDraft => ({
  name: "", date: "", endDate: "", time: "", endTime: "", location: "", city: "", description: "", vibeCategory: "",
});

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

import { useAccountMode } from "@/hooks/useAccountMode";

const LAST_CITY_KEY = "iamin.lastEventCity";
const DRAFT_KEY = "iamin.addEventDraft";

/**
 * Resolve a fallback city when neither the screenshot AI nor the server-side
 * reverse-geocode produced one. Order:
 *   1. The user's profile city.
 *   2. Last city they successfully saved an event with (localStorage).
 *   3. Browser geolocation → Nominatim reverse-geocode.
 */
async function resolveFallbackCity(userId?: string): Promise<string> {
  // 1) Profile city
  if (userId) {
    try {
      const { data } = await supabase
        .from("profiles").select("city").eq("user_id", userId).maybeSingle();
      const c = ((data as any)?.city as string | undefined)?.trim();
      if (c) return c;
    } catch { /* ignore */ }
  }
  // 2) Last used
  try {
    const last = window.localStorage.getItem(LAST_CITY_KEY)?.trim();
    if (last) return last;
  } catch { /* ignore */ }
  // 3) Geolocation reverse-geocode
  try {
    if (!("geolocation" in navigator)) return "";
    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
      );
    });
    if (!pos) return "";
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return "";
    const json = await res.json();
    const a = json?.address ?? {};
    return a.city || a.town || a.village || a.municipality || a.county || "";
  } catch { return ""; }
}

/** Section card: dark glass card with uppercase header + bare violet icon. */
const SectionCard = ({
  icon: Icon, label, hint, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card className="glass">
    <CardContent className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-bold">{label}</span>
        </div>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </CardContent>
  </Card>
);

/** Floating-label wrapper around a standard Input. */
const FloatingField = ({
  label, value, onChange, required, type = "text", inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal";
}) => {
  const filled = value && value.length > 0;
  return (
    <div className="relative">
      <Input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="h-14 pt-5 pb-1"
      />
      <label
        className={`absolute left-3 pointer-events-none transition-all text-muted-foreground ${
          filled ? "top-1.5 text-[10px] uppercase tracking-wider font-semibold" : "top-1/2 -translate-y-1/2 text-sm"
        }`}
      >
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
    </div>
  );
};

const AddEvent = () => {
  const { mode: accountMode } = useAccountMode();
  const [searchParams] = useSearchParams();
  // Route-level override wins: /add-event?mode=organizer always renders the
  // organizer form, ?mode=person always renders the person form. This stops
  // the "+" button from being ambiguous when a user has both capabilities.
  const queryMode = searchParams.get("mode");
  const mode = queryMode === "organizer" || queryMode === "person" ? queryMode : accountMode;
  const isOrganizer = mode === "organizer";
  const VIBE_OPTIONS = isOrganizer ? VIBE_ORGANIZER : VIBE_PERSON;
  const VIBE_PLACEHOLDER = isOrganizer ? VIBE_PLACEHOLDER_ORGANIZER : VIBE_PLACEHOLDER_PERSON;

  const { user } = useAuth();
  const { data: friendIds = [] } = useFriendIds();
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptic = useHaptics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single (manual / URL) draft + cover state
  const [singleDraft, setSingleDraft] = useState<ParsedDraft>(emptyDraft());
  const [singleVisibility, setSingleVisibility] = useState<EventVisibility>(isOrganizer ? "public" : "circle");
  const [singleInviteIds, setSingleInviteIds] = useState<string[]>([]);
  const [singleCoCreatorIds, setSingleCoCreatorIds] = useState<string[]>([]);
  const [inviteAllFollowers, setInviteAllFollowers] = useState(false);
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [singleBringListEnabled, setSingleBringListEnabled] = useState(false);
  const [singleBringListItems, setSingleBringListItems] = useState<string[]>([]);
  const [capacity, setCapacity] = useState<string>("");
  const [ticketEnabled, setTicketEnabled] = useState(false);
  const [ticketPrice, setTicketPrice] = useState<string>("");
  const [ticketCurrency, setTicketCurrency] = useState<string>("EUR");
  const [url, setUrl] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDescLoading, setAiDescLoading] = useState<null | "generate" | "improve">(null);
  const [loading, setLoading] = useState(false);

  // Cover state for single mode
  const [coverMode, setCoverMode] = useState<CoverMode>("emoji");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [emojiCover, setEmojiCover] = useState<EmojiCover>({ emoji: "✨", color: COVER_COLORS[0].value });
  const [studioOpen, setStudioOpen] = useState(false);

  // Bulk drafts (one per screenshot)
  const [bulkDrafts, setBulkDrafts] = useState<DraftItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  // Bulk crop state — which draft id is currently being cropped
  const [bulkCropDraftId, setBulkCropDraftId] = useState<string | null>(null);
  const [bulkCropSrc, setBulkCropSrc] = useState<string | null>(null);

  // City required indicator
  const [cityHighlighted, setCityHighlighted] = useState(false);
  const [activeTab, setActiveTab] = useState<"photo" | "url" | "manual">(isOrganizer ? "manual" : "photo");

  useEffect(() => {
    if (!user || !isOrganizer) return;
    setActiveTab("manual");
    setSingleVisibility((v) => (v === "public" || v === "private" ? v : "public"));
    (supabase as any).rpc("set_account_mode", { _mode: "organizer" });
  }, [user, isOrganizer]);

  useEffect(() => {
    if (!isOrganizer) {
      // Regular users may also create public events now; keep their selection
      // as-is. Only force a default when nothing valid is set.
      return;
    }
    if (!user) return;
    supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", user.id)
      .then(({ data }) => setFollowerIds((data ?? []).map((r: any) => r.follower_id)));
  }, [isOrganizer, user]);

  const ensureOrganizerCapability = async () => {
    if (!user || !isOrganizer) return;
    const { error } = await (supabase as any).rpc("set_account_mode", { _mode: "organizer" });
    if (error) throw error;
  };

  // PWA share-target (D2): if user shared a URL into the app, autofill it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("url") || params.get("text") || "";
    const trimmed = shared.trim();
    if (/^https?:\/\/\S+$/i.test(trimmed)) {
      setUrl(trimmed);
      setActiveTab("url");
      // Clean URL so reload doesn't re-trigger
      window.history.replaceState({}, "", "/add-event");
    }
  }, []);

  // Clone prefill from "Run it again" on past event detail
  useEffect(() => {
    const raw = sessionStorage.getItem("iamin.cloneEvent");
    if (!raw) return;
    sessionStorage.removeItem("iamin.cloneEvent");
    try {
      const c = JSON.parse(raw);
      setSingleDraft((p) => ({
        ...p,
        name: c.name ?? "",
        location: c.location ?? "",
        city: c.city ?? "",
        description: c.description ?? "",
        vibeCategory: c.vibe_category ?? "",
      }));
      if (c.capacity) setCapacity(String(c.capacity));
      setActiveTab("manual");
      sessionStorage.removeItem(DRAFT_KEY);
    } catch { /* ignore */ }
  }, []);

  // ─── Draft autosave so we don't lose the form on accidental navigation ───
  const draftHydratedRef = useRef(false);
  useEffect(() => {
    // hydrate once on mount (skip if a clone payload is incoming)
    if (draftHydratedRef.current) return;
    if (sessionStorage.getItem("iamin.cloneEvent")) { draftHydratedRef.current = true; return; }
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) { draftHydratedRef.current = true; return; }
    try {
      const d = JSON.parse(raw);
      if (d.singleDraft) setSingleDraft(d.singleDraft);
      if (d.singleVisibility) setSingleVisibility(d.singleVisibility);
      if (d.capacity != null) setCapacity(d.capacity);
      if (d.ticketEnabled != null) setTicketEnabled(d.ticketEnabled);
      if (d.ticketPrice != null) setTicketPrice(d.ticketPrice);
      if (d.ticketCurrency) setTicketCurrency(d.ticketCurrency);
      if (d.url) setUrl(d.url);
      if (d.activeTab) setActiveTab(d.activeTab);
      if (d.coverMode) setCoverMode(d.coverMode);
      if (d.emojiCover) setEmojiCover(d.emojiCover);
      if (d.imagePreview) setImagePreview(d.imagePreview);
      if (d.singleInviteIds) setSingleInviteIds(d.singleInviteIds);
      if (d.singleCoCreatorIds) setSingleCoCreatorIds(d.singleCoCreatorIds);
      if (d.singleBringListEnabled != null) setSingleBringListEnabled(d.singleBringListEnabled);
      if (d.singleBringListItems) setSingleBringListItems(d.singleBringListItems);
    } catch { /* ignore */ }
    draftHydratedRef.current = true;
  }, []);

  // Query-param prefill (from friend profile empty-day CTA, calendar empty-day CTA, etc.)
  useEffect(() => {
    const qDate = searchParams.get("date");
    const qInvite = searchParams.get("invite");
    if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      setSingleDraft((p) => (p.date ? p : { ...p, date: qDate }));
      setActiveTab("manual");
    }
    if (qInvite) {
      setSingleInviteIds((prev) => (prev.includes(qInvite) ? prev : [...prev, qInvite]));
      // Default to "List" so the invitee actually gets it
      setSingleVisibility((v) => (v === "circle" ? "private" : v));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftHydratedRef.current) return;
    const id = window.setTimeout(() => {
      try {
        const snap = {
          singleDraft, singleVisibility, capacity, ticketEnabled, ticketPrice, ticketCurrency,
          url, activeTab, coverMode, emojiCover, imagePreview,
          singleInviteIds, singleCoCreatorIds, singleBringListEnabled, singleBringListItems,
        };
        // Only persist if something meaningful is filled
        const hasContent = singleDraft.name || singleDraft.location || singleDraft.description || url || imagePreview;
        if (hasContent) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
      } catch { /* quota / serialization — ignore */ }
    }, 400);
    return () => window.clearTimeout(id);
  }, [singleDraft, singleVisibility, capacity, ticketEnabled, ticketPrice, ticketCurrency, url, activeTab, coverMode, emojiCover, imagePreview, singleInviteIds, singleCoCreatorIds, singleBringListEnabled, singleBringListItems]);


  // Clipboard auto-detect REMOVED — it triggers iOS paste prompts that
  // disturb the add-event flow.
  const [singleRsvp, setSingleRsvp] = useState<"going" | "interested">("going");

  // Duplicate prompt
  const [duplicatePrompt, setDuplicatePrompt] = useState<{ id: string; name: string; creator: string } | null>(null);

  useEffect(() => {
    if (!singleDraft.name || !singleDraft.date || !user || friendIds.length === 0) return;
    const check = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, created_by")
        .eq("date", singleDraft.date)
        .ilike("name", singleDraft.name.trim())
        .in("created_by", friendIds)
        .limit(1);
      if (data && data.length > 0 && !duplicatePrompt) {
        const dupe = data[0];
        const { data: prof } = await supabase
          .from("profiles").select("display_name").eq("user_id", dupe.created_by).maybeSingle();
        setDuplicatePrompt({ id: dupe.id, name: dupe.name, creator: prof?.display_name ?? "A friend" });
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleDraft.name, singleDraft.date, friendIds.join(",")]);

  // ============= BULK SCREENSHOT FLOW =============
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    addFilesToBulk(files);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFilesToBulk(files);
  };

  const addFilesToBulk = (files: File[]) => {
    const newDrafts: DraftItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "parsing",
      draft: emptyDraft(),
      visibility: isOrganizer ? "public" : "circle",
      rsvp: "going",
      inviteIds: [],
      bringListEnabled: false,
      bringListItems: [],
    }));
    setBulkDrafts((prev) => [...prev, ...newDrafts]);
    newDrafts.forEach((item) => parseScreenshot(item));
  };

  const parseScreenshot = async (item: DraftItem) => {
    if (!item.file) return;
    // Hard guard — organizers should never reach screenshot ingestion even if
    // a stale tab state or deep link tries to trigger it.
    if (isOrganizer) return;
    try {
      // Compress before sending — Gemini Vision rejects very large base64 payloads
      // and the edge function caps body size at ~5MB. WhatsApp-style compression
      // (maxEdge 1600, quality 0.75) is plenty for OCR.
      const compressed = await compressImage(item.file, { maxEdge: 1600, quality: 0.75 });
      const base64 = await fileToBase64(compressed);
      if (base64.length > 5_000_000) {
        throw new Error("Image is too large even after compression. Try a smaller screenshot.");
      }
      const { data, error } = await supabase.functions.invoke("parse-event-screenshot", { body: { image: base64 } });
      if (error) {
        const msg = (data as any)?.error || error.message || "AI couldn't read that screenshot.";
        throw new Error(msg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      // Client-side city fallback when AI + server reverse-geocode both came up empty.
      let cityValue: string = data?.city ?? "";
      if (!cityValue.trim()) {
        cityValue = await resolveFallbackCity(user?.id);
      }

      setBulkDrafts((prev) =>
        prev.map((d) =>
          d.id === item.id
            ? {
                ...d,
                status: "done",
                draft: {
                  name: data?.name ?? "",
                  date: data?.date ?? "",
                  endDate: data?.end_date ?? "",
                  time: data?.time ?? "",
                  endTime: data?.end_time ?? "",
                  location: data?.location ?? "",
                  city: cityValue,
                  description: data?.description ?? "",
                  vibeCategory: data?.vibe_category ?? "",
                },
              }
            : d
        )
      );
    } catch (err: any) {
      const message = err?.message ?? "Parse failed";
      setBulkDrafts((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: "error", error: message } : d))
      );
      toast({ title: "Screenshot failed", description: message, variant: "destructive" });
    }
  };

  /** Merge a second screenshot into an existing bulk draft — only fills empty fields. */
  const augmentBulkDraft = async (id: string, file: File) => {
    try {
      const compressed = await compressImage(file, { maxEdge: 1600, quality: 0.75 });
      const base64 = await fileToBase64(compressed);
      if (base64.length > 5_000_000) throw new Error("Image too large after compression.");
      const { data, error } = await supabase.functions.invoke("parse-event-screenshot", { body: { image: base64 } });
      if (error) throw new Error((data as any)?.error || error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      setBulkDrafts((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          const merged: ParsedDraft = {
            name: d.draft.name || (data?.name ?? ""),
            date: d.draft.date || (data?.date ?? ""),
            endDate: d.draft.endDate || (data?.end_date ?? ""),
            time: d.draft.time || (data?.time ?? ""),
            endTime: d.draft.endTime || (data?.end_time ?? ""),
            location: d.draft.location || (data?.location ?? ""),
            city: d.draft.city || (data?.city ?? ""),
            description: d.draft.description || (data?.description ?? ""),
            vibeCategory: d.draft.vibeCategory || (data?.vibe_category ?? ""),
          };
          return { ...d, draft: merged };
        })
      );
      toast({ title: "Merged extra info ✨" });
    } catch (err: any) {
      toast({ title: "Couldn't merge screenshot", description: err?.message, variant: "destructive" });
    }
  };


  const updateBulkDraft = (id: string, patch: Partial<ParsedDraft>) => {
    setBulkDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, draft: { ...d.draft, ...patch } } : d)));
  };

  const removeBulkDraft = (id: string) => setBulkDrafts((prev) => prev.filter((d) => d.id !== id));

  const openBulkCrop = (id: string) => {
    const d = bulkDrafts.find((x) => x.id === id);
    if (!d?.preview) return;
    setBulkCropDraftId(id);
    setBulkCropSrc(d.preview);
  };

  const handleBulkCropConfirm = (blob: Blob, previewUrl: string) => {
    if (!bulkCropDraftId) return;
    const id = bulkCropDraftId;
    const newFile = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" });
    setBulkDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, file: newFile, preview: previewUrl } : d))
    );
    setBulkCropDraftId(null);
    setBulkCropSrc(null);
  };

  const createAllBulk = async () => {
    if (!user || bulkDrafts.length === 0) return;
    const ready = bulkDrafts.filter((d) => d.status === "done" && d.draft.name);
    const missingCity = ready.find((d) => !d.draft.city.trim());
    if (missingCity) {
      haptic("error");
      toast({
        title: "City required",
        description: `Please add a city for "${missingCity.draft.name || "an event"}" before creating.`,
        variant: "destructive",
      });
      return;
    }
    if (ready.length === 0) {
      haptic("warning");
      toast({ title: "Nothing to create", description: "All drafts must finish parsing and have a name." });
      return;
    }
    setBulkLoading(true);
    try {
      if (isOrganizer) await ensureOrganizerCapability();
      // Upload images per draft, then insert sequentially so we can attach
      // the creator's RSVP row + invite friends per event.
      const { data: me } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();

      let createdCount = 0;
      for (const d of ready) {
        let image_url: string | null = null;
        if (d.file) {
          const compressed = await compressImage(d.file);
          const filePath = `${user.id}/${Date.now()}-${compressed.name}`;
          const { error: upErr } = await supabase.storage.from("event-images").upload(filePath, compressed, {
            contentType: compressed.type || "image/jpeg",
          });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(filePath);
            image_url = urlData.publicUrl;
          }
        }
        const { data: inserted, error: insertErr } = await supabase.from("events").insert({
          name: toSentenceCase(d.draft.name),
          date: d.draft.date || null,
          end_date: d.draft.endDate && d.draft.endDate > (d.draft.date || "") ? d.draft.endDate : null,
          time: d.draft.time || null,
          end_time: d.draft.endTime || null,
          location: d.draft.location || null,
          city: d.draft.city || null,
          description: d.draft.description || null,
          vibe_category: d.draft.vibeCategory || null,
          image_url,
          created_by: user.id,
          visibility: d.visibility,
          bring_list_enabled: isOrganizer ? false : d.bringListEnabled,
        }).select("id").single();
        if (insertErr) throw insertErr;
        const newId = inserted!.id;
        // Creator RSVP
        await supabase.from("attendees").insert({
          event_id: newId,
          user_id: user.id,
          status: isOrganizer ? "going" : d.rsvp,
        });
        // Pre-fill bring list items
        if (!isOrganizer && d.bringListEnabled && d.bringListItems.length > 0) {
          await supabase.from("event_bring_items").insert(
            d.bringListItems.map((label) => ({
              event_id: newId,
              label,
              created_by: user.id,
            })),
          );
        }
        // Invites → event_invites (trigger sends notification)
        const inviteIds = isOrganizer && inviteAllFollowers ? followerIds : d.inviteIds;
        if (inviteIds.length > 0) {
          await supabase.from("event_invites").insert(
            [...new Set(inviteIds)].filter((uid) => uid !== user.id).map((uid) => ({ event_id: newId, invitee_id: uid, inviter_id: user.id })),
          );
        }
        createdCount++;
      }
      const lastCity = ready.map((d) => d.draft.city.trim()).filter(Boolean).pop();
      if (lastCity) {
        try { window.localStorage.setItem(LAST_CITY_KEY, lastCity); } catch { /* ignore */ }
      }
      toast({ title: `${createdCount} event${createdCount > 1 ? "s" : ""} created!` });
      haptic("success");
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      navigate("/");
    } catch (err: any) {
      haptic("error");
      const f = toFriendlyError(err, "Create events");
      console.error("Create events failed", err);
      console.error("Create event failed", err);
      toast({ title: f.title, description: f.description, variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };


  // ============= SINGLE / URL / MANUAL FLOW =============
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropSrc(URL.createObjectURL(file));
  };

  const handleCropConfirm = (blob: Blob, previewUrl: string) => {
    setImageBlob(blob);
    setImagePreview(previewUrl);
    setCropSrc(null);
    setCoverMode("image");
  };

  const handleParseUrl = async () => {
    if (!url) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-event-url", { body: { url } });
      // Edge function returned an explicit unsupported_source — surface a helpful message and do NOT fill the form
      if ((data as any)?.error === "unsupported_source") {
        toast({
          title: "Can't read that link",
          description: (data as any).message ?? "Try a screenshot or fill it in manually.",
          variant: "destructive",
        });
        return;
      }
      if (error) throw error;
      if (data && data.name) {
        setSingleDraft((p) => ({
          ...p,
          name: data.name ?? p.name,
          date: data.date ?? p.date,
          time: data.time ?? p.time,
          endTime: data.end_time ?? p.endTime,
          endDate: data.end_date ?? p.endDate,
          location: data.location ?? p.location,
          city: data.city ?? p.city,
          description: data.description ?? p.description,
          vibeCategory: data.vibe_category ?? p.vibeCategory,
        }));
        if (!data.city) {
          setCityHighlighted(true);
          setTimeout(() => setCityHighlighted(false), 2500);
        }
        // If AI surfaced a hero image, auto-open the cropper.
        if (data.image_url && typeof data.image_url === "string") {
          try {
            const res = await fetch(data.image_url);
            if (res.ok) {
              const blob = await res.blob();
              setCropSrc(URL.createObjectURL(blob));
            }
          } catch { /* ignore — user can add image manually */ }
        }
        toast({ title: "Event details extracted!" });
      } else {
        toast({ title: "Couldn't read that page", description: "Try a screenshot or fill it in manually.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to parse URL", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiDescription = async (mode: "generate" | "improve") => {
    if (aiDescLoading) return;
    if (mode === "generate" && (!singleDraft.name.trim() || !singleDraft.vibeCategory.trim())) {
      toast({ title: "Add a name and vibe first", description: "AI needs a starting point." });
      return;
    }
    if (mode === "improve" && !singleDraft.description.trim()) {
      toast({ title: "Write a draft first", description: "Even a phrase or bullet list helps." });
      return;
    }
    setAiDescLoading(mode);
    try {
      let flyer_image_url: string | undefined;
      if (mode === "generate" && imageBlob) {
        flyer_image_url = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = () => rej(r.error);
          r.readAsDataURL(imageBlob);
        });
      }
      const { data, error } = await supabase.functions.invoke("generate-event-description", {
        body: {
          mode,
          name: singleDraft.name,
          vibe_category: singleDraft.vibeCategory,
          city: singleDraft.city,
          location: singleDraft.location,
          date: singleDraft.date,
          time: singleDraft.time,
          flyer_image_url,
          current_text: mode === "improve" ? singleDraft.description : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const out = (data as any)?.description?.trim();
      if (out) updateSingle({ description: out });
      haptic("success");
    } catch (err: any) {
      toast({ title: "AI failed", description: err.message ?? "Try again", variant: "destructive" });
    } finally {
      setAiDescLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !singleDraft.name) return;
    if (!singleDraft.city.trim()) {
      setCityHighlighted(true);
      haptic("error");
      toast({ title: "City required", description: "Add a city so others can find this event nearby.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (isOrganizer) await ensureOrganizerCapability();
      let image_url: string | null = null;
      if (coverMode === "image" && imageBlob) {
        const baseName = imageBlob instanceof File ? imageBlob.name : `cover-${Date.now()}.jpg`;
        const compressed = await compressImage(
          imageBlob instanceof File ? imageBlob : new File([imageBlob], baseName, { type: imageBlob.type || "image/jpeg" }),
        );
        const filePath = `${user.id}/${Date.now()}-${compressed.name}`;
        const { error: uploadError } = await supabase.storage.from("event-images").upload(filePath, compressed, {
          contentType: compressed.type || "image/jpeg",
        });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }
      const finalDescription =
        coverMode === "emoji"
          ? `[[cover:${emojiCover.emoji}|${emojiCover.color}]] ${singleDraft.description ?? ""}`.trim()
          : singleDraft.description || null;

      const { data: insertedEvent, error } = await supabase
        .from("events")
        .insert({
          name: toSentenceCase(singleDraft.name),
          date: singleDraft.date || null,
          end_date: singleDraft.endDate && singleDraft.endDate > singleDraft.date ? singleDraft.endDate : null,
          time: singleDraft.time || null,
          end_time: singleDraft.endTime || null,
          location: singleDraft.location || null,
          city: singleDraft.city || null,
          description: finalDescription,
          vibe_category: singleDraft.vibeCategory || null,
          image_url,
          source_url: url || null,
          created_by: user.id,
          visibility: singleVisibility,
          bring_list_enabled: isOrganizer ? false : singleBringListEnabled,
          ...(isOrganizer
            ? {
                capacity: capacity ? Number(capacity) : null,
                ticket_price_cents: ticketEnabled && ticketPrice ? Math.round(Number(ticketPrice) * 100) : null,
                ticket_currency: ticketEnabled && ticketPrice ? ticketCurrency : null,
              }
            : {}),
        })
        .select("id")
        .single();
      if (error) throw error;

      // Insert creator's own attendee row with chosen RSVP
      if (insertedEvent?.id) {
        await supabase.from("attendees").insert({
          event_id: insertedEvent.id,
          user_id: user.id,
          status: isOrganizer ? "going" : singleRsvp,
        });
      }

      // Pre-fill bring list items
      if (insertedEvent?.id && !isOrganizer && singleBringListEnabled && singleBringListItems.length > 0) {
        await supabase.from("event_bring_items").insert(
          singleBringListItems.map((label) => ({
            event_id: insertedEvent.id,
            label,
            created_by: user.id,
          })),
        );
      }

      // Pre-invite selected friends/followers → uses event_invites (notification trigger handles the rest)
      if (insertedEvent?.id) {
        const newId = insertedEvent.id;
        const inviteIds = isOrganizer && inviteAllFollowers ? followerIds : singleInviteIds;
        if (inviteIds.length > 0) {
          await supabase.from("event_invites").insert(
            [...new Set(inviteIds)].filter((uid) => uid !== user.id).map((uid) => ({ event_id: newId, invitee_id: uid, inviter_id: user.id })),
          );
        }
        if (singleCoCreatorIds.length > 0) {
          await (supabase as any).from("event_collaborators").insert(
            [...new Set(singleCoCreatorIds)].filter((uid) => uid !== user.id).map((uid) => ({ event_id: newId, user_id: uid, added_by: user.id })),
          );
        }
      }

      if (singleDraft.city.trim()) {
        try { window.localStorage.setItem(LAST_CITY_KEY, singleDraft.city.trim()); } catch { /* ignore */ }
      }
      toast({ title: "Event created!" });
      haptic("success");
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      navigate("/");
    } catch (err: any) {
      haptic("error");
      const f = toFriendlyError(err, "Create event");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateSingle = (patch: Partial<ParsedDraft>) => setSingleDraft((p) => ({ ...p, ...patch }));

  return (
    <AppLayout>
      <div
        className="max-w-lg mx-auto space-y-5 pb-32"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        {/* Top tab strip — Photo · URL · Manual */}
        <div className="rounded-full bg-secondary/60 p-1 flex ring-1 ring-border">
          {(([
                { v: "photo", label: "Photo", icon: Camera },
                { v: "url", label: "URL", icon: LinkIcon },
                { v: "manual", label: "Manual", icon: PenTool },
              ] as const)
          ).map(({ v, label, icon: Icon }) => {
            const active = activeTab === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => { haptic("selection"); setActiveTab(v); }}
                className={`flex-1 h-11 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  active
                    ? "bg-card text-foreground ring-1 ring-primary/40 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>



        <Tabs value={activeTab} onValueChange={(v) => { haptic("selection"); setActiveTab(v as "photo" | "url" | "manual"); }} className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="photo" />
            <TabsTrigger value="url" />
            <TabsTrigger value="manual" />
          </TabsList>

          {/* ========= PHOTO TAB — bulk drafts ========= */}
          {/* ========= PHOTO TAB — bulk drafts ========= */}
          {(
          <TabsContent value="photo" className="mt-4 space-y-4">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center"
            >
              <motion.span
                className="text-4xl inline-block"
                style={{ lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif', willChange: "transform" }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                📸
              </motion.span>
            </motion.div>
            {bulkDrafts.length === 0 && (
              <p className="text-sm text-muted-foreground leading-snug px-1">
                <span className="text-foreground font-semibold">Fastest way in.</span>{" "}
                Drop a flyer or screenshot and the AI fills the event out for you —
                drop several and each becomes its own event.
              </p>
            )}
            <Card className="glass">
              <CardContent className="p-5">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    isDragging ? "border-primary bg-primary/10" : "border-primary/40 hover:border-primary/70"
                  }`}
                  onClick={() => { haptic("light"); fileInputRef.current?.click(); }}
                >
                  <p className="text-foreground font-bold text-base">Drop screenshots</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG or JPG · up to 10 at once
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {bulkDrafts.length === 0 && (
              <>
                {/* HOW IT WORKS */}
                <SectionCard icon={Sparkles} label="How it works">
                  <ol className="space-y-3">
                    {[
                      { t: "Drop the flyer", d: "A poster, a story screenshot, a group-chat invite — anything." },
                      { t: "AI reads it", d: "Title, date, time, venue and vibe are detected automatically." },
                      { t: "Review & post", d: "Tweak anything that looks off, then create — solo or in a batch." },
                    ].map((s, i) => (
                      <li key={s.t} className="flex items-start gap-3">
                        <span className="h-6 w-6 shrink-0 rounded-lg border border-primary/40 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{s.t}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </SectionCard>

                {/* WHAT YOU GET BACK */}
                <SectionCard icon={FileText} label="What you get back">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-20 h-24 rounded-xl flex items-center justify-center text-[10px] font-extrabold text-white text-center leading-tight px-1.5 relative overflow-hidden"
                      style={{ background: "linear-gradient(135deg, hsl(270 80% 55%), hsl(285 70% 35%))" }}
                    >
                      <span className="relative z-10">EVENT<br />NAME</span>
                      {/* AI scanning line */}
                      <motion.span
                        aria-hidden
                        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent shadow-[0_0_12px_2px_rgba(255,255,255,0.7)]"
                        initial={{ top: 0 }}
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0"
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <span className="text-primary">→</span>
                    <div className="flex-1 rounded-xl bg-secondary/40 p-3 space-y-1.5 text-xs">
                      {[
                        ["TITLE", "Event name"],
                        ["WHEN", "Fri · 23:00"],
                        ["VIBE", "Club"],
                      ].map(([k, v], i) => (
                        <motion.div
                          key={k}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.25, duration: 0.35 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-12 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k}</span>
                          <Check className="h-3 w-3 text-green-400" />
                          <span className="text-foreground font-semibold">{v}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[
                      { bg: "linear-gradient(135deg, hsl(265 85% 70%), hsl(280 75% 55%))", label: "Event 1" },
                      { bg: "linear-gradient(135deg, hsl(280 75% 55%), hsl(295 65% 40%))", label: "Event 2" },
                      { bg: "linear-gradient(135deg, hsl(255 70% 40%), hsl(270 80% 25%))", label: "Event 3" },
                    ].map((c) => (
                      <div key={c.label} className="aspect-[3/4] rounded-xl relative overflow-hidden ring-1 ring-border" style={{ background: c.bg }}>
                        <div className="absolute inset-x-2 bottom-2 rounded-lg bg-black/40 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white">
                          {c.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    Drop 3 flyers → review 3 ready-made events
                  </p>
                </SectionCard>
              </>
            )}



            {bulkDrafts.length > 0 && (
              <div className="space-y-3">
                {bulkDrafts.map((d, idx) => (
                  <Card key={d.id} className="glass">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {d.preview && (
                          <div className="relative shrink-0">
                            <img src={d.preview} alt="" className="w-16 h-16 rounded-lg object-cover" />
                            <button
                              type="button"
                              onClick={() => openBulkCrop(d.id)}
                              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-background hover:bg-primary/90 transition-colors"
                              title="Crop image"
                            >
                              <Camera className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                              Event {idx + 1}
                            </span>
                            {d.status === "parsing" && (
                              <span className="flex items-center gap-1 text-[10px] text-primary">
                                <Loader2 className="h-3 w-3 animate-spin" /> AI parsing
                              </span>
                            )}
                            {d.status === "error" && (
                              <span className="text-[10px] text-destructive">{d.error}</span>
                            )}
                          </div>
                          {d.preview && d.status !== "parsing" && (
                            <div className="flex flex-wrap gap-x-3 mt-1">
                              <button
                                type="button"
                                onClick={() => openBulkCrop(d.id)}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Crop image
                              </button>
                              <label className="text-[10px] text-primary hover:underline cursor-pointer">
                                Replace cover
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      const url = URL.createObjectURL(f);
                                      setBulkDrafts((prev) => prev.map((x) => x.id === d.id ? { ...x, file: f, preview: url } : x));
                                    }
                                    e.currentTarget.value = "";
                                  }}
                                />
                              </label>
                              <label className="text-[10px] text-primary hover:underline cursor-pointer">
                                + More info from another screenshot
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) augmentBulkDraft(d.id, f);
                                    e.currentTarget.value = "";
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { haptic("light"); removeBulkDraft(d.id); }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {d.status !== "parsing" && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Event Name *"
                            value={d.draft.name}
                            onChange={(e) => updateBulkDraft(d.id, { name: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Start date</label>
                              <IOSDateTimePicker mode="date" value={d.draft.date} onChange={(v) => updateBulkDraft(d.id, { date: v })} label="START DATE" />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">End date (opt.)</label>
                              <IOSDateTimePicker mode="date" value={d.draft.endDate} min={d.draft.date} onChange={(v) => updateBulkDraft(d.id, { endDate: v })} label="END DATE" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Start time</label>
                              <IOSDateTimePicker mode="time" value={d.draft.time} onChange={(v) => updateBulkDraft(d.id, { time: v })} label="START TIME" placeholder="Time" />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">End time (opt.)</label>
                              <IOSDateTimePicker mode="time" value={d.draft.endTime} onChange={(v) => updateBulkDraft(d.id, { endTime: v })} label="END TIME" placeholder="Time" />
                            </div>
                          </div>
                          <Input
                            placeholder="Location / venue"
                            value={d.draft.location}
                            onChange={(e) => updateBulkDraft(d.id, { location: e.target.value })}
                          />
                          <div className={!d.draft.city ? "ring-1 ring-destructive/40 rounded-lg" : ""}>
                            <CityAutocomplete
                              value={d.draft.city}
                              onChange={(city) => updateBulkDraft(d.id, { city })}
                              placeholder="City *"
                              required
                              invalid={!d.draft.city}
                            />
                          </div>
                          {!d.draft.city && (
                            <p className="text-[11px] text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> City is required
                            </p>
                          )}
                          <Textarea
                            placeholder="Description"
                            value={d.draft.description}
                            onChange={(e) => updateBulkDraft(d.id, { description: e.target.value })}
                            rows={2}
                          />
                          <Input
                            placeholder={VIBE_PLACEHOLDER}
                            value={d.draft.vibeCategory}
                            onChange={(e) => updateBulkDraft(d.id, { vibeCategory: e.target.value })}
                          />
                          {!d.draft.vibeCategory && (
                            <div className="flex flex-wrap gap-1.5">
                              {VIBE_OPTIONS.map((v) => (
                                <button
                                  key={v.label}
                                  onClick={() => { haptic("selection"); updateBulkDraft(d.id, { vibeCategory: v.label }); }}
                                  className="px-2 py-1 rounded-full bg-secondary hover:bg-primary/20 text-[10px] font-medium transition-colors border border-border"
                                >
                                  {v.emoji} {v.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Privacy */}
                          <div className="rounded-xl bg-secondary/40 p-2.5 space-y-1.5">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Privacy</Label>
                            <div className={`grid ${isOrganizer ? "grid-cols-2" : "grid-cols-4"} gap-1.5`}>
                              {(isOrganizer
                                ? ([
                                    { v: "public", label: "Open", icon: Eye },
                                    { v: "private", label: "List", icon: Lock },
                                  ] as const)
                                : ([
                                    { v: "circle", label: "Circle", icon: UsersIcon },
                                    { v: "private", label: "List", icon: Lock },
                                    { v: "public", label: "Public", icon: Eye },
                                    { v: "tentative", label: "Ghost", icon: EyeOff },
                                  ] as const)
                              ).map(({ v, label, icon: Icon }) => {
                                const active = d.visibility === v;
                                return (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={() => {
                                      haptic("selection");
                                      setBulkDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, visibility: v } : x)));
                                    }}
                                    className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all ${
                                      active
                                        ? "bg-primary text-primary-foreground glow-sm"
                                        : "bg-card text-foreground border border-border hover:border-primary/40"
                                    }`}
                                  >
                                    <Icon className="h-3 w-3" />
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* RSVP */}
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Your RSVP</Label>
                            <div className="flex gap-1.5 ml-auto">
                              {(["interested", "going"] as const).map((s) => {
                                const active = d.rsvp === s;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      haptic("selection");
                                      setBulkDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, rsvp: s } : x)));
                                    }}
                                    className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                                      active
                                        ? "bg-primary text-primary-foreground border-primary glow-sm"
                                        : "bg-secondary text-foreground border-border hover:border-primary/40"
                                    }`}
                                  >
                                    {s === "going" ? "I am in" : "Maybe"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Bring list toggle */}
                          {!isOrganizer && <div className="rounded-xl bg-secondary/40 p-2.5 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-accent" />
                              <div className="flex-1 min-w-0">
                                <Label className="text-[11px] font-semibold">"Bring what?" list</Label>
                                <p className="text-[10px] text-muted-foreground leading-tight">Crowdsource what to bring</p>
                              </div>
                              <Switch
                                checked={d.bringListEnabled}
                                onCheckedChange={(v) => {
                                  haptic("selection");
                                  setBulkDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, bringListEnabled: v } : x)));
                                }}
                              />
                            </div>
                            {d.bringListEnabled && (
                              <BringListDraftEditor
                                items={d.bringListItems}
                                onChange={(items) =>
                                  setBulkDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, bringListItems: items } : x)))
                                }
                                vibe={d.draft.vibeCategory}
                              />
                            )}
                          </div>}

                          {/* Invite friends */}
                          <InviteFriendsInline
                            value={d.inviteIds}
                            onChange={(ids) =>
                              setBulkDrafts((prev) => prev.map((x) => (x.id === d.id ? { ...x, inviteIds: ids } : x)))
                            }
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-sm"
                  onClick={createAllBulk}
                  disabled={bulkLoading || bulkDrafts.some((d) => d.status === "parsing")}
                >
                  {bulkLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    `Create all (${bulkDrafts.filter((d) => d.status === "done").length})`
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          )}

          {/* ========= URL TAB ========= */}
          <TabsContent value="url" className="mt-4">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center mb-3"
            >
              <motion.span
                className="text-4xl inline-block"
                style={{ lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif', willChange: "transform" }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                🔗
              </motion.span>
            </motion.div>
            {!singleDraft.name && (
              <p className="text-sm text-muted-foreground leading-snug px-1 mb-3">
                <span className="text-foreground font-semibold">Found it online?</span>{" "}
                Paste any event link and (IN) pulls the details across in seconds.
              </p>
            )}
            <Card className="glass">
              <CardContent className="p-5 space-y-4">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Paste event URL…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-9 h-11"
                  />
                </div>
                <Button
                  onClick={handleParseUrl}
                  disabled={aiLoading || !url}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-sm h-12 rounded-2xl text-sm font-bold"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Extract event details
                </Button>
                {singleDraft.name && (
                  <div className="text-sm text-muted-foreground">
                    Extracted: <span className="text-foreground font-medium">{singleDraft.name}</span>
                    {singleDraft.date && ` · ${singleDraft.date}`}
                  </div>
                )}
              </CardContent>
            </Card>

            {!singleDraft.name && (
              <div className="mt-4">
                <SectionCard icon={FileText} label="What we'll grab">
                  <div className="space-y-2">
                    {[
                      { t: "Title & description", d: "cleaned up and ready to edit" },
                      { t: "Date & time", d: "converted to your timezone" },
                      { t: "Venue & city", d: "mapped for the nearby filter" },
                      { t: "Cover image", d: "pulled straight from the page" },
                    ].map(({ t, d }) => (
                      <div key={t} className="min-w-0 py-1">
                        <p className="text-sm font-bold text-foreground">{t}</p>
                        <p className="text-xs text-muted-foreground">{d}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </TabsContent>

          {/* MANUAL TAB — no header explanation; the form below is the content */}
          <TabsContent value="manual" className="mt-4">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center mb-3"
            >
              <motion.span
                className="text-4xl inline-block"
                style={{ lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif', willChange: "transform" }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                📝
              </motion.span>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* ========= Shared cover (Manual / URL) — image w/ crop OR emoji =========
            Photo tab → never (bulk handles its own per-draft cover)
            URL tab   → only after AI parse (singleDraft.name populated)
            Manual    → always */}
        {bulkDrafts.length === 0 && activeTab !== "photo" && (activeTab === "manual" || !!singleDraft.name) && (
          <SectionCard icon={ImageIcon} label="Cover">
            <div className="relative rounded-2xl overflow-hidden ring-1 ring-border" style={{ minHeight: 180 }}>
              {coverMode === "image" && imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-[180px] object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      aria-label="Replace cover image"
                      className="h-7 w-7 bg-black/50 rounded-full text-white hover:bg-black/70 flex items-center justify-center"
                      onClick={() => imagePreview && setCropSrc(imagePreview)}
                    ><Camera className="h-3.5 w-3.5" /></button>
                  </div>
                </>
              ) : (
                <div
                  className="w-full h-[180px] flex items-center justify-center text-6xl relative"
                  style={{ background: `hsl(${emojiCover.color})` }}
                >
                  <span>{emojiCover.emoji}</span>
                  <button
                    type="button"
                    onClick={() => { haptic("selection"); setStudioOpen(true); }}
                    className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-black/60 backdrop-blur text-white text-xs font-bold hover:bg-black/80"
                  >
                    <PenTool className="h-3.5 w-3.5" /> Cover Studio
                  </button>
                </div>
              )}
            </div>

            {/* Emoji / Photo toggle */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {([
                { v: "emoji", icon: Smile, label: "Emoji" },
                { v: "image", icon: ImageIcon, label: "Photo" },
              ] as const).map(({ v, icon: Ic, label }) => {
                const active = coverMode === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      haptic("selection");
                      setCoverMode(v);
                      if (v === "image" && !imagePreview) document.getElementById("manual-image")?.click();
                    }}
                    className={`h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? "bg-primary/15 text-primary ring-1 ring-primary"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground ring-1 ring-border"
                    }`}
                  >
                    <Ic className="h-4 w-4" /> {label}
                  </button>
                );
              })}
            </div>
            <input id="manual-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {coverMode === "emoji" && (
              <EmojiCoverPicker value={emojiCover} onChange={setEmojiCover} hidePreview />
            )}
          </SectionCard>
        )}


        {/* ========= Single event form (Manual / URL after AI) ========= */}
        {bulkDrafts.length === 0 && activeTab !== "photo" && (activeTab === "manual" || !!singleDraft.name) && (
          <form id="add-event-form" onSubmit={handleSubmit} className="space-y-5">
            {/* THE BASICS */}
            <SectionCard icon={Tag} label="The basics">
              <FloatingField
                label="Event name"
                value={singleDraft.name}
                onChange={(v) => updateSingle({ name: v })}
                required
              />
            </SectionCard>

            {/* WHEN & WHERE */}
            <SectionCard icon={Calendar} label="When & where">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Start date<span className="text-primary ml-0.5">*</span>
                  </label>
                  <IOSDateTimePicker mode="date" value={singleDraft.date} onChange={(v) => updateSingle({ date: v })} label="START DATE" placeholder="Date" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    End date
                  </label>
                  <IOSDateTimePicker mode="date" value={singleDraft.endDate} min={singleDraft.date} onChange={(v) => updateSingle({ endDate: v })} label="END DATE" placeholder="Date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Start time
                  </label>
                  <IOSDateTimePicker mode="time" value={singleDraft.time} onChange={(v) => updateSingle({ time: v })} label="START TIME" placeholder="Start" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    End time
                  </label>
                  <IOSDateTimePicker mode="time" value={singleDraft.endTime} onChange={(v) => updateSingle({ endTime: v })} label="END TIME" placeholder="End" />
                </div>
              </div>
              <FloatingField
                label="Venue / address"
                value={singleDraft.location}
                onChange={(v) => updateSingle({ location: v })}
              />
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  City<span className="text-primary ml-0.5">*</span>
                </label>
                <div className={cityHighlighted ? "animate-shake" : ""}>
                  <CityAutocomplete
                    value={singleDraft.city}
                    onChange={(city) => { updateSingle({ city }); setCityHighlighted(false); }}
                    placeholder="City"
                    required
                    invalid={cityHighlighted && !singleDraft.city}
                  />
                </div>
              </div>
              {cityHighlighted && !singleDraft.city && (
                <p className="text-[11px] text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Please add a city
                </p>
              )}
            </SectionCard>

            {/* VIBE */}
            <SectionCard icon={Sparkles} label="Vibe">
              <div className="flex flex-wrap gap-1.5">
                {VIBE_OPTIONS.map((v) => {
                  const active = singleDraft.vibeCategory === v.label;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => { haptic("selection"); updateSingle({ vibeCategory: v.label }); }}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                        active
                          ? "bg-primary/20 text-primary ring-1 ring-primary"
                          : "bg-secondary/60 text-foreground ring-1 ring-border hover:ring-primary/40"
                      }`}
                    >
                      {v.emoji} {v.label}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* DESCRIPTION */}
            <SectionCard icon={FileText} label="Description" hint="optional">
              <div className="relative">
                <Textarea
                  placeholder="What's the plan?"
                  value={singleDraft.description}
                  onChange={(e) => updateSingle({ description: e.target.value })}
                  rows={4}
                  className="pr-2"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleAiDescription("generate")}
                  disabled={!!aiDescLoading || !singleDraft.name.trim() || !singleDraft.vibeCategory.trim()}
                  className="h-9 px-3 rounded-full text-[12px] font-semibold bg-primary/15 text-primary ring-1 ring-primary/40 hover:bg-primary/25 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {aiDescLoading === "generate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => handleAiDescription("improve")}
                  disabled={!!aiDescLoading || !singleDraft.description.trim()}
                  className="h-9 px-3 rounded-full text-[12px] font-semibold bg-secondary text-foreground ring-1 ring-border hover:bg-secondary/80 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {aiDescLoading === "improve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenTool className="w-3.5 h-3.5" />}
                  Improve
                </button>
              </div>
            </SectionCard>

            {/* WHO CAN SEE IT */}
            <SectionCard icon={Lock} label="Who can see it">
              <div className={`grid ${isOrganizer ? "grid-cols-2" : "grid-cols-4"} gap-2`}>
                {(isOrganizer
                  ? ([
                      { v: "public", label: "Open", icon: Eye, hint: "Anyone can find and join. For clubs, markets, community events." },
                      { v: "private", label: "List", icon: Lock, hint: "Only invitees see it." },
                    ] as const)
                  : ([
                      { v: "circle", label: "Circle", icon: UsersIcon, hint: "Visible only to your mutual friends. Won't appear on the public feed." },
                      { v: "private", label: "List", icon: Lock, hint: "Visible only to people you personally invite." },
                      { v: "public", label: "Public", icon: Eye, hint: "Anyone can find and join." },
                      { v: "tentative", label: "Ghost", icon: EyeOff, hint: "You appear busy but the event is blurred. Friends can knock to reveal." },
                    ] as const)
                ).map(({ v, label, icon: Icon }) => {
                  const active = singleVisibility === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { haptic("selection"); setSingleVisibility(v); }}
                      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground glow-sm"
                          : "bg-secondary/60 text-foreground ring-1 ring-border hover:ring-primary/40"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                <span className="text-foreground font-semibold">
                  {{ public: "Open", tentative: "Ghost", circle: "Circle", private: "List" }[singleVisibility]}
                </span>{" "}
                — {(isOrganizer
                  ? ({ public: "Anyone can find and join. For clubs, markets, community events.", private: "Only invitees see it." } as any)
                  : ({
                      circle: "Visible only to your mutual friends. Won't appear on the public feed.",
                      private: "Visible only to people you personally invite.",
                      public: "Anyone can find and join.",
                      tentative: "You appear busy but the event is blurred. Friends can knock to reveal.",
                    } as any))[singleVisibility]}
              </p>
            </SectionCard>

            {/* WHO SHOULD BE IN — merged invite picker */}
            {isOrganizer ? (
              <SectionCard icon={UserCheck} label="Invite followers">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Invite all followers</p>
                    <p className="text-[11px] text-muted-foreground">{followerIds.length} follower{followerIds.length === 1 ? "" : "s"} will be invited.</p>
                  </div>
                  <Switch checked={inviteAllFollowers} onCheckedChange={(v) => { haptic("selection"); setInviteAllFollowers(v); }} />
                </div>
              </SectionCard>
            ) : (
              <SectionCard icon={UsersIcon} label="Who should be in">
                <InviteFriendsInline value={singleInviteIds} onChange={setSingleInviteIds} label="" />
              </SectionCard>
            )}

            {/* CO-HOST */}
            <SectionCard icon={Users} label="Co-host" hint="optional">
              <InviteFriendsInline
                value={singleCoCreatorIds}
                onChange={setSingleCoCreatorIds}
                label=""
                searchOnly
                icon={Users}
              />
            </SectionCard>

            {/* BRING WHAT? — moved above RSVP */}
            {!isOrganizer && (
              <SectionCard icon={Package} label="Bring what?" hint={
                <Switch
                  checked={singleBringListEnabled}
                  onCheckedChange={(v) => { haptic("selection"); setSingleBringListEnabled(v); }}
                />
              }>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Let attendees claim items to bring (snacks, speaker, ball…)
                </p>
                {singleBringListEnabled && (
                  <BringListDraftEditor
                    items={singleBringListItems}
                    onChange={setSingleBringListItems}
                    vibe={singleDraft.vibeCategory}
                  />
                )}
              </SectionCard>
            )}

            {/* RSVP — matches event detail glass pill */}
            {!isOrganizer && (
              <SectionCard icon={Check} label="Your RSVP">
                <div className="bg-card dark:bg-white/[0.04] backdrop-blur-xl border border-border dark:border-white/10 rounded-full p-1.5 flex items-center shadow-sm dark:shadow-2xl">
                  <button
                    type="button"
                    onClick={() => { haptic("selection"); setSingleRsvp("interested"); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all active:scale-95 text-sm font-medium ${
                      singleRsvp === "interested"
                        ? "bg-primary/20 text-primary"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Maybe
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptic("selection"); setSingleRsvp("going"); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all active:scale-95 text-sm font-bold ${
                      singleRsvp === "going"
                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(124,58,237,0.45)]"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    I am in
                  </button>
                </div>
              </SectionCard>
            )}

            {/* CAPACITY & TICKETS (organizer) */}
            {isOrganizer && (
              <SectionCard icon={Tag} label="Capacity & tickets">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Capacity (optional)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="e.g. 120"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                  <p className="text-[10px] text-muted-foreground">Leave empty for unlimited</p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs font-semibold">Sell tickets</Label>
                    <p className="text-[10px] text-muted-foreground">Stripe checkout coming soon — price is saved for now</p>
                  </div>
                  <Switch checked={ticketEnabled} onCheckedChange={(v) => { haptic("selection"); setTicketEnabled(v); }} />
                </div>
                {ticketEnabled && (
                  <div className="flex gap-2">
                    <select
                      value={ticketCurrency}
                      onChange={(e) => setTicketCurrency(e.target.value)}
                      className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
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
                      placeholder="Price"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
              </SectionCard>
            )}
          </form>
        )}

        {/* Inline Create CTA (Manual / URL) — placed after the last card */}
        {bulkDrafts.length === 0 && activeTab !== "photo" && (activeTab === "manual" || !!singleDraft.name) && (() => {
          const missing = !singleDraft.name.trim()
            ? "Name your event"
            : !singleDraft.date
              ? "Add a date to create"
              : !singleDraft.city.trim()
                ? "Pick a city"
                : null;
          return (
            <div className="max-w-lg mx-auto mt-6 mb-[calc(env(safe-area-inset-bottom)+5rem)]">
              <Button
                type="submit"
                form="add-event-form"
                disabled={loading || !!missing}
                className={`w-full h-12 rounded-2xl text-sm font-bold ${
                  missing
                    ? "bg-secondary text-muted-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground glow-sm"
                }`}
              >
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : (missing ?? "Create event")}
              </Button>
            </div>
          );
        })()}
      </div>






      <CoverStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        initialEmoji={emojiCover.emoji}
        initialColor={emojiCover.color}
        onSave={(blob) => {
          setImageBlob(blob);
          setImagePreview(URL.createObjectURL(blob));
          setCoverMode("image");
        }}
      />

      {cropSrc && (
        <ImageCropper
          open={!!cropSrc}
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}

      {bulkCropSrc && (
        <ImageCropper
          open={!!bulkCropSrc}
          src={bulkCropSrc}
          onCancel={() => { setBulkCropDraftId(null); setBulkCropSrc(null); }}
          onConfirm={handleBulkCropConfirm}
        />
      )}

      <AlertDialog open={!!duplicatePrompt} onOpenChange={(o) => !o && setDuplicatePrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Friend already added this event
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-foreground font-medium">{duplicatePrompt?.creator}</span> already added{" "}
              <span className="text-foreground font-medium">"{duplicatePrompt?.name}"</span> on this date. Want to join
              their event instead of creating a duplicate?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Create my own</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (duplicatePrompt) navigate(`/event/${duplicatePrompt.id}`);
              }}
            >
              Join their event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AddEvent;
