"use client";

import Link from "next/link";
import { useTheme } from "../_hooks/useTheme";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleEllipsis,
  Globe2,
  House,
  LineChart,
  MapPin,
  Menu,
  Moon,
  Newspaper,
  RefreshCw,
  Search,
  Sun,
  Wrench,
  X,
} from "lucide-react";
import { countryOptions } from "../../lib/country-data";
import { cityRates } from "../../lib/market-data";
import NotificationCenter from "./NotificationCenter";

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

function countryFlag(code: string) {
  return ({ IN: "🇮🇳", US: "🇺🇸", AE: "🇦🇪", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", SG: "🇸🇬" } as Record<string, string>)[code] ?? "🌐";
}

export default function SiteHeader({ citySlug = "mumbai" }: { citySlug?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<"prices" | "tools" | "more" | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const countryCode = searchParams.get("country") || "IN";
  const dateValue = searchParams.get("date") || todayValue();
  const isIndia = countryCode === "IN";

  const activeCity = useMemo(() => cityRates.find((city) => city.slug === citySlug) ?? cityRates[0], [citySlug]);
  const selectedCountry = useMemo(() => countryOptions.find((country) => country.code === countryCode) ?? countryOptions[0], [countryCode]);
  const filteredCountries = useMemo(
    () => countryOptions.filter((country) => country.name.toLowerCase().includes(countrySearch.toLowerCase().trim())),
    [countrySearch],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function closeCountryPicker(event: PointerEvent) {
      if (countryPickerRef.current && !countryPickerRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeCountryPicker);
    return () => document.removeEventListener("pointerdown", closeCountryPicker);
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


  function toggleMobileMenu() {
    setMobileMenuOpen((open) => !open);
    setActiveSubmenu(null);
    setCountryDropdownOpen(false);
  }

  function toggleSubmenu(menu: "prices" | "tools" | "more") {
    setActiveSubmenu((current) => (current === menu ? null : menu));
  }

  function selectCountry(code: string) {
    pushFilter({ country: code });
    setCountryDropdownOpen(false);
    setCountrySearch("");
  }

  function refreshPrices() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    router.refresh();
    window.setTimeout(() => setIsRefreshing(false), 850);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setActiveSubmenu(null);
  }

  function renderSubmenu(menu: "prices" | "tools" | "more") {
    if (activeSubmenu !== menu) return null;

    const links = {
      prices: [
        ["Gold Prices", "/gold-price-today"],
        ["Silver Prices", "/silver-price-today"],
        ["Platinum Prices", "/platinum-price-today"],
        ["Palladium Prices", "/"],
      ],
      tools: [
        ["Gold Calculator", "/calculator"],
        ["Silver Calculator", "/calculator?metal=silver"],
        ["Comparisons", "/metal-comparison"],
        ["Price Converter", "/investment-return-calculator"],
      ],
      more: [
        ["About", "/about"],
        ["Contact", "/contact"],
        ["Privacy", "/privacy"],
      ],
    }[menu];

    return (
      <div className="mobile-submenu">
        {links.map(([label, href]) => (
          <Link href={href} key={href} onClick={closeMobileMenu}>
            {label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <header className={`header${mobileMenuOpen ? " mobile-menu-is-open" : ""}`}>
      <div className="wrap header-inner">
        <div className="mobile-top-row">
          <Link className="logo" href="/" aria-label="GoldSilverPrices home">
            <span>Gold</span>SilverPrices
          </Link>
          <button className="mobile-menu-toggle" type="button" onClick={toggleMobileMenu} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
        <Link className="logo desktop-logo" href="/" aria-label="GoldSilverPrices home">
          <span>Gold</span>SilverPrices
        </Link>
        <div className="actions">
          <label className="city-select desktop-country-select">
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
          <NotificationCenter />
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle color theme" disabled={!mounted}>
            {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={`icon-btn mobile-refresh-btn${isRefreshing ? " is-refreshing" : ""}`} onClick={refreshPrices} aria-label="Refresh price data" title="Refresh price data" disabled={isRefreshing}>
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="mobile-country-row" ref={countryPickerRef}>
          <button className="mobile-country-selector" type="button" onClick={() => setCountryDropdownOpen((open) => !open)} aria-expanded={countryDropdownOpen} aria-haspopup="listbox">
            <Globe2 size={17} />
            <span className="country-flag" aria-hidden="true">{countryFlag(selectedCountry.code)}</span>
            <span>{selectedCountry.name}</span>
            {countryDropdownOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
          {countryDropdownOpen ? (
            <div className="mobile-country-dropdown" role="listbox" aria-label="Choose country">
              <label className="country-search">
                <Search size={16} />
                <input autoFocus value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} placeholder="Search country..." aria-label="Search country" />
              </label>
              <div className="country-options">
                {filteredCountries.map((country) => (
                  <button type="button" role="option" aria-selected={country.code === countryCode} key={country.code} onClick={() => selectCountry(country.code)}>
                    <span className="country-option-name"><span aria-hidden="true">{countryFlag(country.code)}</span>{country.name}</span>
                    {country.code === countryCode ? <span className="country-check">✓</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="mobile-quick-actions">
          <label className="mobile-today-button" title={dateLabel(dateValue)}>
            <CalendarDays size={17} />
            <span>{dateLabel(dateValue)}</span>
            <input value={dateValue} max={todayValue()} onChange={(event) => pushFilter({ date: event.target.value })} type="date" aria-label="Select date" />
          </label>
          <span className="mobile-alert-button"><NotificationCenter /></span>
          <button className={`icon-btn mobile-quick-refresh${isRefreshing ? " is-refreshing" : ""}`} onClick={refreshPrices} aria-label="Refresh price data" title="Refresh price data" disabled={isRefreshing}><RefreshCw size={18} /></button>
          <button className="icon-btn mobile-theme-button" onClick={toggleTheme} aria-label="Toggle color theme" disabled={!mounted}>
            {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <nav className={`mobile-menu${mobileMenuOpen ? " open" : ""}`} aria-label="Mobile navigation">
          <Link href="/" onClick={closeMobileMenu}><House size={19} /><span>Home</span></Link>
          <button type="button" onClick={() => toggleSubmenu("prices")} aria-expanded={activeSubmenu === "prices"}><LineChart size={19} /><span>Prices</span>{activeSubmenu === "prices" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
          {renderSubmenu("prices")}
          <Link href="/historical-prices" onClick={closeMobileMenu}><LineChart size={19} /><span>Charts</span></Link>
          <Link href="/investment-return-calculator" onClick={closeMobileMenu}><Bell size={19} /><span>Alerts</span></Link>
          <Link href="/news" onClick={closeMobileMenu}><Newspaper size={19} /><span>News</span></Link>
          <button type="button" onClick={() => toggleSubmenu("tools")} aria-expanded={activeSubmenu === "tools"}><Wrench size={19} /><span>Tools</span>{activeSubmenu === "tools" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
          {renderSubmenu("tools")}
          <button type="button" onClick={() => toggleSubmenu("more")} aria-expanded={activeSubmenu === "more"}><CircleEllipsis size={19} /><span>More</span>{activeSubmenu === "more" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
          {renderSubmenu("more")}
        </nav>
      </div>
    </header>
  );
}
