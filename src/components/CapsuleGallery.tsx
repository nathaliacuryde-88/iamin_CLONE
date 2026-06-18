import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Download, Trash2 } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { useFeedFilters } from "@/hooks/useFeedFilters";
import BlurImage from "@/components/BlurImage";

type Photo = { id: string; image_url: string };

interface Props {
  open: boolean;
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
  onDownload?: (url: string) => void;
  /** When provided, a trash button appears next to Close. */
  onDelete?: (photoId: string) => void;
}

/**
 * iPhone-Photos-style fullscreen gallery:
 * - Big swipeable carousel (spring snap) for the active photo.
 * - Thumbnail rail below, the active thumb scales up.
 * - Pinch / double-tap to zoom on the active photo.
 * - Swipe down to close.
 */
const CapsuleGallery = ({ open, photos, startIndex, onClose, onDownload, onDelete }: Props) => {
  const haptic = useHaptics();
  const { setChromeHidden } = useFeedFilters();
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState<number>(typeof window === "undefined" ? 0 : window.innerWidth);
  const thumbRailRef = useRef<HTMLDivElement>(null);

  // Hide app chrome (top header + bottom nav) while gallery is open.
  useEffect(() => {
    if (open) {
      setChromeHidden(true);
      return () => setChromeHidden(false);
    }
  }, [open, setChromeHidden]);

  useEffect(() => { if (open) setIndex(startIndex); }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // Reset zoom on slide change + scroll active thumb into view
  useEffect(() => {
    setZoom(1);
    const rail = thumbRailRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLElement>(`[data-thumb-idx="${index}"]`);
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { haptic("medium"); onClose(); }
      if (e.key === "ArrowRight" && index < photos.length - 1) { haptic("selection"); setIndex(index + 1); }
      if (e.key === "ArrowLeft" && index > 0) { haptic("selection"); setIndex(index - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, photos.length, haptic, onClose]);

  if (!open || photos.length === 0) return null;

  const isVideoUrl = (url: string) => /\.(mp4|mov|m4v|webm|quicktime)(\?|$)/i.test(url);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    // Swipe-down close (back microgesture)
    if ((offset.y > 70 || velocity.y > 600) && Math.abs(offset.x) < 80) {
      haptic("medium");
      onClose();
      return;
    }
    // Horizontal paging
    const threshold = 60;
    if (offset.x < -threshold || velocity.x < -500) {
      if (index < photos.length - 1) {
        haptic("selection");
        setIndex(index + 1);
      }
    } else if (offset.x > threshold || velocity.x > 500) {
      if (index > 0) {
        haptic("selection");
        setIndex(index - 1);
      }
    }
  };

  const toggleZoom = () => {
    haptic("light");
    setZoom((z) => (z === 1 ? 2 : 1));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="gallery"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col select-none"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 z-20"
             style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}>
          <span className="text-white/80 text-xs font-semibold tracking-wider">
            {index + 1} / {photos.length}
          </span>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(photos[index].image_url)}
                className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20"
                aria-label="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {onDelete && photos[index] && (
              <button
                type="button"
                onClick={() => {
                  haptic("warning");
                  onDelete(photos[index].id);
                }}
                className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-destructive/80"
                aria-label="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => { haptic("medium"); onClose(); }}
              className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Big rail */}
        <div className="flex-1 overflow-hidden flex items-center">
          <motion.div
            className="flex h-full items-center"
            drag="x"
            dragConstraints={{ left: -((photos.length - 1) * width), right: 0 }}
            dragElastic={0.18}
            dragMomentum={false}
            animate={{ x: -index * width }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            onDragEnd={handleDragEnd}
            style={{ touchAction: "pan-y" }}
          >
            {photos.map((p, i) => {
              const distance = Math.abs(i - index);
              const isNear = distance <= 1;
              const isPrefetch = distance === 2;
              if (!isNear && !isPrefetch) {
                return (
                  <div
                    key={p.id}
                    className="shrink-0 h-full flex items-center justify-center px-3"
                    style={{ width }}
                  >
                    <div className="h-full w-full max-h-[80vh] rounded-lg bg-white/5 animate-pulse" />
                  </div>
                );
              }
              return (
                <div
                  key={p.id}
                  className="shrink-0 h-full flex items-center justify-center px-3"
                  style={{ width }}
                >
                  {isVideoUrl(p.image_url) ? (
                    <video
                      src={p.image_url}
                      controls
                      playsInline
                      autoPlay={i === index}
                      muted={i !== index}
                      loop
                      className="max-h-full max-w-full object-contain rounded-lg"
                      style={{ touchAction: "pan-y" }}
                    />
                  ) : (
                    <motion.div
                      animate={{ scale: i === index ? zoom : 1 }}
                      transition={{ type: "spring", stiffness: 360, damping: 30 }}
                      onDoubleClick={i === index ? toggleZoom : undefined}
                      className="relative max-h-full max-w-full w-full h-full flex items-center justify-center"
                      style={{ touchAction: i === index && zoom > 1 ? "auto" : "pan-y" }}
                    >
                      <BlurImage
                        src={p.image_url}
                        alt=""
                        draggable={false}
                        priority={isNear}
                        rounded="rounded-lg"
                        className="max-h-full max-w-full"
                        placeholder="rgba(255,255,255,0.04)"
                      />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Thumb rail */}
        <div
          ref={thumbRailRef}
          className="shrink-0 overflow-x-auto py-3 px-4 flex items-end gap-2 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {photos.map((p, i) => {
            const active = i === index;
            return (
              <motion.button
                key={p.id}
                type="button"
                data-thumb-idx={i}
                onClick={() => { haptic("light"); setIndex(i); }}
                animate={{ scale: active ? 1.2 : 1, opacity: active ? 1 : 0.55 }}
                transition={{ type: "spring", stiffness: 480, damping: 32 }}
                className={`shrink-0 rounded-md overflow-hidden ${active ? "ring-2 ring-primary" : "ring-1 ring-white/20"}`}
                style={{ width: 56, height: 56 }}
                aria-label={`Open photo ${i + 1}`}
              >
                {isVideoUrl(p.image_url) ? (
                  <div className="relative w-full h-full">
                    <video src={p.image_url} muted playsInline preload="metadata" className="w-full h-full object-cover border-0 border-none" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </div>
                ) : (
                  <BlurImage src={p.image_url} alt="" className="w-full h-full" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default CapsuleGallery;
