import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PresenceRow } from "@/hooks/useLivePresence";

interface AttendeeProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presences: PresenceRow[];
  attendees: AttendeeProfile[];
  venue?: { lat: number | null; lng: number | null; name?: string | null };
  focusUserId?: string | null;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const isSafeImageUrl = (url: string) => {
  try {
    const u = new URL(url, window.location.origin);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const avatarIcon = (url: string | null, name: string | null, status: string) => {
  const initials = escapeHtml((name?.[0] ?? "?").toUpperCase());
  const ringColor = status === "here" ? "#7C3AED" : "#EC4899";
  const safeUrl = url && isSafeImageUrl(url) ? escapeHtml(url) : null;
  const html = safeUrl
    ? `<div style="width:40px;height:40px;border-radius:9999px;background:#1a1a1a;border:3px solid ${ringColor};box-shadow:0 0 12px ${ringColor}aa;overflow:hidden;display:flex;align-items:center;justify-content:center;">
         <img src="${safeUrl}" style="width:100%;height:100%;object-fit:cover;"/>
       </div>`
    : `<div style="width:40px;height:40px;border-radius:9999px;background:#1a1a1a;border:3px solid ${ringColor};box-shadow:0 0 12px ${ringColor}aa;color:white;font-weight:600;display:flex;align-items:center;justify-content:center;">${initials}</div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};


// Forces leaflet to recalc its tile grid after the sheet animation finishes.
// Without this the map shows as a single grey/blank tile.
const InvalidateOnMount = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    let cancelled = false;
    const timers = [80, 250, 500].map((ms) =>
      setTimeout(() => {
        if (cancelled) return;
        try {
          // @ts-expect-error - leaflet internal
          if (!map || !map._container) return;
          map.invalidateSize();
          map.setView(center, map.getZoom());
        } catch {
          // map was unmounted between scheduling and firing
        }
      }, ms),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [map, center]);
  return null;
};

const LiveRadarMapSheet = ({ open, onOpenChange, presences, attendees, venue, focusUserId }: Props) => {
  const profileFor = (uid: string) => attendees.find((a) => a.user_id === uid);
  const [mounted, setMounted] = useState(false);

  // Only mount the MapContainer once the sheet is fully open — leaflet
  // misbehaves when its container starts at 0×0.
  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [open]);

  const withCoords = presences.filter(
    (p) => typeof p.lat === "number" && typeof p.lng === "number",
  );

  const center = useMemo<[number, number] | null>(() => {
    if (focusUserId) {
      const focused = withCoords.find((p) => p.user_id === focusUserId);
      if (focused) return [focused.lat!, focused.lng!];
    }
    if (venue?.lat && venue?.lng) return [venue.lat, venue.lng];
    if (withCoords.length > 0) return [withCoords[0].lat!, withCoords[0].lng!];
    return null;
  }, [venue, withCoords, focusUserId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2">
            📡 Live Radar Map
            <span className="text-xs text-muted-foreground font-normal">
              {withCoords.length} sharing location
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 relative bg-secondary/40">
          {center && mounted ? (
            <MapContainer
              key={`${center[0]}-${center[1]}`}
              center={center}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <InvalidateOnMount center={center} />
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {venue?.lat && venue?.lng && (
                <CircleMarker
                  center={[venue.lat, venue.lng]}
                  radius={10}
                  pathOptions={{ color: "#FBBF24", fillColor: "#FBBF24", fillOpacity: 0.9 }}
                >
                  <Popup>📍 {venue.name ?? "Event location"}</Popup>
                </CircleMarker>
              )}
              {withCoords.map((p) => {
                const prof = profileFor(p.user_id);
                return (
                  <Marker
                    key={p.id}
                    position={[p.lat!, p.lng!]}
                    icon={avatarIcon(prof?.avatar_url ?? null, prof?.display_name ?? null, p.status)}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{prof?.display_name ?? "Someone"}</strong>
                        <br />
                        {p.status === "here" ? "📍 Here now" : "🚶 On the way"}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : !center ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
              No live locations to show yet.
              <br />
              When friends share their location, they'll appear here.
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LiveRadarMapSheet;
