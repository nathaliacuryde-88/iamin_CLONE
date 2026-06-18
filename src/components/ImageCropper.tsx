import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Matches the cover image area inside an EventCard in the feed (~square)
// so the cropped region is identical across the feed and the detail hero.
const DEFAULT_ASPECT = 1;

async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Couldn't load the image"));
    img.src = imageSrc;
  });
  const w = Math.max(1, Math.round(area.width));
  const h = Math.max(1, Math.round(area.height));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, w, h);
  return new Promise<Blob>((res, rej) => {
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("Couldn't process this image — try another"))),
      "image/jpeg",
      0.92,
    );
  });
}

const ImageCropper = ({
  open,
  src,
  aspect = DEFAULT_ASPECT,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  src: string;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob, previewUrl: string) => void;
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, p: Area) => setPixels(p), []);

  const handleConfirm = async () => {
    if (!pixels || busy) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, pixels);
      onConfirm(blob, URL.createObjectURL(blob));
    } catch (err: any) {
      // Surface the error instead of silently doing nothing
      // eslint-disable-next-line no-alert
      alert(err?.message ?? "Couldn't crop the image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Position your image</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[260px] bg-black rounded-xl overflow-hidden">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={0.5}
            maxZoom={3}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            restrictPosition={false}
          />
        </div>
        <div className="px-1">
          <p className="text-xs text-muted-foreground mb-1">Zoom</p>
          <Slider min={0.5} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={busy}>{busy ? "Processing…" : "Use image"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
