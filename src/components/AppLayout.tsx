import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutGrid, User, Archive, Search } from "lucide-react";
import NotificationsBell from "@/components/NotificationsBell";
import Logo from "@/components/Logo";
import ExitPollPrompt from "@/components/ExitPollPrompt";
import SettingsMenu from "@/components/SettingsMenu";
import { useHaptics } from "@/hooks/useHaptics";
import { useFeedFilters } from "@/hooks/useFeedFilters";
import { useUnopenedBirthdayCards } from "@/hooks/useBirthdayCards";
import BirthdayCardReveal from "@/components/BirthdayCardReveal";
import SearchSheet from "@/components/SearchSheet";
import BottomNavBar from "@/components/BottomNavBar";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  // navigate not needed; SearchSheet handles search trigger
  const haptic = useHaptics();
  const { chromeHidden } = useFeedFilters();
  const tap = (to: string) => {
    if (location.pathname !== to) haptic("light");
  };

  // Birthday card reveal — fires once per session if there are unopened cards
  const { data: unopenedCards = [] } = useUnopenedBirthdayCards();
  const [revealDismissed, setRevealDismissed] = useState(false);
  const showReveal = !revealDismissed && unopenedCards.length > 0 && !["/auth", "/reset-password", "/onboarding"].includes(location.pathname);

  const [searchOpen, setSearchOpen] = useState(false);
  const goToSearch = () => {
    haptic("light");
    setSearchOpen(true);
  };

  // Filter moved into Discover tabs (no global filter button anymore)

  const hideUtilityIcons = ["/auth", "/reset-password"].includes(location.pathname);

  const bottomNavItems = [
    { to: "/", icon: LayoutGrid, label: "Feed" },
    { to: "/calendar", icon: CalendarDays, label: "Calendar" },
    { to: "/time-capsule", icon: Archive, label: "Capsule" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Top bar — fixed so pages can render full-bleed under it (and so it
          actually disappears when chromeHidden, instead of leaving a gap). */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 glass-strong transition-transform duration-300 ${
          chromeHidden ? "-translate-y-full pointer-events-none" : "translate-y-0"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container relative flex h-14 items-center gap-2">
          {/* Left: logo */}
          <Link to="/" className="flex items-center group shrink-0" aria-label="I am in — home">
            <Logo />
          </Link>

          {/* Desktop nav (centered) */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {bottomNavItems.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}>
                <Button
                  variant={location.pathname === to ? "secondary" : "ghost"}
                  size="sm"
                  className={`gap-1.5 hover:text-primary ${
                    location.pathname === to ? "text-primary glow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right: utility icons — Search · Bell · Filter (in this order, all matching the bell style) */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {!hideUtilityIcons && (
              <Button
                size="icon"
                variant="ghost"
                onClick={goToSearch}
                aria-label="Search"
                className="h-9 w-9 rounded-full text-foreground hover:text-foreground hover:bg-white/[0.06]"
              >
                <Search className="h-[18px] w-[18px]" />
              </Button>
            )}
            <NotificationsBell />
            {!hideUtilityIcons && <SettingsMenu />}
          </div>
        </div>
      </header>

      <main
        className="container md:pb-6 relative z-10"
        style={{
          paddingTop: chromeHidden
            ? "0px"
            : "calc(3.5rem + env(safe-area-inset-top))",
          paddingBottom: "0px",
        }}
      >
        {children}
      </main>

      {showReveal && (
        <BirthdayCardReveal
          cards={unopenedCards}
          onClose={() => setRevealDismissed(true)}
        />
      )}

      <SearchSheet open={searchOpen} onOpenChange={setSearchOpen} />






      {/* Bottom nav (mobile) — floating pill. Hidden on the Feed route ("/")
          because the feed renders a docked version inside its scroll
          container so cards can flow under it without a dead gap. */}
      {user && (
        <BottomNavBar hidden={chromeHidden} />
      )}

      {user && <ExitPollPrompt />}
    </div>
  );
};

export default AppLayout;
