import { useEffect, useState } from "react";
import { Calendar, MapPin, ExternalLink, Cloud, CloudRain, Sun, CloudSnow, Wind, Loader2, CloudFog, CloudLightning, CloudDrizzle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { format as fmt } from "@/lib/dateFormat";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "@/lib/dateLocale";

type Weather = { temp: number; code: number };

const codeToIcon = (c: number) => {
  if (c === 0) return Sun;
  if (c >= 1 && c <= 3) return Cloud;
  if (c >= 45 && c <= 48) return CloudFog;
  if (c >= 51 && c <= 57) return CloudDrizzle;
  if (c >= 61 && c <= 67) return CloudRain;
  if (c >= 71 && c <= 77) return CloudSnow;
  if (c >= 80 && c <= 82) return CloudRain;
  if (c >= 85 && c <= 86) return CloudSnow;
  if (c >= 95) return CloudLightning;
  return Wind;
};

const getMapsUrl = (loc: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;

const buildIcsHref = (props: {
  name: string;
  date: string;
  endDate?: string | null;
  time?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
}) => {
  const stripHHMM = (t: string) => (t.length >= 5 ? t.slice(0, 5).replace(":", "") : "0000");
  const stamp = (d: string, t?: string | null) => d.replace(/-/g, "") + "T" + (t ? stripHHMM(t) : "180000") + "00";
  const dtStart = stamp(props.date, props.time);
  const dtEnd = stamp(props.endDate ?? props.date, props.endTime ?? (props.time ? `${(parseInt(props.time, 10) + 2).toString().padStart(2, "0")}:00` : null));
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//iamin//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@iamin`,
    `DTSTAMP:${stamp(new Date().toISOString().slice(0, 10), new Date().toISOString().slice(11, 16))}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escape(props.name)}`,
    props.location ? `LOCATION:${escape(props.location)}` : "",
    props.description ? `DESCRIPTION:${escape(props.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\n"))}`;
};

interface Props {
  name: string;
  date: string | null;
  endDate?: string | null;
  time?: string | null;
  location?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  description?: string | null;
}

/**
 * Unified logistics card: when (calendar + ics) / where (map link) / weather.
 * Replaces the trio of separate sections on EventDetail.
 */
const EventLogisticsCard = ({
  name,
  date,
  endDate,
  time,
  location,
  city,
  lat,
  lng,
  description,
}: Props) => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wxLoading, setWxLoading] = useState(false);
  const [wxError, setWxError] = useState<string | null>(null);

  const codeToLabel = (c: number) => {
    if (c === 0) return t("weather.sunny");
    if (c <= 2) return t("weather.partly_cloudy");
    if (c === 3) return t("weather.cloudy");
    if (c <= 48) return t("weather.foggy");
    if (c <= 57) return t("weather.drizzle");
    if (c <= 67) return t("weather.rainy");
    if (c <= 77) return t("weather.snowy");
    if (c <= 82) return t("weather.showers");
    if (c <= 86) return t("weather.snow_showers");
    if (c >= 95) return t("weather.thunderstorm");
    return t("weather.windy");
  };

  useEffect(() => {
    const wxCity = city ?? location;
    if (!wxCity || !date) return;
    const days = differenceInDays(parseISO(date), new Date());
    if (days < 0 || days > 15) {
      setWxError("unavailable");
      return;
    }
    setWxLoading(true);
    setWxError(null);

    const tryGeo = async (q: string) => {
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
        const j = await r.json();
        const x = j?.results?.[0];
        return x ? { lat: x.latitude as number, lon: x.longitude as number } : null;
      } catch {
        return null;
      }
    };

    (async () => {
      try {
        let coords: { lat: number; lon: number } | null = null;
        if (typeof lat === "number" && typeof lng === "number") {
          coords = { lat, lon: lng };
        } else {
          const parts = wxCity.split(",").map((s) => s.trim()).filter(Boolean);
          for (const q of Array.from(new Set([wxCity.trim(), ...parts]))) {
            coords = await tryGeo(q);
            if (coords) break;
          }
        }
        if (!coords) {
          setWxError("unavailable");
          return;
        }
        const hour = time ? parseInt(time.split(":")[0], 10) : 20;
        const target = `${date}T${String(hour).padStart(2, "0")}:00`;
        const f = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=weather_code,temperature_2m&start_date=${date}&end_date=${date}&timezone=auto`,
        ).then((r) => r.json());
        const h = f?.hourly;
        if (!h?.time?.length) {
          setWxError("no_forecast");
          return;
        }
        const idx = h.time.findIndex((s: string) => s.startsWith(target));
        const i = idx >= 0 ? idx : Math.min(hour, h.time.length - 1);
        const temp = h.temperature_2m?.[i];
        const code = h.weather_code?.[i];
        if (typeof temp !== "number" || typeof code !== "number") {
          setWxError("no_forecast");
          return;
        }
        setWeather({ temp: Math.round(temp), code });
      } catch {
        setWxError("load_error");
      } finally {
        setWxLoading(false);
      }
    })();
  }, [city, location, date, time, lat, lng]);

  if (!date && !location) return null;

  const dateLabel = date
    ? endDate && endDate !== date
      ? `${fmt(parseISO(date), "EEE d MMM", { locale: dateLocale })} – ${fmt(parseISO(endDate), "EEE d MMM", { locale: dateLocale })}`
      : fmt(parseISO(date), "EEEE d MMMM", { locale: dateLocale })
    : null;
  const timeLabel = time ? time.slice(0, 5) : null;
  const Icon = weather ? codeToIcon(weather.code) : Cloud;
  const showWeather = !!date && !!(city ?? location);

  return (
    <div className="tactile-widget overflow-hidden">
      {/* Row 1: When + ICS */}
      {dateLabel && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{dateLabel}</p>
            {timeLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">{timeLabel}</p>
            )}
          </div>
          <a
            href={buildIcsHref({ name, date, endDate, time, location, description })}
            download={`${name.replace(/[^a-z0-9-_]+/gi, "_")}.ics`}
            className="text-xs font-semibold text-primary hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
            onClick={(e) => e.stopPropagation()}
          >
            + ics
          </a>
        </div>
      )}

      {/* Divider */}
      {dateLabel && location && (
        <div className="mx-4 h-px bg-border" />
      )}

      {/* Row 2: Where */}
      {location && (
        <a
          href={getMapsUrl(location)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{location}</p>
            {city && city !== location && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{city}</p>
            )}
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        </a>
      )}

      {/* Divider */}
      {showWeather && location && <div className="mx-4 h-px bg-border" />}

      {/* Row 3: Weather */}
      {showWeather && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          {wxLoading ? (
            <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />
          ) : (
            <Icon className="h-5 w-5 text-primary shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            {weather ? (
              <>
                <p className="text-sm font-semibold text-foreground truncate">
                  {weather.temp}°C · {codeToLabel(weather.code)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("weather.forecast_at", { time: timeLabel ?? t("weather.evening") })}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {wxError ? t(`weather.${wxError}`) : t("weather.loading")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLogisticsCard;
