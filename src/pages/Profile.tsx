import { useState, useEffect, useMemo, useRef } from "react";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import ImageCropper from "@/components/ImageCropper";
import CityAutocomplete from "@/components/CityAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FriendshipIntelligenceCard from "@/components/FriendshipIntelligenceCard";
import OrganizerDNACard from "@/components/OrganizerDNACard";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, UserMinus, Edit2, Save, Link2, Camera, LayoutGrid, CalendarDays, Users,
  ChevronLeft, ChevronRight, Lock, Clock, Check, X, ArrowUpDown, BadgeCheck, Plus,
} from "lucide-react";
import ProfileHighlights from "@/components/ProfileHighlights";
import FriendGhostCard from "@/components/FriendGhostCard";
import FriendshipReceiptCard from "@/components/FriendshipReceiptCard";
import IOSDateTimePicker from "@/components/IOSDateTimePicker";
import StatusSheet from "@/components/StatusSheet";
import StatusBadge, { STATUS_EMOJI, STATUS_LABEL } from "@/components/StatusBadge";
import { useMyStatus } from "@/hooks/useUserStatus";
import { useFriendStatuses } from "@/hooks/useFriendStatuses";
import { compressImage } from "@/lib/imageCompress";
import { copyToClipboard } from "@/lib/clipboard";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "@/lib/dateLocale";


import { useNavigate } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";
import { useAccountMode } from "@/hooks/useAccountMode";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import CreatorScoreBadge from "@/components/CreatorScoreBadge";
import { parseISO, isPast, endOfDay, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, addDays, addWeeks, startOfDay,  } from "date-fns";
import { format } from "@/lib/dateFormat";

type ViewMode = "calendar" | "feed" | "receipt";
type OwnTab = "events" | "dna";
type ListMode = "followers" | "following";

const parseCoverMetaSmall = (description: string | null | undefined) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};

