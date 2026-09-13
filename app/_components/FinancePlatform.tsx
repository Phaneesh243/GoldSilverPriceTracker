"use client";

import "./market-notifications.css";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import AuthMenu from "./AuthMenu";
import { useTheme } from "../_hooks/useTheme";
import AuthModal from "./AuthModal";
import AdSlot from "./AdSlot";
import NotificationCenter from "./NotificationCenter";
import { BarChart3, Calculator, ChevronRight, CircleDollarSign, Coins, LayoutDashboard, Menu, Moon, Newspaper, PieChart, Star, Sun, X } from "lucide-react";

type FinanceScreen =
  | "home"
  | "metals"
  | "news"
  | "article"
  | "watchlist"
  | "portfolio"
  | "add-transaction"
  | "notifications"
  | "calculators"
  | "search";

type IconType = typeof Coins;

type NavItem = {
  label: string;
  href: string;
  match: FinanceScreen[];
  icon: IconType;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", match: ["home"], icon: LayoutDashboard },
  { label: "Metals", href: "/metals", match: ["metals"], icon: Coins },
  { label: "News", href: "/news", match: ["news", "article"], icon: Newspaper },
  { label: "Calculators", href: "/calculators", match: ["calculators"], icon: Calculator },
];

const pageMeta: Record<FinanceScreen, { eyebrow: string; title: string; subtitle: string; section: string }> = {
  home: {
    eyebrow: "Market Intelligence",
    title: "Your complete finance command center.",
    subtitle: "Follow gold, silver, platinum and copper with real reference prices, buying guides and calculators.",
    section: "Metals",
  },
  metals: {
    eyebrow: "India metals",
    title: "Metal prices today in India.",
    subtitle: "Track verified Gold, Silver, Platinum and Copper prices with charts, calculators, news and market updates.",
    section: "Metals",
  },
  news: {
    eyebrow: "Market News",
    title: "Finance news dashboard.",
    subtitle: "Latest metal prices, bullion news, buying guides and market context.",
    section: "News",
  },
  article: {
    eyebrow: "Article",
    title: "Metals news and context.",
    subtitle: "Publisher-attributed headlines and links to original reporting.",
    section: "News",
  },
  watchlist: {
    eyebrow: "Unified Watchlist",
    title: "Everything you follow.",
    subtitle: "Gold, silver, platinum and copper in your personal watchlist.",
    section: "Watchlist",
  },
  portfolio: {
    eyebrow: "Portfolio",
    title: "Portfolio dashboard.",
    subtitle: "Track allocation, P&L, holdings, recent transactions and upcoming reminders.",
    section: "Portfolio",
  },
  "add-transaction": {
    eyebrow: "Portfolio Entry",
    title: "Add transaction.",
    subtitle: "Record buy, sell, dividend, SIP and transfer entries with clean validation-ready fields.",
    section: "Portfolio",
  },
  notifications: {
    eyebrow: "Market updates",
    title: "Your market updates.",
    subtitle: "Two fixed editions at 09:15 and 15:30 IST on regular Indian trading days.",
    section: "Market updates",
  },
  calculators: {
    eyebrow: "Finance Tools",
    title: "Calculators hub.",
    subtitle: "Metal buying, weight, purity, returns and personal finance calculators.",
    section: "Calculators",
  },
  search: {
    eyebrow: "Search",
    title: "Search results.",
    subtitle: "Results across assets, articles, calculators, market updates and portfolio tools.",
    section: "Search",
  },
};

const shellAdScreens = new Set<FinanceScreen>(["home", "portfolio", "add-transaction", "watchlist", "search"]);
const shellAdPaths = new Set([
  "/news/saved",
  "/news/preferences",
]);

