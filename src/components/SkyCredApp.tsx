"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CITY,
  POPULAR_CITIES,
  formatNumber,
  getRecommendation,
  weatherIconUrl,
  type WeatherPayload,
} from "@/lib/weather";

type JsonTab = "formatted" | "raw";

async function fetchWeather(query: string) {
  const response = await fetch(`/api/weather?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Could not load weather for that location.");
  }

  return payload as WeatherPayload;
}

export default function SkyCredApp() {
  const [query, setQuery] = useState("");
  const [activeCity, setActiveCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonTab, setJsonTab] = useState<JsonTab>("formatted");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [locationNote, setLocationNote] = useState(
    "Showing Mumbai while we check your location."
  );

  const loadWeather = useCallback(async (nextQuery: string, highlight?: string) => {
    setLoading(true);
    setError(null);
    setCopyStatus(null);

    try {
      const data = await fetchWeather(nextQuery);
      setWeather(data);
      setActiveCity(highlight || data.location.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load weather. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      await loadWeather(DEFAULT_CITY, DEFAULT_CITY);

      if (!navigator.geolocation) {
        setLocationNote("Location is unavailable. Search a city or pick a shortcut.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled) return;
          const coords = `${position.coords.latitude},${position.coords.longitude}`;
          setLocationNote("Using your current location.");
          await loadWeather(coords);
        },
        () => {
          if (cancelled) return;
          setLocationNote(
            "Location permission was not granted. Search a city or pick a shortcut."
          );
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadWeather]);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const city = query.trim();
    if (!city) {
      setError("Enter a city name to search.");
      return;
    }
    setLocationNote("Showing the city you searched.");
    await loadWeather(city, city);
  }

  async function onPopularCity(city: string) {
    setQuery(city);
    setLocationNote("Showing a popular city shortcut.");
    await loadWeather(city, city);
  }

  const recommendation = useMemo(
    () => (weather ? getRecommendation(weather) : null),
    [weather]
  );

  const formattedJson = weather ? JSON.stringify(weather, null, 2) : "";
  const rawJson = weather ? JSON.stringify(weather) : "";
  const jsonToCopy = jsonTab === "formatted" ? formattedJson : rawJson;

  async function copyJson() {
    if (!jsonToCopy) return;
    try {
      await navigator.clipboard.writeText(jsonToCopy);
      setCopyStatus("Copied to clipboard.");
    } catch {
      setCopyStatus("Copying was unsuccessful. Check clipboard permissions.");
    }
  }

  const icon = weatherIconUrl(weather?.current.condition.icon);
  const selectedPopular = POPULAR_CITIES.find(
    (city) => city.toLowerCase() === activeCity.toLowerCase()
  );

  return (
    <div className="relative min-h-full overflow-hidden bg-[var(--sky-bg)] text-[var(--sky-ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,196,122,0.16),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.04),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-[var(--sky-gold)]">
              SKYCRED
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-none text-[var(--sky-cream)] sm:text-5xl">
              Check the sky’s credit score before you step out.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--sky-muted)]">
              Real-time weather, dressed like a statement card. Temperature, how it feels,
              and a short recommendation — no dashboard clutter.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-[var(--sky-line)] bg-[var(--sky-panel)] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium tracking-wide text-[var(--sky-cream)]">
              Live Weather
            </span>
          </div>
        </header>

        <form onSubmit={onSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="city-search">
            Search city
          </label>
          <input
            id="city-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any city"
            className="h-12 flex-1 rounded-full border border-[var(--sky-line)] bg-[var(--sky-panel)] px-5 text-sm text-[var(--sky-cream)] outline-none placeholder:text-[var(--sky-muted)] focus:border-[var(--sky-gold)]"
          />
          <button
            type="submit"
            className="h-12 rounded-full bg-[var(--sky-gold)] px-6 text-sm font-semibold text-[#1a140c] transition hover:bg-[#f3d09a]"
          >
            Search
          </button>
        </form>

        <p className="mt-3 text-xs text-[var(--sky-muted)]">{locationNote}</p>

        <section className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--sky-muted)]">
            Popular cities
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.map((city) => {
              const selected = selectedPopular === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => onPopularCity(city)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    selected
                      ? "border-[var(--sky-gold)] bg-[var(--sky-gold)] text-[#1a140c]"
                      : "border-[var(--sky-line)] bg-[var(--sky-panel)] text-[var(--sky-cream)] hover:border-[var(--sky-gold)]"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="mt-6 rounded-[28px] border border-[var(--sky-line)] bg-[var(--sky-card)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-8">
          {loading && !weather ? (
            <div className="animate-pulse space-y-6">
              <div className="h-4 w-40 rounded bg-white/10" />
              <div className="h-20 w-48 rounded bg-white/10" />
              <div className="h-16 rounded-2xl bg-white/10" />
            </div>
          ) : weather ? (
            <>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-[var(--sky-gold)]">
                    Current conditions
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--sky-cream)]">
                    {weather.location.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--sky-muted)]">
                    {[weather.location.region, weather.location.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--sky-muted)]">
                    Local time {weather.location.localtime || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon}
                      alt={weather.current.condition.text || "Weather icon"}
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px]"
                    />
                  ) : null}
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-7xl leading-none text-[var(--sky-cream)]">
                      {formatNumber(weather.current.temp_c)}
                      <span className="text-3xl">°C</span>
                    </p>
                    <p className="mt-2 text-base text-[var(--sky-muted)]">
                      {weather.current.condition.text || "—"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--sky-cream)]/80">
                      Feels like {formatNumber(weather.current.feelslike_c, "°C")}
                    </p>
                  </div>
                </div>
              </div>

              {recommendation ? (
                <div className="mt-8 rounded-2xl border border-[var(--sky-gold)]/25 bg-[var(--sky-gold)]/10 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sky-gold)]">
                    {recommendation.category}
                  </p>
                  <p className="mt-1 text-sm text-[var(--sky-cream)]">
                    {recommendation.text}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Metric label="Humidity" value={formatNumber(weather.current.humidity, "%")} />
                <Metric
                  label="Wind Speed"
                  value={formatNumber(weather.current.wind_kph, " kph")}
                />
                <Metric label="UV Index" value={formatNumber(weather.current.uv)} />
              </div>
              {loading ? (
                <p className="mt-4 text-xs text-[var(--sky-muted)]">Updating weather…</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-[var(--sky-muted)]">
              Search a city to see live weather.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-[24px] border border-[var(--sky-line)] bg-[var(--sky-panel)] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--sky-cream)]">
                Weather payload
              </h3>
              <p className="text-xs text-[var(--sky-muted)]">
                Formatted and raw JSON from the current WeatherAPI response.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setJsonTab("formatted")}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  jsonTab === "formatted"
                    ? "bg-[var(--sky-gold)] text-[#1a140c]"
                    : "border border-[var(--sky-line)] text-[var(--sky-cream)]"
                }`}
              >
                Formatted JSON
              </button>
              <button
                type="button"
                onClick={() => setJsonTab("raw")}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  jsonTab === "raw"
                    ? "bg-[var(--sky-gold)] text-[#1a140c]"
                    : "border border-[var(--sky-line)] text-[var(--sky-cream)]"
                }`}
              >
                Raw JSON
              </button>
              <button
                type="button"
                onClick={copyJson}
                disabled={!jsonToCopy}
                className="rounded-full border border-[var(--sky-line)] px-3 py-1.5 text-xs text-[var(--sky-cream)] disabled:opacity-40"
              >
                Copy
              </button>
            </div>
          </div>
          {copyStatus ? (
            <p className="mt-3 text-xs text-[var(--sky-gold)]">{copyStatus}</p>
          ) : null}
          <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-black/40 p-4 text-xs leading-6 text-[var(--sky-cream)]/85">
            {jsonTab === "formatted" ? formattedJson || "No weather data yet." : rawJson || "No weather data yet."}
          </pre>
        </section>

        <footer className="mt-auto pt-10 text-center text-xs text-[var(--sky-muted)]">
          Powered by WeatherAPI.com · Not a real credit score, just vibes.
        </footer>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--sky-line)] bg-black/20 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--sky-muted)]">{label}</p>
      <p className="mt-2 text-2xl text-[var(--sky-cream)]">{value}</p>
    </div>
  );
}
