import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  /** Optional CSS gradient/color to show while loading. */
  placeholder?: string;
  /** Tailwind class controlling the rounded corners of the inner image. */
  rounded?: string;
  /** When true, hints the browser to fetch this image with high priority. */
  priority?: boolean;
  /**
   * Optional tiny preview URL (e.g. a 20-40px Supabase transform) shown
   * blurred while the full image loads. Falls back to skeleton shimmer.
   */
  blurSrc?: string;
  /** When false, disables the shimmer overlay. Defaults to true. */
  skeleton?: boolean;
}

/**
 * Image wrapper that crossfades the photo in over a soft brand-tinted
 * background and an optional blurred low-res preview. Adds a subtle
 * animate-pulse shimmer until the image is decoded.
 */
const BlurImage = ({
  className,
  placeholder,
  style,
  onLoad,
  onError,
  rounded,
  priority,
  blurSrc,
  skeleton = true,
  ...rest
}: Props) => {
  const [loaded, setLoaded] = useState(priority === true);
  const [errored, setErrored] = useState(false);
  return (
    <div
      className={cn("relative w-full h-full overflow-hidden", className)}
      style={{
        background:
          placeholder ??
          "radial-gradient(120% 90% at 0% 0%, hsl(var(--primary) / 0.22), transparent 55%), radial-gradient(120% 90% at 100% 100%, hsl(var(--accent, var(--primary)) / 0.18), transparent 60%), hsl(var(--muted) / 0.35)",
        ...style,
      }}
    >
      {/* Skeleton shimmer — priority images skip it so above-the-fold
          avatars / covers paint instantly when cached. */}
      {skeleton && !priority && !loaded && !errored && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-muted/40",
            rounded,
          )}
          aria-hidden="true"
        />
      )}
      {/* Optional blurred preview */}
      {blurSrc && !priority && !loaded && !errored && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 w-full h-full object-cover scale-110 blur-lg",
            rounded,
          )}
        />
      )}
      <img
        {...rest}
        loading={rest.loading ?? (priority ? "eager" : "lazy")}
        decoding={rest.decoding ?? (priority ? "sync" : "async")}
        // @ts-expect-error — fetchpriority is valid HTML, not yet in TS DOM lib
        fetchpriority={priority ? "high" : (rest as any).fetchpriority ?? "auto"}
        onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
        onError={(e) => { setErrored(true); onError?.(e); }}
        className={cn(
          "relative w-full h-full object-cover",
          priority ? "" : "transition-opacity duration-500 ease-out",
          rounded,
          priority || (loaded && !errored) ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
};

export default BlurImage;