const renderSmallCover = (event: { image_url: string | null; description: string | null; name: string }) => {
  if (event.image_url) {
    return <img src={event.image_url} alt={event.name} className="w-full h-full object-cover border-0 border-none" />;
  }
  const cover = parseCoverMetaSmall(event.description);
  if (cover) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-xl"
        style={{ background: `hsl(${cover.color})` }}
      >
        {cover.emoji}
      </div>
    );
  }
  return <div className="w-full h-full flex items-center justify-center text-base opacity-40">✦</div>;
};

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  
  const navigate = useNavigate();
  const haptic = useHaptics();
  const { mode: accountMode } = useAccountMode();

  const profileUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [birthday, setBirthday] = useState("");
  const [paypalHandle, setPaypalHandle] = useState("");
  const [revolutHandle, setRevolutHandle] = useState("");
  const [n26Handle, setN26Handle] = useState("");
  const [organizerInstagram, setOrganizerInstagram] = useState("");
  const [organizerWebsite, setOrganizerWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [listOpen, setListOpen] = useState<ListMode | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");
  const [calendarAnchor, setCalendarAnchor] = useState<Date>(new Date());
  const [ownTab, setOwnTab] = useState<OwnTab>("events");
  const [feedSortDir, setFeedSortDir] = useState<"desc" | "asc">("desc");
  const [availabilityInfo, setAvailabilityInfo] = useState<{ date: string; reason: string | null } | null>(null);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const { data: myStatus } = useMyStatus();
  const { data: friendStatusMap } = useFriendStatuses(profileUserId && !isOwnProfile ? [profileUserId] : []);
  const otherStatus = profileUserId && !isOwnProfile ? friendStatusMap?.[profileUserId] : null;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", profileUserId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", profileUserId!).single();
      if (error) throw error;
      // Birthday: own profile reads directly; viewing a friend uses get_friend_birthdays RPC.
      let bday: string | null = null;
      if (user && profileUserId === user.id) {
        const { data: bd } = await (supabase as any).from("user_birthdays").select("birthday").eq("user_id", user.id).maybeSingle();
        bday = bd?.birthday ?? null;
      } else if (user) {
        const { data: bd } = await (supabase as any).from("user_birthdays").select("birthday").eq("user_id", profileUserId!).maybeSingle();
        bday = bd?.birthday ?? null;
      }
      return { ...data, birthday: bday } as any;
    },
    enabled: !!profileUserId,
  });


  const { data: followCounts } = useQuery({
    queryKey: ["follow-counts", profileUserId],
    queryFn: async () => {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileUserId!),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileUserId!),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    },
    enabled: !!profileUserId,
  });

  // Friendship status (mutual follow OR pending request)
  const { data: friendStatus } = useQuery({
    queryKey: ["friend-status", user?.id, profileUserId],
    queryFn: async () => {
      if (!user || isOwnProfile) return { areFriends: false, pendingOutgoing: false, pendingIncoming: null as string | null };
      const [{ data: follows1 }, { data: follows2 }, { data: req }] = await Promise.all([
        supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", profileUserId!).maybeSingle(),
        supabase.from("follows").select("id").eq("follower_id", profileUserId!).eq("following_id", user.id).maybeSingle(),
        supabase.from("friend_requests" as any).select("id, requester_id, recipient_id, status")
          .or(`and(requester_id.eq.${user.id},recipient_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},recipient_id.eq.${user.id})`)
          .eq("status", "pending").maybeSingle(),
      ]);
      const areFriends = !!follows1 && !!follows2;
      const r = req as any;
      return {
        areFriends,
        pendingOutgoing: !!r && r.requester_id === user.id,
        pendingIncoming: r && r.recipient_id === user.id ? (r.id as string) : null,
      };
    },
    enabled: !!user?.id && !!profileUserId && !isOwnProfile,
  });

  // Venue / organizer profiles are public — anyone can see their events
  // without follow-back or friend approval.
  const isVenueProfile = (profile as any)?.account_type === "organizer";
  const canViewEvents = isOwnProfile || isVenueProfile || friendStatus?.areFriends;

  // Followers / following lists with profiles
  const { data: followersList = [] } = useQuery({
    queryKey: ["followers-list", profileUserId],
    queryFn: async () => {
      const { data: rows } = await supabase.from("follows").select("follower_id").eq("following_id", profileUserId!);
      const ids = (rows ?? []).map((r) => r.follower_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      return profiles ?? [];
    },
    enabled: !!profileUserId,
  });

  const { data: followingList = [] } = useQuery({
    queryKey: ["following-list", profileUserId],
    queryFn: async () => {
      const { data: rows } = await supabase.from("follows").select("following_id").eq("follower_id", profileUserId!);
      const ids = (rows ?? []).map((r) => r.following_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      return profiles ?? [];
    },
    enabled: !!profileUserId,
  });

  const { data: userEvents = [] } = useQuery({
    queryKey: ["user-events", profileUserId, isOwnProfile],
    queryFn: async () => {
      // Profile shows ONLY events the profile owner CREATED.
      // (Going/maybe events still appear on Feed and Calendar via their own
      // data sources, not on the profile.)
      const { data: createdEvents, error: ce } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", profileUserId!)
        .order("date", { ascending: true });
      if (ce) throw ce;

      const events = createdEvents ?? [];
      const eventIds = events.map((e) => e.id);
      const { data: attendees } = eventIds.length
        ? await supabase.from("attendees").select("*").in("event_id", eventIds)
        : { data: [] };
      const userIds = [...new Set([
        ...((attendees ?? []).map((a) => a.user_id)),
        ...events.map((e) => e.created_by),
      ])];
      const { data: attendeeProfiles } = userIds.length
        ? await supabase.from("profiles").select("*").in("user_id", userIds)
        : { data: [] };
      return events.map((e) => ({
        ...e,
        attendees: (attendees ?? [])
          .filter((a) => a.event_id === e.id)
          .map((a) => ({
            ...a,
            profile: attendeeProfiles?.find((p) => p.user_id === a.user_id) ?? null,
          })),
        creator_profile: attendeeProfiles?.find((p) => p.user_id === e.created_by) ?? profile ?? null,
      }));
    },
    enabled: !!profileUserId && !!canViewEvents,
  });


  // Friend's availability blocks (only when viewing someone else's calendar and they're a friend)
  const { data: friendBlocks = [] } = useQuery({
    queryKey: ["friend-availability-blocks", profileUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("availability_blocks" as any)
        .select("date, reason")
        .eq("user_id", profileUserId!);
      return ((data ?? []) as any[]).map((r) => ({ date: r.date as string, reason: (r.reason ?? null) as string | null }));
    },
    enabled: !!profileUserId && !isOwnProfile && !!canViewEvents,
  });
  const friendBlockByDate = useMemo(() => new Map(friendBlocks.map((b) => [b.date, b.reason] as const)), [friendBlocks]);
  const friendBlockedSet = useMemo(() => new Set(friendBlocks.map((b) => b.date)), [friendBlocks]);
  const visibleStatus = isOwnProfile ? myStatus : otherStatus;
  const profileStatusForDay = (day: Date) => {
    if (!visibleStatus || visibleStatus.status === "available") return null;
    const today = startOfDay(new Date());
    const dayStart = startOfDay(day);
    if (visibleStatus.status === "not_tonight") return isSameDay(dayStart, today) ? visibleStatus : null;
    if (visibleStatus.status === "low_energy") {
      const expires = visibleStatus.expires_at ? startOfDay(parseISO(visibleStatus.expires_at)) : today;
      return dayStart >= today && dayStart <= expires ? visibleStatus : null;
    }
    return null;
  };

  const sortedEvents = useMemo(() => {
    // "Added" tab semantics:
    //  - Own profile: events I created or RSVP'd to (full set).
    //  - Friend profile: only events the friend created (so the tab really
    //    reflects what THEY added). Their going/maybe events still show up
    //    on the Calendar tab via the unfiltered userEvents below.
    const scoped = isOwnProfile
      ? userEvents
      : userEvents.filter((e) => e.created_by === profileUserId);
    const upcoming = scoped.filter((e) => !e.date || !isPast(endOfDay(parseISO(e.date))));
    const past = scoped
      .filter((e) => e.date && isPast(endOfDay(parseISO(e.date))))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    upcoming.sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
    return [...upcoming, ...past];
  }, [userEvents, isOwnProfile, profileUserId]);

  // Reset view mode when switching between own/friend profiles
  useEffect(() => {
    setViewMode(isOwnProfile ? "feed" : "calendar");
  }, [isOwnProfile, profileUserId]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setCity((profile as any).city ?? "");
      setBirthday((profile as any).birthday ?? "");
      setOrganizerInstagram((profile as any).organizer_instagram ?? "");
      setOrganizerWebsite((profile as any).organizer_website ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  useEffect(() => {
    if (!profileUserId) return;
    (supabase as any)
      .from("user_payment_handles")
      .select("paypal_handle, revolut_handle, n26_handle")
      .eq("user_id", profileUserId)
      .maybeSingle()
      .then(({ data }: any) => {
        setPaypalHandle(data?.paypal_handle ?? "");
        setRevolutHandle(data?.revolut_handle ?? "");
        setN26Handle(data?.n26_handle ?? "");
      });
  }, [profileUserId]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input value so re-selecting the SAME file still triggers
    // onChange. Without this, picking the same photo after a failed upload
    // silently does nothing on every browser.
    setAvatarInputKey((k) => k + 1);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please pick an image file", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Image is too large", description: "Max 20 MB.", variant: "destructive" });
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      setCropSrc(url);
    } catch (err: any) {
      toast({ title: "Couldn't open that image", description: err?.message, variant: "destructive" });
    }
  };


  const handleAvatarCrop = async (blob: Blob) => {
    if (!user) return;
    setCropSrc(null);
    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(blob, { maxEdge: 1024, quality: 0.85 });
      const filePath = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, compressed, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(urlData.publicUrl);
      toast({ title: "Photo ready — hit save to apply" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const cleanUsername = username.trim();
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || null,
      username: cleanUsername ? cleanUsername : null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      city: city.trim() || null,
      // payment handles persisted separately below
      organizer_instagram: organizerInstagram.trim().replace(/^@/, "") || null,
      organizer_website: organizerWebsite.trim() || null,
    } as any).eq("user_id", user.id);
    if (error) {
      const msg = error.message.includes("profiles_username_key")
        ? "That username is already taken — try another."
        : error.message;
      toast({ title: "Couldn't save profile", description: msg, variant: "destructive" });
      return;
    }
    if (birthday) {
      await (supabase as any).from("user_birthdays").upsert({ user_id: user.id, birthday });
    } else {
      await (supabase as any).from("user_birthdays").delete().eq("user_id", user.id);
    }
    await (supabase as any).from("user_payment_handles").upsert({
      user_id: user.id,
      paypal_handle: paypalHandle.trim() || null,
      revolut_handle: revolutHandle.trim() || null,
      n26_handle: n26Handle.trim() || null,
    });
    toast({ title: "Profile updated!" });
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["profile", profileUserId] });
  };

  // Friend request actions
  const sendFriendRequest = async () => {
    if (!user || !profileUserId) return;
    haptic("medium");
    const { error } = await supabase.from("friend_requests" as any).insert({
      requester_id: user.id,
      recipient_id: profileUserId,
    });
    if (error) {
      toast({ title: "Couldn't send request", description: error.message, variant: "destructive" });
    } else {
      // Look up sender's name for the notification content
      const { data: me } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
      await supabase.from("notifications").insert({
        recipient_id: profileUserId,
        sender_id: user.id,
        type: "friend_request",
        content: `${me?.display_name ?? "Someone"} wants to be friends`,
      });
      toast({ title: "Friend request sent" });
      queryClient.invalidateQueries({ queryKey: ["friend-status"] });
    }
  };

  const respondFriendRequest = async (requestId: string, accept: boolean) => {
    haptic(accept ? "success" : "light");
    const { error } = await supabase.from("friend_requests" as any)
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", requestId);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: accept ? "You're now friends!" : "Request declined" });
      queryClient.invalidateQueries({ queryKey: ["friend-status"] });
      queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  };

  const removeFriend = async () => {
    if (!user || !profileUserId) return;
    haptic("warning");
    await Promise.all([
      supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileUserId),
      supabase.from("follows").delete().eq("follower_id", profileUserId).eq("following_id", user.id),
      supabase.from("friend_requests" as any).delete()
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},recipient_id.eq.${user.id})`),
    ]);
    queryClient.invalidateQueries({ queryKey: ["friend-status"] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    toast({ title: "Removed" });
  };

  const copyInviteLink = async () => {
    haptic("light");
    // Prefer a short, username-based URL when available; fall back to /profile/:userId
    const slug = (profile as any)?.username?.trim();
    const url = slug
      ? `${window.location.origin}/u/${slug}`
      : `${window.location.origin}/profile/${profileUserId}`;
    const name = profile?.display_name ?? "me";
    const blurb = isOwnProfile
      ? `Come hang on I am (IN) — see my events, save plans together. ✨`
      : `Check out ${name} on I am (IN) — events, plans, who's going. ✨`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        // Pass `url` separately and DON'T include it in `text` (some platforms
        // append the url again, causing it to appear twice).
        await (navigator as any).share({ title: "I am (IN)", text: blurb, url });
      } else {
        const ok = await copyToClipboard(`${blurb}\n${url}`);
        toast({ title: ok ? "Invite copied!" : "Couldn't copy", description: ok ? "Paste it anywhere — link is included." : undefined });
      }
    } catch {
      /* user cancelled */
    }
  };


  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [calendarMonth]);

  // Pull-to-refresh (must be before any early return to keep hook order stable)
  const scrollRef = useRef<HTMLDivElement>(null);
  const ptr = usePullToRefresh({
    containerRef: scrollRef,
    onRefresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", profileUserId] }),
        queryClient.invalidateQueries({ queryKey: ["user-events", profileUserId] }),
        queryClient.invalidateQueries({ queryKey: ["follow-counts", profileUserId] }),
        queryClient.invalidateQueries({ queryKey: ["friend-status"] }),
      ]);
    },
  });

  if (isLoading) {
    return <AppLayout><div className="max-w-2xl mx-auto space-y-4"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-6 w-48" /></div></AppLayout>;
  }

  const renderFriendButton = () => {
    if (isOwnProfile) return null;
    // Venue / organizer profiles are public — show a simple Follow / Following
    // toggle (one-way), no friend-request approval required.
    if (isVenueProfile) {
      const isFollowing = !!friendStatus?.areFriends || !!friendStatus?.pendingOutgoing;
      return (
        <Button
          size="sm"
          className={isFollowing ? "" : "glow-sm"}
          variant={isFollowing ? "outline" : "default"}
          onClick={async () => {
            if (!user || !profileUserId) return;
            haptic("light");
            if (isFollowing) {
              await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileUserId);
            } else {
              await supabase.from("follows").insert({ follower_id: user.id, following_id: profileUserId });
            }
            queryClient.invalidateQueries({ queryKey: ["friend-status"] });
            queryClient.invalidateQueries({ queryKey: ["follow-counts", profileUserId] });
          }}
        >
          {isFollowing ? <><Check className="h-3.5 w-3.5 mr-1" /> Following</> : <><UserPlus className="h-3.5 w-3.5 mr-1" /> Follow</>}
        </Button>
      );
    }
    if (friendStatus?.areFriends) {
      return (
        <Button size="sm" variant="outline" onClick={removeFriend}>
          <UserMinus className="h-3.5 w-3.5 mr-1" /> Friends
        </Button>
      );
    }
    if (friendStatus?.pendingIncoming) {
      return (
        <div className="flex gap-2">
          <Button size="sm" className="glow-sm" onClick={() => respondFriendRequest(friendStatus.pendingIncoming!, true)}>
            <Check className="h-3.5 w-3.5 mr-1" /> Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => respondFriendRequest(friendStatus.pendingIncoming!, false)}>
            <X className="h-3.5 w-3.5 mr-1" /> Decline
          </Button>
        </div>
      );
    }
    if (friendStatus?.pendingOutgoing) {
      return (
        <Button size="sm" variant="outline" disabled>
          <Clock className="h-3.5 w-3.5 mr-1" /> Requested
        </Button>
      );
    }
    return (
      <Button size="sm" className="glow-sm" onClick={sendFriendRequest}>
        <UserPlus className="h-3.5 w-3.5 mr-1" /> Add friend
      </Button>
    );
  };

  return (

    <AppLayout>
      <div ref={scrollRef} className="relative">
        <PullToRefreshIndicator {...ptr} />
        <div className="max-w-2xl mx-auto space-y-5 pt-3 pb-32 md:pb-6 px-4">

        {/* IG-style header */}
        <div className="relative px-1 pt-6 pb-2">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <Avatar className="h-24 w-24 ring-2 ring-primary/30">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-2xl" {...avatarFallbackProps(profile?.display_name ?? profile?.user_id)}>{profile?.display_name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              {!isOwnProfile && profileUserId && <StatusBadge userId={profileUserId} size="md" />}
              {/* IG-story-plus style edit pill on the avatar (own profile, not editing) */}
              {isOwnProfile && !editing && (
                <button
                  type="button"
                  onClick={() => { haptic("selection"); setEditing(true); }}
                  aria-label="Edit profile"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center shadow-lg hover:scale-105 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
              {editing && isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={() => { haptic("light"); document.getElementById("avatar-input")?.click(); }}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input key={avatarInputKey} id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                </>
              )}
            </div>
            {/* IG-style stats row */}
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold leading-none">{userEvents.length}</div>
                <div className="text-[11px] text-muted-foreground mt-1">events</div>
              </div>
              <button onClick={() => { haptic("light"); setListOpen("followers"); }} className="hover:text-primary transition-colors">
                <div className="text-lg font-bold leading-none">{followCounts?.followers ?? 0}</div>
                <div className="text-[11px] text-muted-foreground mt-1">followers</div>
              </button>
              <button onClick={() => { haptic("light"); setListOpen("following"); }} className="hover:text-primary transition-colors">
                <div className="text-lg font-bold leading-none">{followCounts?.following ?? 0}</div>
                <div className="text-[11px] text-muted-foreground mt-1">following</div>
              </button>
            </div>
          </div>

          {/* Name + bio under header */}
          {editing ? (
            <div className="space-y-2 mt-5">
              <Input placeholder={t("profile.display_name")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <Input placeholder={t("profile.username")} value={username} onChange={(e) => setUsername(e.target.value)} />
              <Textarea placeholder={t("profile.bio")} value={bio} onChange={(e) => setBio(e.target.value)} rows={2} />
              <CityAutocomplete value={city} onChange={setCity} placeholder={t("profile.city_placeholder")} />
              {accountMode === "organizer" ? (
                <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("profile.organizer_links")}</p>
                  <Input
                    placeholder={t("profile.instagram_placeholder")}
                    value={organizerInstagram}
                    onChange={(e) => setOrganizerInstagram(e.target.value)}
                  />
                  <Input
                    placeholder={t("profile.website_placeholder")}
                    value={organizerWebsite}
                    onChange={(e) => setOrganizerWebsite(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <IOSDateTimePicker
                    mode="date"
                    value={birthday}
                    onChange={setBirthday}
                    label="BIRTHDAY"
                    placeholder={t("profile.pick_birthday")}
                    min="1925-01-01"
                    max={new Date().toISOString().slice(0, 10)}
                  />
                  <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("profile.settle_handles")}</p>
                    <p className="text-[11px] text-muted-foreground -mt-1">{t("profile.settle_handles_help")}</p>
                    <Input placeholder={t("profile.paypal_placeholder")} value={paypalHandle} onChange={(e) => setPaypalHandle(e.target.value)} />
                    <Input placeholder={t("profile.revolut_placeholder")} value={revolutHandle} onChange={(e) => setRevolutHandle(e.target.value)} />
                    <Input placeholder={t("profile.n26_placeholder")} value={n26Handle} onChange={(e) => setN26Handle(e.target.value)} />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" /> {t("common.save")}</Button>
                <Button size="sm" variant="ghost" onClick={() => { haptic("light"); setEditing(false); setAvatarUrl(profile?.avatar_url ?? null); }}>{t("common.cancel")}</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold leading-tight">{profile?.display_name ?? "User"}</h2>
                  {/* Organizer badge intentionally hidden while commercial accounts are in private beta */}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      aria-label="Share profile"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                  )}
                  <CreatorScoreBadge userId={profile?.user_id} />
                </div>
                {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                {(profile as any)?.city && <p className="text-xs text-muted-foreground mt-1">📍 {(profile as any).city}</p>}
                {(isOwnProfile ? accountMode === "organizer" : (profile as any)?.account_type === "organizer") ? (
                  <>
                    {(profile as any)?.organizer_instagram && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <a
                          href={`https://instagram.com/${String((profile as any).organizer_instagram).replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          @{String((profile as any).organizer_instagram).replace(/^@/, "")}
                        </a>
                      </p>
                    )}
                    {(profile as any)?.organizer_website && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        <a
                          href={(profile as any).organizer_website.startsWith("http") ? (profile as any).organizer_website : `https://${(profile as any).organizer_website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          🌐 {(profile as any).organizer_website.replace(/^https?:\/\//, "")}
                        </a>
                      </p>
                    )}
                  </>
                ) : (
                  (profile as any)?.birthday && (
                    <p className="text-xs text-muted-foreground mt-0.5">🎂 {new Date((profile as any).birthday).toLocaleDateString(undefined, { day: "numeric", month: "long" })}</p>
                  )
                )}
                {profile?.bio && <p className="text-sm text-foreground/80 mt-2">{profile.bio}</p>}
                {/* Status pill */}
                {isOwnProfile ? (
                  <button
                    onClick={() => { haptic("light"); setStatusSheetOpen(true); }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary border border-border/60"
                  >
                    <span>{myStatus ? STATUS_EMOJI[myStatus.status] : "🟢"}</span>
                    <span className="font-medium">{myStatus ? STATUS_LABEL[myStatus.status] : t("profile.open_for_events", "Open for events")}</span>
                    <span className="text-xs text-muted-foreground ml-1">· change</span>
                  </button>

                ) : otherStatus && otherStatus.status !== "available" ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary/60 border border-border/60">
                    <span>{STATUS_EMOJI[otherStatus.status]}</span>
                    <span className="font-medium">{STATUS_LABEL[otherStatus.status]}</span>
                  </span>
                ) : null}
              </div>

              {/* Action buttons row — only the friend CTA when viewing someone else.
                  For own profile, Edit + Share moved to absolute top-right of the page header. */}
              {!isOwnProfile && (
                <div className="flex items-center gap-2 mt-5">
                  {renderFriendButton()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Highlights — Instagram-style circular rail of past events with photos */}
        {profileUserId && canViewEvents && (
          <ProfileHighlights profileUserId={profileUserId} canEdit={isOwnProfile} />
        )}

        {/* Locked state for non-friends */}
        {!canViewEvents ? (
          <div className="rounded-2xl card-surface p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary border border-border flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("profile.private_profile")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Add {profile?.display_name ?? "this person"} as a friend to see their events.
            </p>
          </div>
        ) : (
          <>
            {/* View toggle — only for friends viewing someone else's profile */}
            {!isOwnProfile && (
              <Tabs value={viewMode} onValueChange={(v) => { haptic("selection"); setViewMode(v as ViewMode); }}>
                <TabsList className="glass grid grid-cols-3 w-full gap-1 p-1">
                  <TabsTrigger value="calendar" className="text-xs gap-1.5 w-full">
                    <CalendarDays className="h-3.5 w-3.5" /> {t("profile.calendar")}
                  </TabsTrigger>
                  <TabsTrigger value="feed" className="text-xs gap-1.5 w-full">
                    <LayoutGrid className="h-3.5 w-3.5" /> {t("profile.added")}
                  </TabsTrigger>
                  <TabsTrigger value="receipt" className="text-xs gap-1.5 w-full">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t("profile.friendship")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Own-profile tabs: Events / DNA */}
            {isOwnProfile && (
              <Tabs value={ownTab} onValueChange={(v) => { haptic("selection"); setOwnTab(v as OwnTab); }}>
                <TabsList className="glass grid grid-cols-2 w-full gap-1 p-1">
                  <TabsTrigger value="events" className="text-xs gap-1.5 w-full">
                    <LayoutGrid className="h-3.5 w-3.5" /> {t("profile.events_tab", "Events")}
                  </TabsTrigger>
                  <TabsTrigger value="dna" className="text-xs gap-1.5 w-full">
                    <Sparkles className="h-3.5 w-3.5" /> {t("profile.dna_tab", "DNA")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {isOwnProfile && ownTab === "dna" ? (
              accountMode === "organizer" && user ? (
                <OrganizerDNACard organizerUserId={user.id} />
              ) : (
                <FriendshipIntelligenceCard />
              )

            ) : !isOwnProfile && viewMode === "receipt" && friendStatus?.areFriends && profileUserId ? (
              <FriendshipReceiptCard
                friendUserId={profileUserId}
                friendName={profile?.display_name ?? "Friend"}
                friendAvatar={profile?.avatar_url ?? null}
              />
            ) : (isOwnProfile || viewMode === "feed") ? (
              <div>
                {sortedEvents.length > 0 ? (
                  (() => {
                    const renderRow = (event: any) => {
                      const eventDate = event.date ? parseISO(event.date) : null;
                      const isGhost = (event as any).visibility === "tentative";
                      if (isGhost && !isOwnProfile) {
                        return <FriendGhostCard key={event.id} eventId={event.id} date={event.date} compact />;
                      }
                      return (
                        <Link key={event.id} to={`/event/${event.id}`} className="block">
                          <div className="flex items-center gap-4 rounded-2xl card-surface p-3 transition-all hover:border-primary/30">
                            {eventDate && (
                              <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                  {format(eventDate, "EEE", { locale: dateLocale })}
                                </span>
                                <span className="text-xl font-bold text-foreground leading-none mt-0.5">
                                  {format(eventDate, "dd", { locale: dateLocale })}
                                </span>
                              </div>
                            )}
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-secondary">
                              {renderSmallCover(event as any)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground truncate">{event.name}</h3>
                              {event.location && <p className="text-xs text-muted-foreground truncate">{event.location}</p>}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          </div>
                        </Link>
                      );
                    };

                    // Group by Year > Month, newest first (own profile + friend "Added" view)
                    const groups: Record<string, Record<string, any[]>> = {};
                    const noDate: any[] = [];
                    const sortedDesc = [...sortedEvents].sort((a, b) => {
                      const cmp = (a.date ?? "").localeCompare(b.date ?? "");
                      return feedSortDir === "desc" ? -cmp : cmp;
                    });
                    for (const ev of sortedDesc) {
                      if (!ev.date) { noDate.push(ev); continue; }
                      const d = parseISO(ev.date);
                      const y = format(d, "yyyy", { locale: dateLocale });
                      const m = format(d, "MMMM", { locale: dateLocale });
                      groups[y] = groups[y] || {};
                      groups[y][m] = groups[y][m] || [];
                      groups[y][m].push(ev);
                    }
                    const years = Object.keys(groups).sort((a, b) => feedSortDir === "desc" ? Number(b) - Number(a) : Number(a) - Number(b));
                    return (
                      <div className="space-y-6">
                        {years.map((y, yi) => (
                          <div key={y} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-bold text-foreground">{y}</h3>
                              {yi === 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    haptic("selection");
                                    setFeedSortDir((d) => (d === "desc" ? "asc" : "desc"));
                                  }}
                                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Toggle sort order"
                                >
                                  <ArrowUpDown className="h-3.5 w-3.5" />
                                  {feedSortDir === "desc" ? t("profile.newest_first") : t("profile.oldest_first")}
                                </button>
                              )}
                            </div>
                            {Object.keys(groups[y]).map((m) => (
                              <div key={m} className="space-y-2">
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m}</p>
                                {groups[y][m].map(renderRow)}
                              </div>
                            ))}
                          </div>
                        ))}
                        {noDate.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{t("profile.undated")}</p>
                            {noDate.map(renderRow)}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-12">{t("profile.no_events_yet")}</p>
                )}

              </div>
            ) : (
              <div className="space-y-4">
                {/* Month / Week / Day toggle */}
                <div className="flex items-center justify-between gap-2 rounded-full glass border border-border/50 p-1">
                  {(["month", "week", "day"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { haptic("selection"); setCalendarMode(m); }}
                      className={`flex-1 text-[11px] uppercase tracking-wider font-semibold py-1.5 rounded-full transition-colors ${
                        calendarMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`profile.cal_${m}`, m)}
                    </button>
                  ))}
                </div>

                {calendarMode === "week" ? (
                  (() => {
                    const wStart = startOfWeek(calendarAnchor, { weekStartsOn: 1 });
                    const wEnd = endOfWeek(calendarAnchor, { weekStartsOn: 1 });
                    const days = eachDayOfInterval({ start: wStart, end: wEnd });
                    return (
                      <div className="rounded-2xl card-surface p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); setCalendarAnchor((d) => addWeeks(d, -1)); }}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h3 className="text-sm font-bold">
                            {format(wStart, "MMM d", { locale: dateLocale })} – {format(wEnd, "MMM d", { locale: dateLocale })}
                          </h3>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); setCalendarAnchor((d) => addWeeks(d, 1)); }}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {days.map((day) => {
                            const dayEvents = userEvents.filter((e) => {
                              if (!e.date) return false;
                              const start = parseISO(e.date);
                              const endStr = (e as any).end_date as string | null | undefined;
                              const end = endStr ? parseISO(endStr) : start;
                              return day >= startOfDay(start) && day <= endOfDay(end);
                            });
                            return (
                              <div key={day.toISOString()} className="flex gap-3">
                                <div className="flex flex-col items-center min-w-[36px] pt-1">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                    {format(day, "EEE", { locale: dateLocale })}
                                  </span>
                                  <span className="text-lg font-bold leading-none mt-0.5">
                                    {format(day, "dd", { locale: dateLocale })}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  {dayEvents.length === 0 ? (
                                    !isOwnProfile && profileUserId ? (
                                      <Link
                                        to={`/add-event?mode=person&date=${format(day, "yyyy-MM-dd")}&invite=${profileUserId}`}
                                        className="flex items-center gap-2 h-9 rounded-lg border border-dashed border-primary/40 hover:border-primary/70 hover:bg-primary/5 transition-colors px-2.5 text-xs font-medium text-primary"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        {t("profile.empty_day_invite_cta", { defaultValue: "Invite to an event" })}
                                      </Link>
                                    ) : (
                                      <div className="h-9 rounded-lg border border-dashed border-border/40" />
                                    )
                                  ) : (
                                    dayEvents.map((e: any) => {
                                      const isGhost = e.visibility === "tentative";
                                      if (isGhost && !isOwnProfile) {
                                        return <FriendGhostCard key={e.id} eventId={e.id} date={e.date} compact />;
                                      }
                                      return (
                                        <Link key={e.id} to={`/event/${e.id}`} className="flex items-center gap-2 min-w-0 w-full rounded-lg card-surface px-2.5 py-2 hover:border-primary/40 transition-colors">
                                          <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 bg-secondary">
                                            {renderSmallCover(e)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{e.name}</p>
                                          </div>
                                        </Link>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : calendarMode === "day" ? (
                  (() => {
                    const dayEvents = userEvents.filter((e) => {
                      if (!e.date) return false;
                      const start = parseISO(e.date);
                      const endStr = (e as any).end_date as string | null | undefined;
                      const end = endStr ? parseISO(endStr) : start;
                      return calendarAnchor >= startOfDay(start) && calendarAnchor <= endOfDay(end);
                    });
                    return (
                      <div className="rounded-2xl card-surface p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); setCalendarAnchor((d) => addDays(d, -1)); }}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h3 className="text-sm font-bold">{format(calendarAnchor, "EEEE, MMM d", { locale: dateLocale })}</h3>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); setCalendarAnchor((d) => addDays(d, 1)); }}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        {dayEvents.length === 0 ? (
                          !isOwnProfile && profileUserId ? (
                            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center space-y-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {t("profile.empty_day_invite_title", { defaultValue: "Free that day" })}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t("profile.empty_day_invite_desc", { name: profile?.display_name ?? "them", defaultValue: `Plan something and bring ${profile?.display_name ?? "them"} along.` })}
                                </p>
                              </div>
                              <Link
                                to={`/add-event?mode=person&date=${format(calendarAnchor, "yyyy-MM-dd")}&invite=${profileUserId}`}
                                onClick={() => haptic("light")}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-[0_0_18px_hsl(var(--primary)/0.45)] hover:bg-primary/90 active:scale-95 transition-all"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                {t("profile.empty_day_invite_cta", { defaultValue: "Invite to an event" })}
                              </Link>
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm text-center py-6">{t("profile.no_events_day", "No events this day")}</p>
                          )
                        ) : (
                          <div className="space-y-2">
                            {dayEvents.map((e: any) => {
                              const isGhost = e.visibility === "tentative";
                              if (isGhost && !isOwnProfile) {
                                return <FriendGhostCard key={e.id} eventId={e.id} date={e.date} compact />;
                              }
                              return (
                                <Link key={e.id} to={`/event/${e.id}`} className="flex items-center gap-3 rounded-xl card-surface p-3 hover:border-primary/40 transition-colors">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-secondary">
                                    {renderSmallCover(e)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold truncate">{e.name}</h3>
                                    {e.location && <p className="text-xs text-muted-foreground truncate">{e.location}</p>}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                <>
                <div className="rounded-2xl card-surface p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); setCalendarMonth((d) => addMonths(d, -1)); }}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-sm font-bold">{format(calendarMonth, "MMMM yyyy", { locale: dateLocale })}</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); setCalendarMonth((d) => addMonths(d, 1)); }}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 mb-2">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                      <div key={d} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day, i) => {
                      const dayEvents = userEvents.filter((e) => {
                        if (!e.date) return false;
                        const start = parseISO(e.date);
                        const endStr = (e as any).end_date as string | null | undefined;
                        const end = endStr ? parseISO(endStr) : start;
                        return day >= startOfMonth(start) && day >= start && day <= end;
                      });
                      const inMonth = isSameMonth(day, calendarMonth);
                      // Classify each event for the profile owner: created/going = solid,
                      // interested (maybe) = outlined. Used to render distinct dots.
                      const classify = (e: any): "going" | "maybe" => {
                        if (e.created_by === profileUserId) return "going";
                        const my = (e.attendees ?? []).find((a: any) => a.user_id === profileUserId);
                        return my?.status === "interested" ? "maybe" : "going";
                      };
                      const goingCount = dayEvents.filter((e) => classify(e) === "going").length;
                      const maybeCount = dayEvents.filter((e) => classify(e) === "maybe").length;
                      const n = dayEvents.length;
                      const dotPx = n === 0 ? 0 : Math.min(5 + n * 2, 12);
                      const dateKey = format(day, "yyyy-MM-dd", { locale: dateLocale });
                      const blockReason = friendBlockByDate.get(dateKey) ?? null;
                      const blocked = friendBlockedSet.has(dateKey);
                      const dayStatus = profileStatusForDay(day);
                      const statusBlocked = !!dayStatus && dayStatus.status !== "available";
                      const stripeStyle: React.CSSProperties = blocked
                        ? {
                            backgroundImage:
                              "repeating-linear-gradient(0deg, hsl(var(--muted-foreground) / 0.35) 0px, hsl(var(--muted-foreground) / 0.35) 2px, transparent 2px, transparent 6px)",
                          }
                        : statusBlocked
                          ? {
                              backgroundColor: "hsl(var(--muted) / 0.35)",
                              filter: "grayscale(0.45)",
                            }
                        : {};
                      const firstNonGhost = dayEvents.find((e: any) => e.visibility !== "tentative" || isOwnProfile);
                      const linkTarget = firstNonGhost ? `/event/${firstNonGhost.id}` : "#";
                      const clickable = !!firstNonGhost;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (blocked || statusBlocked) {
                              haptic("light");
                              setAvailabilityInfo({
                                date: dateKey,
                                reason: blocked ? blockReason : STATUS_LABEL[dayStatus!.status],
                              });
                            } else if (clickable) {
                              navigate(linkTarget);
                            }
                          }}
                          aria-label={blocked || statusBlocked ? `${format(day, "MMM d", { locale: dateLocale })} — ${blocked ? "unavailable" : STATUS_LABEL[dayStatus!.status]}` : undefined}
                          title={blocked ? (blockReason || "Unavailable") : dayStatus ? STATUS_LABEL[dayStatus.status] : undefined}
                          className={`relative flex flex-col items-center justify-center py-2 rounded-lg transition-all overflow-hidden ${
                            inMonth ? (blocked || statusBlocked ? "text-muted-foreground" : "text-foreground hover:bg-secondary") : "text-muted-foreground/30"
                          } ${!blocked && !statusBlocked && !clickable ? "pointer-events-none" : ""}`}
                          style={stripeStyle}
                        >
                          <span className="text-xs font-medium relative z-10">{format(day, "d", { locale: dateLocale })}</span>
                          {dayStatus && <span className="absolute top-0 right-0.5 text-[10px] leading-none z-10">{STATUS_EMOJI[dayStatus.status]}</span>}
                          {n > 0 && !blocked && (
                            <div className="mt-0.5 flex items-center gap-0.5 relative z-10">
                              {goingCount > 0 && (
                                <div
                                  className="rounded-full bg-primary"
                                  style={{ width: dotPx, height: dotPx }}
                                />
                              )}
                              {maybeCount > 0 && (
                                <div
                                  className="rounded-full border border-primary bg-transparent"
                                  style={{ width: dotPx, height: dotPx }}
                                />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {friendBlocks.length > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(0deg, hsl(var(--muted-foreground) / 0.5) 0px, hsl(var(--muted-foreground) / 0.5) 2px, transparent 2px, transparent 6px)",
                        }}
                      />
                      <span>{t("profile.unavailable")}</span>
                    </div>
                  )}
                </div>
                {(() => {
                  const monthEvents = userEvents
                    .filter((e) => e.date && isSameMonth(parseISO(e.date), calendarMonth))
                    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
                  if (monthEvents.length === 0) {
                    return <p className="text-muted-foreground text-sm text-center py-8">{t("profile.no_events_month")}</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {monthEvents.map((event) => {
                        const eventDate = parseISO(event.date!);
                        const isGhost = (event as any).visibility === "tentative";
                        if (isGhost && !isOwnProfile) {
                          return (
                            <FriendGhostCard key={event.id} eventId={event.id} date={event.date} compact />
                          );
                        }
                        return (
                          <Link key={event.id} to={`/event/${event.id}`} className="block">
                            <div className="flex items-center gap-4 rounded-2xl card-surface p-3 transition-all hover:border-primary/30">
                              <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                  {format(eventDate, "MMM", { locale: dateLocale })}
                                </span>
                                <span className="text-xl font-bold text-foreground leading-none mt-0.5">
                                  {format(eventDate, "dd", { locale: dateLocale })}
                                </span>
                              </div>
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-secondary">
                                {renderSmallCover(event as any)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-foreground truncate">{event.name}</h3>
                                {event.location && <p className="text-xs text-muted-foreground truncate">{event.location}</p>}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })()}
                </>
                )}
              </div>
            )}
          </>
        )}

        </div>
      </div>

      {cropSrc && (
        <ImageCropper
          open={!!cropSrc}
          src={cropSrc}
          aspect={1}
          onCancel={() => setCropSrc(null)}
          onConfirm={(blob) => handleAvatarCrop(blob)}
        />
      )}

      {/* Followers / Following — bottom sheet */}
      <Sheet open={!!listOpen} onOpenChange={(o) => { if (!o) { setListOpen(null); setListSearch(""); } }}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 capitalize">
              <Users className="h-4 w-4" /> {listOpen} ({(listOpen === "followers" ? followersList : followingList).length})
            </SheetTitle>
          </SheetHeader>
          {(() => {
            const list = listOpen === "followers" ? followersList : followingList;
            const q = listSearch.trim().toLowerCase();
            const filtered = q
              ? list.filter((f: any) =>
                  (f.display_name ?? "").toLowerCase().includes(q) ||
                  (f.username ?? "").toLowerCase().includes(q),
                )
              : list;
            return (
              <>
                {list.length > 0 && (
                  <Input
                    autoFocus={false}
                    placeholder="Search by name or @username"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    className="h-9 text-sm mt-3"
                  />
                )}
                <div className="flex-1 overflow-y-auto space-y-1 mt-3 pb-4">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">{t("profile.nothing_to_show")}</p>
                  ) : filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No one matches "{listSearch}"</p>
                  ) : (
                    filtered.map((f: any) => (
                      <Link
                        key={f.id}
                        to={`/profile/${f.user_id}`}
                        onClick={() => { setListOpen(null); setListSearch(""); }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={f.avatar_url ?? undefined} />
                          <AvatarFallback {...avatarFallbackProps(f.display_name ?? f.user_id)}>{f.display_name?.[0] ?? "?"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{f.display_name ?? "User"}</p>
                          {f.username && <p className="text-xs text-muted-foreground truncate">@{f.username}</p>}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <Dialog open={!!availabilityInfo} onOpenChange={(o) => !o && setAvailabilityInfo(null)}>
        <DialogContent className="w-[300px] max-w-[90vw] rounded-3xl text-center sm:max-w-[300px]">
          <div className="text-5xl mt-2" aria-hidden>🚫</div>
          <DialogHeader>
            <DialogTitle className="text-center">
              Unavailable on {availabilityInfo ? format(parseISO(availabilityInfo.date), "MMM d", { locale: dateLocale }) : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center px-2 pb-2">
            {availabilityInfo?.reason?.trim() || "No reason added."}
          </p>
        </DialogContent>
      </Dialog>
      <StatusSheet open={statusSheetOpen} onOpenChange={setStatusSheetOpen} />
    </AppLayout>
  );
};

export default Profile;
