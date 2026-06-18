import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, MapPin, Plus, BarChart3, User } from "lucide-react";
import NotificationsBell from "@/components/NotificationsBell";
import Logo from "@/components/Logo";
import SettingsMenu from "@/components/SettingsMenu";
import { useHaptics } from "@/hooks/useHaptics";

const OrganizerLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const haptic = useHaptics();

  const tap = (to: string) => {
    if (location.pathname !== to) haptic("light");
  };

  const items: { to: string; icon: typeof LayoutGrid; label: string }[] = [
    { to: "/organizer", icon: LayoutGrid, label: "Dashboard" },
    { to: "/organizer/city", icon: MapPin, label: "City" },
    { to: "/organizer/pulse", icon: BarChart3, label: "Metrics" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (to: string) =>
    to === "/organizer" ? location.pathname === "/organizer" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <header
        className="sticky top-0 z-50 glass-strong"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container relative flex h-14 items-center gap-2">
          <Link to="/organizer" className="flex items-center group shrink-0" aria-label="I am in — organizer home">
            <Logo />
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider">
              Organizer
            </span>
          </Link>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <NotificationsBell />
            <SettingsMenu />
          </div>
        </div>
      </header>

      <main className="container pt-0 pb-32 md:pb-6 relative z-10">{children}</main>

      <nav
        className="fixed left-4 right-4 z-50 flex justify-center"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="relative w-full max-w-md">
          <div className="relative h-16 rounded-full bg-card/60 backdrop-blur-xl backdrop-saturate-150 border border-border/60 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.35)] overflow-visible">
            <svg
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ top: "-1px", color: "hsl(var(--card) / 0.6)" }}
              width="84" height="28" viewBox="0 0 84 28" fill="none" preserveAspectRatio="none"
            >
              <path
                d="M0 0 H20 C28 0 30 28 42 28 C54 28 56 0 64 0 H84"
                fill="currentColor"
                stroke="hsl(var(--border) / 0.6)"
                strokeWidth="1"
              />
            </svg>

            <div className="relative h-full flex items-center justify-between px-4">
              <div className="flex items-center gap-2 flex-1 justify-around">
                {items.slice(0, 2).map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => tap(to)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                      isActive(to)
                        ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </Link>
                ))}
              </div>

              <div className="w-16 shrink-0" aria-hidden="true" />

              <div className="flex items-center gap-2 flex-1 justify-around">
                {items.slice(2).map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => tap(to)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                      isActive(to)
                        ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { haptic("medium"); navigate("/add-event?mode=organizer"); }}
            aria-label="Add event"
            className="absolute left-1/2 -translate-x-1/2 z-10 group"
            style={{ top: "-24px" }}
          >
            <div className="h-14 w-14 rounded-full bg-background border border-border flex items-center justify-center shadow-[0_4px_20px_hsl(0_0%_0%/0.35)] hover:scale-105 transition-all active:bg-primary active:border-primary/40 active:shadow-[0_4px_20px_hsl(var(--primary)/0.55)]">
              <Plus className="h-6 w-6 text-foreground transition-colors group-active:text-primary-foreground" strokeWidth={2.5} />
            </div>
          </button>

          <span className="absolute left-1/2 -translate-x-1/2 bottom-3 text-[10px] font-medium leading-none pointer-events-none text-foreground">
            Add
          </span>
        </div>
      </nav>
    </div>
  );
};

export default OrganizerLayout;
