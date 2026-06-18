import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type FeedFilters = {
  /** City name to filter events by (matches events.city ILIKE %city%). Empty = any. */
  city: string;
  /** Selected vibe tags (multi). */
  vibes: string[];
  fromDate: string;
  toDate: string;
  minFriends: number;
};

const DEFAULTS: FeedFilters = {
  city: "",
  vibes: [],
  fromDate: "",
  toDate: "",
  minFriends: 0,
};

type Ctx = {
  filters: FeedFilters;
  setFilters: (f: FeedFilters) => void;
  showFilters: boolean;
  setShowFilters: (b: boolean) => void;
  /** Layout chrome (top header + bottom nav) is hidden when true. */
  chromeHidden: boolean;
  setChromeHidden: (b: boolean) => void;
  activeCount: number;
  reset: () => void;
};

const FeedFiltersContext = createContext<Ctx | null>(null);

export const FeedFiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FeedFilters>(DEFAULTS);
  const [showFilters, setShowFiltersState] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);

  const setShowFilters = (b: boolean) => {
    setShowFiltersState(b);
    setChromeHidden(b);
  };

  // Safety: re-show chrome if all overlays close.
  useEffect(() => {
    if (!showFilters) {
      // Only auto-clear if nothing else is keeping it hidden.
      // Other overlays (gallery) call setChromeHidden directly.
    }
  }, [showFilters]);

  const activeCount =
    (filters.city.trim() ? 1 : 0) +
    (filters.vibes.length > 0 ? 1 : 0) +
    (filters.fromDate || filters.toDate ? 1 : 0) +
    (filters.minFriends > 0 ? 1 : 0);
  const reset = () => setFilters(DEFAULTS);
  return (
    <FeedFiltersContext.Provider
      value={{
        filters,
        setFilters,
        showFilters,
        setShowFilters,
        chromeHidden,
        setChromeHidden,
        activeCount,
        reset,
      }}
    >
      {children}
    </FeedFiltersContext.Provider>
  );
};

export const useFeedFilters = () => {
  const ctx = useContext(FeedFiltersContext);
  if (!ctx) throw new Error("useFeedFilters must be inside FeedFiltersProvider");
  return ctx;
};