function AuthIntent({ onMode }: { onMode: (mode: "login" | "register") => void }) {
  const requested = useSearchParams().get("auth");
  useEffect(() => { if (requested === "login" || requested === "register") onMode(requested); }, [requested, onMode]);
  return null;
}
function FinancePlatformContent({ screen, children, customHeading }: { screen: FinanceScreen; children: React.ReactNode; customHeading?: { title: string; subtitle: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authRefreshToken, setAuthRefreshToken] = useState(0);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const meta = { ...pageMeta[screen], ...customHeading };
  useEffect(() => {
    if (!mobileMenu) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const background = Array.from(document.querySelectorAll<HTMLElement>(".finance-sidebar, .finance-topbar, .finance-main, .finance-footer, .finance-bottom-nav"));
    const oldInert = background.map(el => el.inert);
    background.forEach(el => { el.inert = true; });
    document.body.style.overflow = "hidden";
    drawerCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
      if (event.key === "Tab") {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>("#finance-mobile-drawer a[href], #finance-mobile-drawer button:not([disabled])")).filter(el => el.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const desktop = window.matchMedia("(min-width: 1100px)");
    const closeAtDesktop = () => { if (desktop.matches) setMobileMenu(false); };
    desktop.addEventListener("change", closeAtDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach((el, i) => { el.inert = oldInert[i]; });
      previousFocus?.focus();
      document.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", closeAtDesktop);
    };
  }, [mobileMenu]);

  function closeAuth() {
    setAuthMode(null);
    if (new URLSearchParams(window.location.search).get("auth")) router.replace(pathname);
  }

  const bottomActive = useMemo(() => {
    if (["portfolio", "add-transaction", "watchlist"].includes(screen)) return "Portfolio";
    if (["news", "article"].includes(screen)) return "News";
    if (screen === "notifications") return "";
    return "Markets";
  }, [screen]);

  return (
    <div className="finance-platform" data-finance-theme={theme} data-screen={screen}>
      {pathname === "/" ? <Suspense fallback={null}><AuthIntent onMode={setAuthMode} /></Suspense> : null}
      <aside className="finance-sidebar" aria-label="Finance navigation">
        <Brand />
        <nav className="finance-side-links">
          {navItems.map((item) => (
            <NavLink key={item.label} item={item} active={item.match.includes(screen)} />
          ))}
        </nav>
        <div className="finance-side-footer">
          <Link href="/watchlist"><Star size={20} />Watchlist</Link>
          <Link href="/portfolio"><PieChart size={20} />Portfolio</Link>
        </div>
      </aside>

      <div className="finance-shell">
        <header className="finance-topbar">
          <button className="mobile-icon" type="button" aria-label="Open menu" aria-expanded={mobileMenu} aria-controls="finance-mobile-drawer" onClick={() => setMobileMenu(true)}>
            <Menu size={23} />
          </button>
          <Link className="mobile-brand" href="/" aria-label="GoldSilverPrices home"><span className="mobile-brand-name">Gold<span>Silver</span>Prices</span><span className="mobile-brand-short" aria-hidden="true">GSP</span></Link>
          <div className="finance-actions">
            <button className="icon-action" type="button" aria-label="Toggle theme" title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} aria-pressed={theme === "dark"} onClick={toggleTheme}>
              {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <NotificationCenter />
            <AuthMenu onOpen={setAuthMode} refreshToken={authRefreshToken} />
          </div>
        </header>

        {mobileMenu ? (
          <div className="mobile-drawer" id="finance-mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileMenu(false); }}>
            <div className="drawer-panel">
              <div className="drawer-head">
                <Brand compact />
                <button ref={drawerCloseRef} className="icon-action" type="button" aria-label="Close menu" onClick={() => setMobileMenu(false)}><X size={22} /></button>
              </div>
              {navItems.map((item) => (
                <NavLink key={item.label} item={item} active={item.match.includes(screen)} onClick={() => setMobileMenu(false)} />
              ))}
              <Link href="/watchlist" onClick={() => setMobileMenu(false)}><Star size={20} />Watchlist</Link>
              <Link href="/portfolio" onClick={() => setMobileMenu(false)}><PieChart size={20} />Portfolio</Link>
            </div>
          </div>
        ) : null}

        <main className="finance-main">
          {screen !== "home" ? (
            <section className="finance-hero">
              <div>
                <span className="finance-eyebrow">{meta.eyebrow}</span>
                <h1>{meta.title}</h1>
                <p>{meta.subtitle}</p>
              </div>
              {screen !== "notifications" ? <div className="hero-command">
                <span>{meta.section}</span>
                <Link href="/watchlist">Add to watchlist <ChevronRight size={16} /></Link>
              </div> : null}
            </section>
          ) : null}
          {shellAdScreens.has(screen) || shellAdPaths.has(pathname) ? <AdSlot id={`${screen}-shell-after-hero`} module={meta.section.toLowerCase().replaceAll(" ", "-")} placement={screen === "home" ? "top" : "after-hero"} label={`${meta.section} advertisement`} /> : null}
          {children}
        </main>
        <footer className="finance-footer">
          <span>Informational use only. Verify provider terms before acting.</span>
          <a href="mailto:phaneesh19@gmail.com">Support: phaneesh19@gmail.com</a>
        </footer>
      </div>

      {authMode ? <AuthModal mode={authMode} onClose={closeAuth} onSuccess={() => setAuthRefreshToken((value) => value + 1)} onSwitchMode={setAuthMode} /> : null}

      <nav className="finance-bottom-nav" aria-label="Mobile primary navigation">
        {[
          ["Markets", "/", BarChart3],
          ["News", "/news", Newspaper],
          ["Portfolio", "/portfolio", PieChart],
        ].map(([label, href, Icon]) => (
          <Link key={label as string} className={bottomActive === label ? "active" : ""} href={href as string}>
            <Icon size={22} />
            <span>{label as string}</span>
          </Link>
        ))}
        <button className="finance-bottom-menu" type="button" aria-expanded={mobileMenu} aria-controls="finance-mobile-drawer" onClick={() => setMobileMenu(true)}><Menu size={22} /><span>Menu</span></button>
      </nav>
    </div>
  );
}

export default function FinancePlatform({ screen, children, customHeading }: { screen: FinanceScreen; children: React.ReactNode; customHeading?: { title: string; subtitle: string } }) {
  return (
    <Suspense fallback={<div className="finance-platform" aria-busy="true" /> }>
      <FinancePlatformContent screen={screen} customHeading={customHeading}>{children}</FinancePlatformContent>
    </Suspense>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={compact ? "finance-brand compact" : "finance-brand"} href="/">
      <span className="brand-mark"><CircleDollarSign size={compact ? 19 : 22} /></span>
      <span>
        <strong>Gold<span>Silver</span>Prices</strong>
        {!compact ? <small>Market Intelligence</small> : null}
      </span>
    </Link>
  );
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link className={active ? "active" : ""} href={item.href} onClick={onClick}>
      <Icon size={20} />
      <span>{item.label}</span>
    </Link>
  );
}
