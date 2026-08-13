"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Globe2, MapPin, Moon, Sun } from "lucide-react";
import { countryOptions } from "../../lib/country-data";
import { cityRates } from "../../lib/market-data";
import NotificationToggle from "./NotificationToggle";

function todayValue() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateLabel(value: string) {
  if (value === todayValue()) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+05:30`));
}

export default function SiteHeader({ citySlug = "mumbai" }: { citySlug?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const countryCode = searchParams.get("country") || "IN";
  const dateValue = searchParams.get("date") || todayValue();
  const isIndia = countryCode === "IN";

  const activeCity = useMemo(() => cityRates.find((city) => city.slug === citySlug) ?? cityRates[0], [citySlug]);

  useEffect(() => {
    const saved = window.localStorage.getItem("gsp-theme");
    const next = saved === "dark" || saved === "light" ? saved : "light";
    // Hydration guard: localStorage is intentionally read only after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(next);
    document.documentElement.dataset.theme = next;
    setMounted(true);
  }, []);

  function pushFilter(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  function changeCity(nextCity: string) {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    router.push(`/gold-price/${nextCity}${query ? `?${query}` : ""}`);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("gsp-theme", next);
  }

  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link className="logo" href="/" aria-label="GoldSilverPrices home">
          <span>Gold</span>SilverPrices
        </Link>
        <div className="actions">
          <label className="city-select">
            <Globe2 size={15} />
            <span className="sr-only">Select country</span>
            <select value={countryCode} onChange={(event) => pushFilter({ country: event.target.value })}>
              {countryOptions.map((country) => (
                <option value={country.code} key={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
          <label className="city-select">
            <MapPin size={15} />
            <span className="sr-only">Select city</span>
            <select value={activeCity.slug} onChange={(event) => changeCity(event.target.value)} disabled={!isIndia}>
              {isIndia ? (
                cityRates.map((city) => (
                  <option value={city.slug} key={city.slug}>
                    {city.name}
                  </option>
                ))
              ) : (
                <option value={activeCity.slug}>{countryOptions.find((country) => country.code === countryCode)?.name}</option>
              )}
            </select>
          </label>
          <label className="city-select date-select" title={dateLabel(dateValue)}>
            <CalendarDays size={15} />
            <span className="date-label">{dateLabel(dateValue)}</span>
            <input value={dateValue} max={todayValue()} onChange={(event) => pushFilter({ date: event.target.value })} type="date" aria-label="Select date" />
          </label>
          <NotificationToggle citySlug={activeCity.slug} />
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle color theme" disabled={!mounted}>
            {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
