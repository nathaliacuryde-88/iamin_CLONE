import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Loader2, CloudFog, CloudLightning, CloudDrizzle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

type Weather = { temp: number; code: number };

const codeToIcon = (c: number) => {
  if (c === 0) return Sun;
  if (c === 1 || c === 2) return Cloud;
  if (c === 3) return Cloud;
  if (c >= 45 && c <= 48) return CloudFog;
  if (c >= 51 && c <= 57) return CloudDrizzle;
  if (c >= 61 && c <= 67) return CloudRain;
  if (c >= 71 && c <= 77) return CloudSnow;
  if (c >= 80 && c <= 82) return CloudRain;
  if (c >= 85 && c <= 86) return CloudSnow;
  if (c >= 95) return CloudLightning;
  return Wind;
};

const WeatherStrip = ({
  city,
  date,
  time,
  lat,
  lng,
}: {
  city: string | null;
  date: string | null;
  time?: string | null;
  lat?: number | null;
  lng?: number | null;
}) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!city || !date) return;

    const days = differenceInDays(parseISO(date), new Date());
    if (days < 0 || days > 15) {
      setError("unavailable");
      return;
    }
    setLoading(true);
    setError(null);

    const tryOpenMeteoGeo = async (q: string) => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`,
        );
        const json = await res.json();
        const r = json?.results?.[0];
        return r ? { lat: r.latitude as number, lon: r.longitude as number } : null;
      } catch {
        return null;
      }
    };

    const tryNominatim = async (q: string) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
          { headers: { "Accept-Language": "en" } },
        );
        const json = await res.json();
        const r = json?.[0];
        return r ? { lat: parseFloat(r.lat), lon: parseFloat(r.lon) } : null;
      } catch {
        return null;
      }
    };

    (async () => {
      try {
        let coords: { lat: number; lon: number } | null = null;

        if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
          coords = { lat, lon: lng };
        } else {
          const segments = city.split(",").map((s) => s.trim()).filter(Boolean);
          const candidates = Array.from(
            new Set([city.trim(), ...segments, segments.slice(-1)[0] ?? ""].filter(Boolean)),
          );
          for (const q of candidates) {
            coords = await tryOpenMeteoGeo(q);
            if (coords) break;
          }
          if (!coords) {
            for (const q of candidates) {
              coords = await tryNominatim(q);
              if (coords) break;
            }
          }
        }
        if (!coords) {
          setError("unavailable");
          return;
        }

        const hour = time ? parseInt(time.split(":")[0], 10) : 20;
        const targetISO = `${date}T${String(hour).padStart(2, "0")}:00`;

        const forecast = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=weather_code,temperature_2m&start_date=${date}&end_date=${date}&timezone=auto`,
        ).then((r) => r.json());
        const h = forecast?.hourly;
        if (!h?.time?.length) {
          setError("no_forecast");
          return;
        }
        const idx = h.time.findIndex((t: string) => t.startsWith(targetISO));
        const i = idx >= 0 ? idx : Math.min(Math.max(hour, 0), h.time.length - 1);
        const temp = h.temperature_2m?.[i];
        const code = h.weather_code?.[i];
        if (typeof temp !== "number" || typeof code !== "number") {
          setError("no_forecast");
          return;
        }
        setWeather({ temp: Math.round(temp), code });
      } catch {
        setError("load_error");
      } finally {
        setLoading(false);
      }
    })();
  }, [city, date, time, lat, lng]);


  if (!city || !date) return null;

  const Icon = weather ? codeToIcon(weather.code) : Cloud;
  const timeLabel = time ? time.slice(0, 5) : t("weather.evening");
  const errorLabel = error ? t(`weather.${error}`) : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 tactile-widget">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Icon className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {t("weather.forecast_at", { time: timeLabel })}
        </p>
        {weather ? (
          <p className="text-sm text-foreground font-medium">
            {codeToLabel(weather.code)} · {weather.temp}°C · {city.split(",")[0]}
          </p>
        ) : errorLabel ? (
          <p className="text-sm text-muted-foreground">{errorLabel}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("weather.loading")}</p>
        )}
      </div>
    </div>
  );
};

export default WeatherStrip;
