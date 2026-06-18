import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  /** What to render once the gate has opened. */
  children: ReactNode;
  /** Placeholder height (px or any CSS length) used to reserve space and prevent layout shift. */
  minHeight?: number | string;
  /**
   * How far in advance (px) to mount as the placeholder approaches the viewport.
   * Defaults to a screen-height buffer so children are ready by the time they scroll in.
   */
  rootMargin?: string;
  /** Optional className for the placeholder wrapper. */
  className?: string;
  /** Optional placeholder node shown until children mount. Defaults to nothing (reserves height only). */
  fallback?: ReactNode;
}

/**
 * Defers mounting heavy subtrees until they're near the viewport. Used to
 * keep the initial render of long pages (e.g. EventDetail) cheap — the
 * expensive components only execute their effects/queries once the user
 * scrolls toward them.
 *
 * The placeholder reserves `minHeight` so layout doesn't shift when the
 * real content mounts.
 */
const DeferredRender = ({
  children,
  minHeight = 120,
  rootMargin = "300px 0px",
  className,
  fallback = null,
}: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // SSR / unsupported — render immediately as a safe default.
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  if (visible) return <>{children}</>;
  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
      aria-hidden="true"
    >
      {fallback}
    </div>
  );
};

export default DeferredRender;
