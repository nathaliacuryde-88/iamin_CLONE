import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, LayoutGrid, Plus, User, Archive } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

/**
 * Floating pill bottom nav (mobile only).
 * Now globally fixed via AppLayout to ensure consistent positioning on all pages.
 */
const BottomNavBar = ({ hidden = false }: { hidden?: boolean }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const haptic = useHaptics();
  const tap = (to: string) => {
    if (location.pathname !== to) haptic("light");
  };

  const positionClass = `fixed left-4 right-4 flex justify-center transition-transform duration-300 pointer-events-none ${
    hidden ? "translate-y-[150%]" : "translate-y-0"
  }`;

  return (
    <nav
      className={`z-30 md:hidden ${positionClass}`}
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="relative w-full max-w-md pointer-events-auto">
        <div className="relative h-16 rounded-full bg-background/55 backdrop-blur-[24px] backdrop-saturate-150 border border-border/60 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.35)] overflow-visible">
          <svg
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ top: "-1px", color: "hsl(var(--card) / 0.6)" }}
            width="84"
            height="28"
            viewBox="0 0 84 28"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 H20 C28 0 30 28 42 28 C54 28 56 0 64 0 H84"
              fill="currentColor"
              stroke="hsl(var(--border) / 0.6)"
              strokeWidth="1"
            />
          </svg>

          <div className="relative h-full flex items-center justify-between px-3">
            <div className="flex items-center gap-1 flex-1 justify-around">
              <Link
                to="/"
                onClick={() => tap("/")}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all ${
                  location.pathname === "/"
                    ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground"
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{t("nav.feed")}</span>
              </Link>

              <Link
                to="/calendar"
                onClick={() => tap("/calendar")}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all ${
                  location.pathname === "/calendar"
                    ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground"
                }`}
              >
                <CalendarDays className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{t("nav.calendar")}</span>
              </Link>
            </div>

            {/* Spacer for the central Plus button dip */}
            <div className="w-12 shrink-0" aria-hidden="true" />

            <div className="flex items-center gap-1 flex-1 justify-around">
              <Link
                to="/time-capsule"
                onClick={() => tap("/time-capsule")}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all ${
                  location.pathname === "/time-capsule"
                    ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground"
                }`}
              >
                <Archive className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{t("nav.capsule")}</span>
              </Link>

              <Link
                to="/profile"
                onClick={() => tap("/profile")}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all ${
                  location.pathname === "/profile"
                    ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground"
                }`}
              >
                <User className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{t("nav.profile")}</span>
              </Link>
            </div>
          </div>
        </div>

        <Link
          to="/add-event?mode=person"
          aria-label="Add event"
          onClick={() => haptic("medium")}
          className="absolute left-1/2 -translate-x-1/2 z-10 group"
          style={{ top: "-24px" }}
        >
          <div className="h-14 w-14 rounded-full bg-background border border-border flex items-center justify-center shadow-[0_4px_20px_hsl(0_0%_0%/0.35)] hover:scale-105 transition-all active:bg-primary active:border-primary/40 active:shadow-[0_4px_20px_hsl(var(--primary)/0.55)]">
            <Plus className="h-6 w-6 text-foreground transition-colors group-active:text-primary-foreground" strokeWidth={2.5} />
          </div>
        </Link>

        <span
          className={`absolute left-1/2 -translate-x-1/2 bottom-3 text-[10px] font-medium leading-none pointer-events-none transition-colors ${
            location.pathname === "/add-event"
              ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              : "text-foreground"
          }`}
        >
          Add
        </span>
      </div>
    </nav>
  );
};

export default BottomNavBar;
