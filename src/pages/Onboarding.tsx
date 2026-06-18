import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Mic, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import Logo from "@/components/Logo";
import IOSDateTimePicker from "@/components/IOSDateTimePicker";

type Phase =
  | "name"
  | "birthday"
  | "handles"
  | "org_handles"
  | "org_stripe"
  | "choose";

const stripAt = (s: string) => s.trim().replace(/^@+/, "");

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const haptic = useHaptics();
  const [phase, setPhase] = useState<Phase>("name");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [birthday, setBirthday] = useState("");
  const [paypal, setPaypal] = useState("");
  const [revolut, setRevolut] = useState("");
  const [n26, setN26] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  // If the user picked a type on Welcome, skip the chooser step.
  const preselectedKind: "person" | "organizer" | null = (() => {
    try {
      const v = sessionStorage.getItem("iamin.account_kind");
      return v === "person" || v === "organizer" ? v : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (!loading && !user) navigate("/welcome", { replace: true });
  }, [user, loading, navigate]);

  // Prefill from existing profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, organizer_instagram, organizer_website")
        .eq("user_id", user.id)
        .maybeSingle();
      const d = data as any;
      if (d?.display_name) setDisplayName(d.display_name);
      if (d?.username) setUsername(d.username);
      if (d?.organizer_instagram) setInstagram(stripAt(d.organizer_instagram));
      if (d?.organizer_website) setWebsite(d.organizer_website);
      const { data: handles } = await (supabase as any)
        .from("user_payment_handles")
        .select("paypal_handle, revolut_handle, n26_handle")
        .eq("user_id", user.id)
        .maybeSingle();
      if (handles?.paypal_handle) setPaypal(stripAt(handles.paypal_handle));
      if (handles?.revolut_handle) setRevolut(stripAt(handles.revolut_handle));
      if (handles?.n26_handle) setN26(stripAt(handles.n26_handle));
    })();
  }, [user]);

  if (!user) return null;

  const continueFromName = async () => {
    const trimmed = displayName.trim();
    const handle = stripAt(username).toLowerCase();
    if (trimmed.length < 2) {
      toast({ title: t("onboarding.name_required_title"), description: t("onboarding.name_required_desc") });
      return;
    }
    if (handle.length < 3 || !/^[a-z0-9_.]+$/.test(handle)) {
      setUsernameError("3+ letters, numbers, _ or .");
      return;
    }
    setUsernameError(null);
    haptic("selection");
    // Check uniqueness
    const { data: taken } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", handle)
      .neq("user_id", user.id)
      .maybeSingle();
    if (taken) {
      setUsernameError("That handle is taken");
      haptic("error");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed, username: handle } as any)
      .eq("user_id", user.id);
    if (error) {
      setUsernameError(error.message);
      return;
    }
    // Branch by preselected kind: organizers skip birthday + payment handles.
    if (preselectedKind === "organizer") {
      setPhase("org_handles");
    } else {
      setPhase("birthday");
    }
  };

  const continueFromBirthday = async () => {
    if (!birthday) {
      toast({ title: t("onboarding.birthday_required_title"), description: t("onboarding.birthday_required_desc") });
      return;
    }
    haptic("selection");
    await (supabase as any).from("user_birthdays").upsert({ user_id: user.id, birthday });
    setPhase("handles");
  };

  const continueFromHandles = async () => {
    haptic("selection");
    await (supabase as any).from("user_payment_handles").upsert({
      user_id: user.id,
      paypal_handle: stripAt(paypal) ? stripAt(paypal) : null,
      revolut_handle: stripAt(revolut) ? stripAt(revolut) : null,
      n26_handle: stripAt(n26) ? stripAt(n26) : null,
    });
    if (preselectedKind) {
      await finishAs(preselectedKind);
    } else {
      setPhase("choose");
    }
  };

  const continueFromOrgHandles = async () => {
    haptic("selection");
    const patch: Record<string, string | null> = {
      organizer_instagram: stripAt(instagram) ? stripAt(instagram) : null,
      organizer_website: website.trim() ? website.trim() : null,
    };
    await supabase.from("profiles").update(patch as any).eq("user_id", user.id);
    setPhase("org_stripe");
  };

  const finishAs = async (mode: "person" | "organizer") => {
    haptic("success");
    setSaving(true);
    await (supabase as any).rpc("set_account_mode", { _mode: mode });
    await supabase.from("user_preferences" as any).upsert({ user_id: user.id, onboarded: true } as any, { onConflict: "user_id" });
    try { sessionStorage.removeItem("iamin.account_kind"); } catch { /* ignore */ }
    setSaving(false);
    navigate(mode === "organizer" ? "/organizer" : "/", { replace: true });
  };

  // ─────────────────────────── NAME ───────────────────────────
  if (phase === "name") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pt-10 pb-10">
        <div className="text-center">
          <Logo size="text-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full"
        >
          <div className="text-7xl mb-6 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">👋</div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            {preselectedKind === "organizer" ? t("onboarding.name_title_organizer") : t("onboarding.name_title_person")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {preselectedKind === "organizer" ? t("onboarding.name_desc_organizer") : t("onboarding.name_desc_person")}
          </p>

          <div className="mt-8 w-full space-y-2.5 text-left">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold px-1">
                Display name
              </label>
              <Input
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={preselectedKind === "organizer" ? t("onboarding.name_placeholder_organizer") : t("onboarding.name_placeholder_person")}
                className="mt-1.5 h-12 text-base"
                maxLength={40}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold px-1">
                Handle
              </label>
              <div className="mt-1.5 flex items-center gap-1 rounded-lg border border-input bg-background h-12 px-3 focus-within:ring-2 focus-within:ring-ring">
                <span className="text-muted-foreground text-base">@</span>
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(stripAt(e.target.value).toLowerCase().replace(/[^a-z0-9_.]/g, ""));
                    if (usernameError) setUsernameError(null);
                  }}
                  placeholder="yourhandle"
                  className="border-0 bg-transparent h-10 px-1 text-base focus-visible:ring-0"
                  maxLength={24}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              {usernameError ? (
                <p className="text-[11px] text-destructive mt-1 px-1">{usernameError}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1 px-1">
                  Lowercase letters, numbers, _ or .
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-sm h-20 flex flex-col items-stretch gap-2">
          <Button
            onClick={continueFromName}
            className="w-full h-12 glow-sm text-base"
            disabled={displayName.trim().length < 2 || stripAt(username).length < 3}
          >
            {t("onboarding.continue")}
          </Button>
          <div className="h-5" aria-hidden />
        </div>
      </div>
    );
  }


  // ─────────────────────────── BIRTHDAY ───────────────────────────
  if (phase === "birthday") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pt-10 pb-10">
        <div className="text-center">
          <Logo size="text-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full"
        >
          <div className="text-7xl mb-6 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">🎂</div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{t("onboarding.birthday_title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t("onboarding.birthday_desc")}
          </p>

          <div className="mt-8 w-full">
            <IOSDateTimePicker
              mode="date"
              value={birthday}
              onChange={setBirthday}
              label={t("onboarding.birthday_label")}
              placeholder={t("onboarding.birthday_placeholder")}
              min="1925-01-01"
              max={new Date().toISOString().slice(0, 10)}
              initialDraft="1995-06-15"
            />
          </div>
        </motion.div>

        <div className="w-full max-w-sm h-20 flex flex-col items-stretch gap-2">
          <Button onClick={continueFromBirthday} className="w-full h-12 glow-sm text-base" disabled={!birthday}>
            {t("onboarding.continue")}
          </Button>
          <button
            type="button"
            onClick={() => { haptic("light"); setPhase("handles"); }}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {t("onboarding.skip_for_now")}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────── HANDLES (person) ───────────────────────────
  if (phase === "handles") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pt-10 pb-10">
        <div className="text-center">
          <Logo size="text-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full"
        >
          <div className="text-7xl mb-6 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">💸</div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{t("onboarding.handles_title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t("onboarding.handles_desc")}
          </p>

          <div className="mt-6 w-full space-y-2.5 text-left">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-12">
              <span className="text-xs font-semibold text-muted-foreground w-16">PayPal</span>
              <span className="text-muted-foreground">@</span>
              <Input
                value={paypal}
                onChange={(e) => setPaypal(stripAt(e.target.value))}
                placeholder="yourname"
                className="border-0 bg-transparent h-10 px-1 focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-12">
              <span className="text-xs font-semibold text-muted-foreground w-16">Revolut</span>
              <span className="text-muted-foreground">@</span>
              <Input
                value={revolut}
                onChange={(e) => setRevolut(stripAt(e.target.value))}
                placeholder="yourname"
                className="border-0 bg-transparent h-10 px-1 focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-12">
              <span className="text-xs font-semibold text-muted-foreground w-16">N26</span>
              <span className="text-muted-foreground">@</span>
              <Input
                value={n26}
                onChange={(e) => setN26(stripAt(e.target.value))}
                placeholder="yourname"
                className="border-0 bg-transparent h-10 px-1 focus-visible:ring-0"
              />
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-sm h-20 flex flex-col items-stretch gap-2">
          <Button onClick={continueFromHandles} className="w-full h-12 glow-sm text-base" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("onboarding.continue")}
          </Button>
          <button
            type="button"
            onClick={async () => {
              haptic("light");
              if (preselectedKind) await finishAs(preselectedKind);
              else setPhase("choose");
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {t("onboarding.skip_for_now")}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────── ORG HANDLES ───────────────────────────
  if (phase === "org_handles") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pt-10 pb-10">
        <div className="text-center">
          <Logo size="text-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full"
        >
          <div className="text-7xl mb-6 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">🔗</div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{t("onboarding.org_handles_title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t("onboarding.org_handles_desc")}
          </p>

          <div className="mt-6 w-full space-y-2.5 text-left">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-12">
              <span className="text-xs font-semibold text-muted-foreground w-20">Instagram</span>
              <span className="text-muted-foreground">@</span>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(stripAt(e.target.value))}
                placeholder="yourbrand"
                className="border-0 bg-transparent h-10 px-1 focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-12">
              <span className="text-xs font-semibold text-muted-foreground w-20">Website</span>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yoursite.com"
                className="border-0 bg-transparent h-10 px-1 focus-visible:ring-0"
                inputMode="url"
              />
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-sm h-20 flex flex-col items-stretch gap-2">
          <Button onClick={continueFromOrgHandles} className="w-full h-12 glow-sm text-base" disabled={saving}>
            {t("onboarding.continue")}
          </Button>
          <button
            type="button"
            onClick={() => { haptic("light"); setPhase("org_stripe"); }}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {t("onboarding.skip_for_now")}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────── ORG STRIPE ───────────────────────────
  if (phase === "org_stripe") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pt-10 pb-10">
        <div className="text-center">
          <Logo size="text-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full"
        >
          <div className="text-7xl mb-6 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">💳</div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{t("onboarding.org_stripe_title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t("onboarding.org_stripe_desc")}
          </p>
        </motion.div>

        <div className="w-full max-w-sm h-20 flex flex-col items-stretch gap-2">
          <Button
            onClick={() => {
              haptic("light");
              toast({ title: t("onboarding.coming_soon_title"), description: t("onboarding.coming_soon_desc") });
            }}
            className="w-full h-12 glow-sm text-base"
            disabled={saving}
          >
            {t("onboarding.connect_stripe")}
          </Button>
          <button
            type="button"
            onClick={() => finishAs("organizer")}
            disabled={saving}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {saving ? "…" : t("onboarding.skip_for_now")}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────── CHOOSE ACCOUNT (fallback) ─────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Logo size="text-3xl" />
          <p className="text-sm text-muted-foreground">{t("onboarding.choose_how")}</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => finishAs("person")}
            disabled={saving}
            className="w-full text-left rounded-2xl card-surface p-5 transition-all hover:border-primary/40 active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{t("welcome.person_label")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("welcome.person_desc")}
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => finishAs("organizer")}
            disabled={saving}
            className="w-full text-left rounded-2xl card-surface p-5 transition-all hover:border-accent/40 active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                <Mic className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{t("welcome.organizer_label")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("welcome.organizer_desc")}
                </p>
              </div>
            </div>
          </button>

          {saving && (
            <div className="flex items-center justify-center text-xs text-muted-foreground pt-2">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Saving…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
