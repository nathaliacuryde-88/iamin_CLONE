import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { setLanguage, type SupportedLanguage } from "@/lib/i18n";
import { LogOut, Sun, Moon, Loader2, Settings as SettingsIcon, Users as UsersIcon, Mic, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type ProfileLite = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
};

const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) => (
  <div className="flex items-center rounded-full bg-foreground/[0.06] dark:bg-white/[0.04] p-1">
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-sm font-medium transition-all",
            active
              ? "bg-background text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      );
    })}
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2 px-1">
    {children}
  </p>
);

const SettingsMenu = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const haptic = useHaptics();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [activeMode, setActiveMode] = useState<"person" | "organizer">("person");
  const [profile, setProfile] = useState<ProfileLite | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("profiles")
        .select("display_name, username, avatar_url, city")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("user_preferences" as any).select("active_mode, language").eq("user_id", user.id).maybeSingle(),
    ]).then(([prof, prefs]) => {
      setProfile((prof.data as any) ?? null);
      const m = (prefs.data as any)?.active_mode ?? "person";
      const lng = (prefs.data as any)?.language as SupportedLanguage | undefined;
      setActiveMode(m);
      if (lng && lng !== i18n.language) setLanguage(lng);
    });
  }, [user, i18n.language]);

  const changeLang = async (lng: SupportedLanguage) => {
    haptic("selection");
    setLanguage(lng);
    if (user) {
      await supabase
        .from("user_preferences" as any)
        .upsert({ user_id: user.id, language: lng } as any, { onConflict: "user_id" });
    }
  };

  const switchMode = async (next: "person" | "organizer") => {
    if (!user || next === activeMode) return;
    haptic("selection");
    const prev = activeMode;
    setActiveMode(next);
    const { error } = await (supabase as any).rpc("set_account_mode", { _mode: next });
    if (error) {
      setActiveMode(prev);
      haptic("error");
      toast.error(error.message ?? t("settings.mode_switch_error"));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["account-mode", user.id] });
    setOpen(false);
    if (next === "organizer") navigate("/organizer");
    else navigate("/");
  };

  const handleLogout = async () => {
    haptic("warning");
    await supabase.auth.signOut();
    try { sessionStorage.removeItem("iamin.welcome_seen"); } catch { /* ignore */ }
    navigate("/welcome");
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast.error(t("settings.delete_type_to_confirm"));
      haptic("error");
      return;
    }
    setDeleting(true);
    haptic("warning");
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      haptic("success");
      toast.success(t("settings.delete_success"));
      await supabase.auth.signOut();
      try { sessionStorage.removeItem("iamin.welcome_seen"); } catch { /* ignore */ }
      navigate("/welcome");
    } catch (e) {
      haptic("error");
      toast.error(e instanceof Error ? e.message : t("settings.delete_error"));
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmText("");
    }
  };

  const displayName = profile?.display_name ?? "—";
  const username = profile?.username ?? "";
  const city = profile?.city ?? "";
  const lang: SupportedLanguage = (i18n.language?.startsWith("de") ? "de" : "en");

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => { setOpen(o); if (o) haptic("light"); }}>
        <DrawerTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label={t("settings.title")}
            className="h-9 w-9 rounded-full text-foreground hover:text-foreground hover:bg-white/[0.06]"
          >
            <SettingsIcon className="h-[18px] w-[18px]" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] max-h-[92vh]">
          <DrawerTitle className="text-2xl font-bold mt-2 mb-5">{t("settings.title")}</DrawerTitle>

          {/* Profile header */}
          <button
            type="button"
            onClick={() => { setOpen(false); navigate("/profile"); }}
            className="flex items-center gap-3 w-full p-2 -mx-1 rounded-2xl hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04] transition-colors mb-6"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {displayName[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-base font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {username ? `@${username}` : ""}{username && city ? " · " : ""}{city}
              </p>
            </div>
            <span className="text-[11px] font-medium text-primary px-3 py-1 rounded-full border border-primary/40">
              {activeMode === "organizer" ? t("settings.mode_organizer") : t("settings.mode_person")}
            </span>
          </button>

          {/* Appearance */}
          <div className="mb-5">
            <SectionLabel>{t("settings.appearance")}</SectionLabel>
            <Segmented
              value={theme}
              onChange={(v) => { haptic("light"); setTheme(v); }}
              options={[
                { value: "dark", label: t("settings.theme_dark_short"), icon: <Moon className="h-4 w-4" /> },
                { value: "light", label: t("settings.theme_light_short"), icon: <Sun className="h-4 w-4" /> },
              ]}
            />
          </div>

          {/* Language */}
          <div className="mb-5">
            <SectionLabel>{t("settings.language")}</SectionLabel>
            <Segmented
              value={lang}
              onChange={(v) => changeLang(v)}
              options={[
                { value: "en", label: t("settings.language_en") },
                { value: "de", label: t("settings.language_de") },
              ]}
            />
          </div>

          {/* Mode (admin only) */}
          {isAdmin && (
            <div className="mb-6">
              <SectionLabel>{t("settings.mode")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {([
                  {
                    key: "person" as const,
                    label: t("settings.mode_person"),
                    desc: t("settings.mode_person_desc"),
                    icon: <UsersIcon className="h-4 w-4" />,
                  },
                  {
                    key: "organizer" as const,
                    label: t("settings.mode_organizer"),
                    desc: t("settings.mode_organizer_desc"),
                    icon: <Mic className="h-4 w-4" />,
                  },
                ]).map((m) => {
                  const active = activeMode === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => switchMode(m.key)}
                      className={cn(
                        "relative text-left rounded-2xl p-3 border transition-all",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-foreground/[0.03] dark:bg-white/[0.03] hover:border-border",
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center mb-2",
                        active ? "bg-primary text-primary-foreground" : "bg-foreground/[0.06] dark:bg-white/[0.06] text-foreground",
                      )}>
                        {m.icon}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{m.desc}</p>
                      <span className={cn(
                        "absolute top-2.5 right-2.5 h-4 w-4 rounded-full flex items-center justify-center",
                        active ? "bg-primary text-primary-foreground" : "border border-border/70",
                      )}>
                        {active && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-2 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl justify-center gap-2 text-foreground border-border/60 bg-transparent hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04]"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> {t("settings.logout")}
            </Button>
            <button
              type="button"
              onClick={() => { haptic("warning"); setConfirmOpen(true); }}
              className="w-full mt-3 py-2 text-xs text-muted-foreground hover:text-destructive active:text-destructive transition-colors"
            >
              {t("settings.delete_account_quiet")}
            </button>

            {/* Made-by + tip jar */}
            <div className="mt-5 pt-4 border-t border-border/40 text-center">
              <p className="text-[11px] leading-relaxed">
                <span className="font-bold text-foreground">I am (IN) 1.0</span>
                <br />
                <span className="font-normal text-muted-foreground">
                  made with <span className="text-primary">💜</span> by Nathalia Cury in Stuttgart
                </span>
                <br />
                <a
                  href="https://www.paypal.me/NATHALIACURY88"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => haptic("light")}
                  className="text-primary underline font-medium"
                >
                  Buy me a coffee
                </a>
              </p>
            </div>
          </div>

        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (!o) setConfirmText(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.delete_dialog_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.delete_dialog_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
            disabled={deleting}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
              disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("settings.delete_dialog_action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsMenu;
