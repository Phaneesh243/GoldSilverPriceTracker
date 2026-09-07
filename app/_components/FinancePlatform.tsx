"use client";

import "./market-notifications.css";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import AuthMenu from "./AuthMenu";
import { useTheme } from "../_hooks/useTheme";
import AuthModal from "./AuthModal";
import AdSlot from "./AdSlot";
import NotificationCenter from "./NotificationCenter";
import CurrencyDashboard from "./CurrencyDashboard";
import { WatchlistManager } from "./WatchlistAlertsClient";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bitcoin,
  Bookmark,
  Calculator,
  ChevronRight,
  CircleDollarSign,
  Coins,
  CreditCard,
  FileText,
  LayoutDashboard,
  Landmark,
  LineChart,
  Menu,
  Moon,
  Newspaper,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Star,
  Sun,
  Wallet,
  X,
} from "lucide-react";

type FinanceScreen =
  | "home"
  | "metals"
  | "stocks"
  | "stock-detail"
  | "crypto"
  | "mutual-funds"
  | "fund-detail"
  | "bonds"
  | "insurance"
  | "insurance-compare"
  | "currencies"
  | "news"
  | "article"
  | "watchlist"
  | "portfolio"
  | "add-transaction"
  | "notifications"
  | "calculators"
  | "search";

type Trend = "up" | "down";
type IconType = typeof Coins;

type Asset = {
  name: string;
  symbol: string;
  type: string;
  price: string;
  change: string;
  trend: Trend;
  color: string;
};

type NavItem = {
  label: string;
  href: string;
  match: FinanceScreen[];
  icon: IconType;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", match: ["home"], icon: LayoutDashboard },
  { label: "Metals", href: "/metals", match: ["metals"], icon: Coins },
  { label: "Stocks", href: "/stocks", match: ["stocks", "stock-detail"], icon: LineChart },
  { label: "Crypto", href: "/crypto", match: ["crypto"], icon: Bitcoin },
  { label: "Mutual Funds", href: "/mutual-funds", match: ["mutual-funds", "fund-detail"], icon: Wallet },
  { label: "Bonds", href: "/bonds", match: ["bonds"], icon: FileText },
  { label: "Insurance", href: "/insurance", match: ["insurance", "insurance-compare"], icon: Shield },
  { label: "Currencies", href: "/currencies", match: ["currencies"], icon: CircleDollarSign },
  { label: "News", href: "/news", match: ["news", "article"], icon: Newspaper },
  { label: "Calculators", href: "/calculators", match: ["calculators"], icon: Calculator },
];

const pageMeta: Record<FinanceScreen, { eyebrow: string; title: string; subtitle: string; section: string }> = {
  home: {
    eyebrow: "Market Intelligence",
    title: "Your complete finance command center.",
    subtitle: "Track metals, stocks, crypto, funds, bonds, insurance, currencies and market updates from one premium dashboard.",
    section: "Metals",
  },
  metals: {
    eyebrow: "Live Metals",
    title: "Metal prices today in India.",
    subtitle: "Track verified Gold, Silver, Platinum and Copper prices with charts, calculators, news and market updates.",
    section: "Metals",
  },
  stocks: {
    eyebrow: "Equity Markets",
    title: "Stock market dashboard.",
    subtitle: "Major indices, trending equities, sector movers and real-time watchlist signals.",
    section: "Stocks",
  },
  "stock-detail": {
    eyebrow: "Stock Detail",
    title: "Apple Inc. AAPL.",
    subtitle: "Company snapshot, performance chart, analyst notes and portfolio actions.",
    section: "Stocks",
  },
  crypto: {
    eyebrow: "Digital Assets",
    title: "Crypto market dashboard.",
    subtitle: "Bitcoin, Ethereum and large-cap crypto market movement with dominance and volume signals.",
    section: "Crypto",
  },
  "mutual-funds": {
    eyebrow: "Fund Discovery",
    title: "Mutual funds dashboard.",
    subtitle: "Compare equity, debt, hybrid and index funds by return, risk and expense ratio.",
    section: "Mutual Funds",
  },
  "fund-detail": {
    eyebrow: "Fund Detail",
    title: "Bluechip Growth Fund.",
    subtitle: "NAV performance, holdings, allocation, risk metrics and SIP actions.",
    section: "Mutual Funds",
  },
  bonds: {
    eyebrow: "Fixed Income",
    title: "Bonds dashboard.",
    subtitle: "Government, corporate and tax-free bonds sorted by yield, maturity and risk quality.",
    section: "Bonds",
  },
  insurance: {
    eyebrow: "Protection",
    title: "Insurance dashboard.",
    subtitle: "Health, term, vehicle and life insurance plans with premium and coverage comparisons.",
    section: "Insurance",
  },
  "insurance-compare": {
    eyebrow: "Compare Plans",
    title: "Insurance comparison.",
    subtitle: "Side-by-side coverage, claim ratio, exclusions, premium and renewal terms.",
    section: "Insurance",
  },
  currencies: {
    eyebrow: "Forex",
    title: "Currency dashboard.",
    subtitle: "USD, EUR, GBP, JPY and global FX rates with converter-ready market data.",
    section: "Currencies",
  },
  news: {
    eyebrow: "Market News",
    title: "Finance news dashboard.",
    subtitle: "Latest stories across stocks, crypto, metals, funds, bonds, policy and insurance.",
    section: "News",
  },
  article: {
    eyebrow: "Article",
    title: "Central banks lift gold reserves.",
    subtitle: "A full article detail layout for long-form finance news and market context.",
    section: "News",
  },
  watchlist: {
    eyebrow: "Unified Watchlist",
    title: "Everything you follow.",
    subtitle: "Stocks, crypto, metals, funds and currency pairs in one personalized watchlist.",
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
    subtitle: "SIP, EMI, CAGR, currency conversion, tax, gold buying and retirement calculators.",
    section: "Calculators",
  },
  search: {
    eyebrow: "Search",
    title: "Search results.",
    subtitle: "Results across assets, articles, calculators, market updates and portfolio tools.",
    section: "Search",
  },
};

const heroAssets: Asset[] = [
  { name: "Gold Spot", symbol: "XAU/USD", type: "Metal", price: "$2,345.60", change: "+1.24%", trend: "up", color: "#efc138" },
  { name: "Silver Spot", symbol: "XAG/USD", type: "Metal", price: "$29.40", change: "-0.45%", trend: "down", color: "#c6c6cd" },
  { name: "S&P 500", symbol: "SPX", type: "Index", price: "5,234.18", change: "+0.80%", trend: "up", color: "#4ade80" },
  { name: "Bitcoin", symbol: "BTC/USD", type: "Crypto", price: "$64,210", change: "-2.10%", trend: "down", color: "#f59e0b" },
];

const marketRows: Asset[] = [
  { name: "Gold Spot", symbol: "XAU/USD", type: "Metal", price: "$2,345.60", change: "+1.24%", trend: "up", color: "#efc138" },
  { name: "Apple", symbol: "AAPL", type: "Equity", price: "$178.25", change: "-1.20%", trend: "down", color: "#60a5fa" },
  { name: "Bitcoin", symbol: "BTC/USD", type: "Crypto", price: "$64,210", change: "+3.45%", trend: "up", color: "#f59e0b" },
  { name: "Bluechip Growth", symbol: "BGF", type: "Mutual Fund", price: "$54.18", change: "+0.62%", trend: "up", color: "#a78bfa" },
  { name: "US 10Y Treasury", symbol: "UST10Y", type: "Bond", price: "4.18%", change: "-0.04%", trend: "down", color: "#38bdf8" },
  { name: "USD / INR", symbol: "USDINR", type: "Currency", price: "83.12", change: "+0.18%", trend: "up", color: "#34d399" },
];

const newsItems = [
  {
    tag: "Metals",
    title: "Gold breaks resistance as investors move back into safe-haven assets",
    text: "Central-bank demand and rate-cut expectations keep bullion bids elevated through the morning session.",
    image: "/news/gold-bars-01.jpg",
  },
  {
    tag: "Markets",
    title: "Tech stocks rebound after AI earnings beat expectations",
    text: "Large-cap software and semiconductor names lead the recovery while small caps stay mixed.",
    image: "/news/trading-screen-09.jpg",
  },
  {
    tag: "Funds",
    title: "Hybrid funds see stronger SIP inflows from first-time investors",
    text: "Balanced allocation products continue to attract conservative investors seeking smoother returns.",
    image: "/news/market-chart-05.jpg",
  },
];

const calculators = [
  ["SIP Calculator", "Estimate monthly investment growth.", Calculator],
  ["EMI Calculator", "Plan loan payments and interest.", CreditCard],
  ["Gold Calculator", "Convert grams, ounces and purity.", Coins],
  ["Currency Converter", "Convert global FX pairs.", RefreshCw],
  ["CAGR Calculator", "Measure annualized returns.", LineChart],
  ["Tax Estimator", "Preview taxable gains.", FileText],
  ["Retirement Planner", "Build long-term corpus targets.", Landmark],
  ["Insurance Need", "Estimate protection coverage.", Shield],
] as const;

const allocation = [
  ["Stocks", "42%", "#4ade80"],
  ["Metals", "24%", "#efc138"],
  ["Funds", "18%", "#a78bfa"],
  ["Bonds", "10%", "#38bdf8"],
  ["Cash", "6%", "#94a3b8"],
];

const shellAdScreens = new Set<FinanceScreen>(["home", "portfolio", "add-transaction", "watchlist", "search"]);
const shellAdPaths = new Set([
  "/stocks",
  "/stocks/top-10",
  "/stocks/nifty-50",
  "/stocks/brokers",
  "/stocks/compare",
  "/stocks/under-10",
  "/stocks/under-50",
  "/stocks/under-100",
  "/insurance/providers",
  "/news/saved",
  "/news/preferences",
]);

function FinancePlatformContent({ screen, children }: { screen: FinanceScreen; children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenu, setMobileMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authRefreshToken, setAuthRefreshToken] = useState(0);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const meta = pageMeta[screen];
  useEffect(() => {
    const requestedMode = searchParams.get("auth");
    if (pathname === "/" && (requestedMode === "login" || requestedMode === "register")) setAuthMode(requestedMode);
  }, [pathname, searchParams]);
  useEffect(() => {
    if (!mobileMenu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenu]);

  function closeAuth() {
    setAuthMode(null);
    if (searchParams.get("auth")) router.replace(pathname);
  }

  const bottomActive = useMemo(() => {
    if (["portfolio", "add-transaction", "watchlist"].includes(screen)) return "Portfolio";
    if (["news", "article"].includes(screen)) return "News";
    if (screen === "notifications") return "";
    return "Markets";
  }, [screen]);

  return (
    <div className="finance-platform" data-finance-theme={theme}>
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
          <Link className="mobile-brand" href="/">Gold<span>Silver</span>Prices</Link>
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
          {shellAdScreens.has(screen) || shellAdPaths.has(pathname) || screen === "currencies" ? <AdSlot id={`${screen}-shell-after-hero`} module={meta.section.toLowerCase().replaceAll(" ", "-")} placement={screen === "home" ? "top" : "after-hero"} label={`${meta.section} advertisement`} /> : null}
          {children ?? renderScreen(screen, pathname)}
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

export default function FinancePlatform({ screen, children }: { screen: FinanceScreen; children?: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="finance-platform" aria-busy="true" /> }>
      <FinancePlatformContent screen={screen}>{children}</FinancePlatformContent>
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

function renderScreen(screen: FinanceScreen, pathname: string) {
  if (screen === "currencies") return <CurrencyDashboard />;
  if (screen === "stock-detail") return <DetailScreen kind="stock" />;
  if (screen === "fund-detail") return <DetailScreen kind="fund" />;
  if (screen === "article") return <ArticleScreen />;
  if (screen === "portfolio") return <PortfolioScreen />;
  if (screen === "add-transaction") return <TransactionScreen />;
  if (screen === "notifications") return null;
  if (screen === "calculators") return <CalculatorsScreen />;
  if (screen === "search") return <SearchScreen />;
  if (screen === "insurance-compare") return <InsuranceCompareScreen />;
  if (screen === "watchlist") return <WatchlistScreen />;
  const focus = screen === "home" ? "home" : screen;
  return <DashboardScreen focus={focus} pathname={pathname} />;
}

function DashboardScreen({ focus }: { focus: string; pathname: string }) {
  const cards = focus === "home" || focus === "metals" ? heroAssets : themedAssets(focus);
  return (
    <div className="finance-grid">
      <section className="finance-primary-column">
        <div className="asset-card-row">
          {cards.map((asset) => <MarketCard key={asset.symbol} asset={asset} />)}
        </div>
        <MarketTable rows={themedRows(focus)} />
        <NewsStrip />
      </section>
      <aside className="finance-right-rail">
        <WatchlistPanel />
        <QuickTools />
        <MoversPanel />
      </aside>
    </div>
  );
}

function MarketCard({ asset }: { asset: Asset }) {
  const TrendIcon = asset.trend === "up" ? ArrowUpRight : ArrowDownRight;
  const href = asset.symbol === "XAU/USD" ? "/gold-price-today" : asset.symbol === "XAG/USD" ? "/silver-price-today" : undefined;
  const content = (
    <>
      <div className="market-card-top">
        <div className="asset-badge" style={{ "--asset-color": asset.color } as React.CSSProperties}>{asset.symbol.slice(0, 2)}</div>
        <span className={asset.trend === "up" ? "trend up" : "trend down"}><TrendIcon size={14} />{asset.change}</span>
      </div>
      <div>
        <h3>{asset.name}</h3>
        <p>{asset.symbol} - {asset.type}</p>
      </div>
      <strong style={{ color: asset.color }}>{asset.price}</strong>
      <Sparkline color={asset.color} trend={asset.trend} />
    </>
  );

  if (href) {
    return <Link className="market-card" href={href} aria-label={`Open ${asset.name} details`}>{content}</Link>;
  }

  return (
    <article className="market-card">
      {content}
    </article>
  );
}

function MarketChart({ title }: { title: string }) {
  return (
    <section className="glass-panel chart-panel">
      <div className="panel-head">
        <div>
          <span className="finance-eyebrow">Interactive Price Chart</span>
          <h2>{title}</h2>
        </div>
        <div className="range-tabs" aria-label="Chart range">
          {["1D", "1W", "1M", "6M", "1Y"].map((range, index) => <button className={index === 1 ? "active" : ""} type="button" key={range}>{range}</button>)}
        </div>
      </div>
      <div className="chart-canvas">
        <svg viewBox="0 0 900 260" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="financeChartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#efc138" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#efc138" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[60, 120, 180, 240].map((y) => <line key={y} x1="0" x2="900" y1={y} y2={y} />)}
          <path d="M0 230 C95 180 130 205 205 150 S355 88 430 118 S590 195 690 92 S790 82 900 44 L900 260 L0 260 Z" fill="url(#financeChartFill)" />
          <path d="M0 230 C95 180 130 205 205 150 S355 88 430 118 S590 195 690 92 S790 82 900 44" fill="none" stroke="#efc138" strokeWidth="4" />
        </svg>
      </div>
    </section>
  );
}

function MarketTable({ rows }: { rows: Asset[] }) {
  return (
    <section className="glass-panel table-panel">
      <div className="panel-head">
        <div>
          <span className="finance-eyebrow">Market Movers</span>
          <h2>Most watched assets</h2>
        </div>
        <Link href="/watchlist" className="small-link">View all <ChevronRight size={16} /></Link>
      </div>
      <div className="responsive-table">
        <table>
          <thead><tr><th>Asset</th><th>Price</th><th>24h</th><th>Volume</th><th /></tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.symbol}>
                <td>
                  <div className="table-asset">
                    <span className="asset-badge small" style={{ "--asset-color": row.color } as React.CSSProperties}>{row.symbol.slice(0, 2)}</span>
                    <span><strong>{row.name}</strong><small>{row.symbol} - {row.type}</small></span>
                  </div>
                </td>
                <td>{row.price}</td>
                <td className={row.trend === "up" ? "positive" : "negative"}>{row.change}</td>
                <td className="desktop-table-cell">{index % 2 === 0 ? "128K" : "82K"}</td>
                <td><button type="button" aria-label={`Add ${row.name}`}><Plus size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WatchlistPanel() {
  return (
    <section className="glass-panel side-panel">
      <div className="panel-head compact"><h2>My Watchlist</h2><Bookmark size={18} /></div>
      {marketRows.slice(0, 4).map((item) => (
        <div className="mini-row" key={item.symbol}>
          <span style={{ background: item.color }} />
          <div><strong>{item.symbol}</strong><small>{item.type}</small></div>
          <div><b>{item.price}</b><em className={item.trend === "up" ? "positive" : "negative"}>{item.change}</em></div>
        </div>
      ))}
      <Link href="/watchlist" className="outline-button"><Plus size={17} />Add Symbol</Link>
    </section>
  );
}

function QuickTools() {
  return (
    <section className="glass-panel side-panel">
      <div className="panel-head compact"><h2>Quick Tools</h2></div>
      <div className="tool-grid">
        {calculators.slice(0, 4).map(([name, , Icon]) => (
          <Link href="/calculators" key={name}><Icon size={24} /><span>{name.replace(" Calculator", "")}</span></Link>
        ))}
      </div>
    </section>
  );
}

function MoversPanel() {
  return (
    <section className="glass-panel side-panel">
      <div className="panel-head compact"><h2>Top Movers</h2></div>
      <div className="mover-group"><small>Gainers</small><p><span>NVIDIA</span><b className="positive">+4.2%</b></p><p><span>Tesla</span><b className="positive">+3.8%</b></p></div>
      <div className="mover-group"><small>Losers</small><p><span>Meta</span><b className="negative">-2.1%</b></p><p><span>Netflix</span><b className="negative">-1.5%</b></p></div>
    </section>
  );
}

function NewsStrip() {
  return (
    <section className="glass-panel news-panel">
      <div className="panel-head">
        <div><span className="finance-eyebrow">Latest Insights</span><h2>Market news</h2></div>
        <Link href="/news" className="small-link">Read all <ChevronRight size={16} /></Link>
      </div>
      <div className="news-grid">
        {newsItems.map((item) => (
          <article key={item.title} className="news-card">
            <Image className="news-image" src={item.image} alt="" width={640} height={360} />
            <div><span>{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p><small>2 hours ago</small></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DetailScreen({ kind }: { kind: "stock" | "fund" }) {
  const isStock = kind === "stock";
  return (
    <div className="finance-grid detail-grid">
      <section className="finance-primary-column">
        <div className="detail-header glass-panel">
          <div className="asset-badge large" style={{ "--asset-color": isStock ? "#60a5fa" : "#a78bfa" } as React.CSSProperties}>{isStock ? "AP" : "BF"}</div>
          <div><span className="finance-eyebrow">{isStock ? "NASDAQ - Technology" : "Equity Fund - Large Cap"}</span><h2>{isStock ? "Apple Inc." : "Bluechip Growth Fund"}</h2><p>{isStock ? "AAPL" : "NAV $54.18"} - Updated moments ago</p></div>
          <strong>{isStock ? "$178.25" : "$54.18"}</strong>
        </div>
        <MarketChart title={isStock ? "AAPL performance" : "NAV movement"} />
        <section className="glass-panel split-panel">
          <div><span className="finance-eyebrow">Key Metrics</span><MetricGrid items={isStock ? [["Market Cap", "$2.8T"], ["P/E Ratio", "29.4"], ["Dividend Yield", "0.54%"], ["52W High", "$198.23"]] : [["3Y Return", "18.4%"], ["Expense Ratio", "0.74%"], ["AUM", "$4.8B"], ["Risk", "Moderate"]]} /></div>
          <div><span className="finance-eyebrow">Actions</span><div className="action-stack"><Link href="/portfolio/add-transaction">Add transaction</Link><Link href="/notifications">Market updates</Link><Link href="/watchlist">Add to watchlist</Link></div></div>
        </section>
      </section>
      <aside className="finance-right-rail"><WatchlistPanel /><MoversPanel /></aside>
    </div>
  );
}

function PortfolioScreen() {
  return (
    <div className="finance-grid">
      <section className="finance-primary-column">
        <div className="kpi-grid"><Kpi title="Portfolio Value" value="$128,420" change="+8.4%" /><Kpi title="Day P&L" value="$1,284" change="+1.1%" /><Kpi title="Invested" value="$102,800" change="+24.9%" /><Kpi title="Cash" value="$7,240" change="Ready" /></div>
        <section className="glass-panel allocation-panel">
          <div className="panel-head"><div><span className="finance-eyebrow">Allocation</span><h2>Asset allocation</h2></div><Link href="/portfolio/add-transaction" className="primary-button"><Plus size={17} />Add transaction</Link></div>
          {allocation.map(([label, value, color]) => <div className="allocation-row" key={label}><span>{label}</span><div><i style={{ width: value, background: color }} /></div><b>{value}</b></div>)}
        </section>
        <MarketTable rows={marketRows.slice(0, 5)} />
      </section>
      <aside className="finance-right-rail"><QuickTools /><AlertsPreview /></aside>
    </div>
  );
}

function TransactionScreen() {
  return (
    <section className="glass-panel form-panel">
      <div className="panel-head"><div><span className="finance-eyebrow">New Entry</span><h2>Add transaction</h2></div></div>
      <form className="finance-form">
        {["Asset name or symbol", "Transaction date", "Quantity", "Price per unit", "Fees", "Notes"].map((label, index) => <label key={label} className={index === 5 ? "full" : ""}><span>{label}</span><input type={label.includes("date") ? "date" : "text"} placeholder={label} /></label>)}
        <label><span>Type</span><select defaultValue="Buy"><option>Buy</option><option>Sell</option><option>Dividend</option><option>SIP</option></select></label>
        <button className="primary-button full" type="button">Save transaction</button>
      </form>
    </section>
  );
}



function CalculatorsScreen() {
  return (
    <section className="calculator-hub">
      {calculators.map(([name, text, Icon]) => (
        <Link href={calculatorHref(name)} className="glass-panel calculator-card" key={name}><Icon size={28} /><h2>{name}</h2><p>{text}</p><ChevronRight size={18} /></Link>
      ))}
    </section>
  );
}

function calculatorHref(name: string) {
  const slugs: Record<string, string> = {
    "SIP Calculator": "/calculators/sip",
    "EMI Calculator": "/calculators/emi",
    "Gold Calculator": "/calculators/gold",
    "Currency Converter": "/calculators/currency",
    "CAGR Calculator": "/calculators/cagr",
    "Tax Estimator": "/calculators/tax",
    "Retirement Planner": "/calculators/sip",
    "Insurance Need": "/calculators/tax",
  };
  return slugs[name] ?? "/calculators";
}

function SearchScreen() {
  return (
    <section className="search-screen">
      <div className="large-search glass-panel"><Search size={20} /><input defaultValue="gold stocks funds" aria-label="Search query" /></div>
      <MarketTable rows={marketRows} />
      <NewsStrip />
    </section>
  );
}

function WatchlistScreen() {
  return <WatchlistManager />;
}

function InsuranceCompareScreen() {
  return (
    <div className="compare-grid">
      {["Secure Health Plus", "Family Shield Pro", "Term Life Max"].map((plan, index) => (
        <article className="glass-panel compare-card" key={plan}>
          <Shield size={30} /><h2>{plan}</h2><strong>${index === 0 ? "42" : index === 1 ? "58" : "31"}/mo</strong><p>Claim ratio {index === 0 ? "96%" : index === 1 ? "94%" : "98%"} - Coverage up to ${index + 1}M</p><button className={index === 0 ? "primary-button" : "outline-button"} type="button">Compare</button>
        </article>
      ))}
      <section className="glass-panel table-panel full"><MetricGrid items={[["Room Rent", "No cap"], ["Waiting Period", "24 months"], ["Cashless Hospitals", "8,400+"], ["Renewal", "Lifetime"]]} /></section>
    </div>
  );
}

function ArticleScreen() {
  return (
    <article className="glass-panel article-screen">
      <Image className="article-image" src="/news/gold-bullion-02.jpg" alt="" width={960} height={540} />
      <span className="finance-eyebrow">Metals - 6 min read</span>
      <h2>Central banks lift gold reserves as inflation concerns stay sticky</h2>
      <p>Gold demand is holding firm as reserve managers and long-term investors continue to diversify away from volatile currency exposure. The move keeps spot prices supported while traders wait for clearer interest-rate guidance.</p>
      <p>Analysts are watching real yields, ETF inflows and central-bank purchase data. For everyday investors, the stronger signal is that portfolio hedging demand remains alive across both institutional and retail markets.</p>
    </article>
  );
}

function AlertsPreview() {
  return <section className="glass-panel form-panel"><h2>Market updates</h2><p>Two provider-backed editions per regular trading day. No custom price rules.</p><Link href="/notifications">Manage subscription</Link></section>;
}

function MetricGrid({ items }: { items: string[][] }) {
  return <div className="metric-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function Kpi({ title, value, change }: { title: string; value: string; change: string }) {
  return <article className="glass-panel kpi-card"><span>{title}</span><strong>{value}</strong><small>{change}</small></article>;
}

function Sparkline({ color, trend }: { color: string; trend: Trend }) {
  const up = "M0 34 C18 20 28 28 42 18 S69 4 88 12 S112 19 130 2";
  const down = "M0 8 C18 21 30 12 45 24 S70 42 88 28 S112 20 130 36";
  return <svg className="mini-spark" viewBox="0 0 130 44" aria-hidden="true"><path d={trend === "up" ? up : down} fill="none" stroke={color} strokeWidth="3" /></svg>;
}

function themedAssets(focus: string): Asset[] {
  const map: Record<string, Asset[]> = {
    stocks: [
      { name: "S&P 500", symbol: "SPX", type: "Index", price: "5,234.18", change: "+0.80%", trend: "up", color: "#4ade80" },
      { name: "Apple", symbol: "AAPL", type: "Equity", price: "$178.25", change: "-1.20%", trend: "down", color: "#60a5fa" },
      { name: "NVIDIA", symbol: "NVDA", type: "Equity", price: "$924.11", change: "+4.20%", trend: "up", color: "#22c55e" },
      { name: "Tesla", symbol: "TSLA", type: "Equity", price: "$198.48", change: "+3.80%", trend: "up", color: "#f87171" },
    ],
    crypto: [
      { name: "Bitcoin", symbol: "BTC", type: "Crypto", price: "$64,210", change: "+3.45%", trend: "up", color: "#f59e0b" },
      { name: "Ethereum", symbol: "ETH", type: "Crypto", price: "$3,120", change: "+2.14%", trend: "up", color: "#818cf8" },
      { name: "Solana", symbol: "SOL", type: "Crypto", price: "$142.90", change: "-1.04%", trend: "down", color: "#a855f7" },
      { name: "Cardano", symbol: "ADA", type: "Crypto", price: "$0.58", change: "+0.72%", trend: "up", color: "#38bdf8" },
    ],
    "mutual-funds": [
      { name: "Bluechip Growth", symbol: "BGF", type: "Equity", price: "$54.18", change: "+0.62%", trend: "up", color: "#a78bfa" },
      { name: "Balanced Advantage", symbol: "BAF", type: "Hybrid", price: "$32.40", change: "+0.21%", trend: "up", color: "#34d399" },
      { name: "Liquid Fund", symbol: "LF", type: "Debt", price: "$18.84", change: "+0.04%", trend: "up", color: "#38bdf8" },
      { name: "Index Plus", symbol: "IP", type: "Index", price: "$41.70", change: "-0.18%", trend: "down", color: "#f472b6" },
    ],
    bonds: [
      { name: "US 10Y Treasury", symbol: "UST", type: "Govt", price: "4.18%", change: "-0.04%", trend: "down", color: "#38bdf8" },
      { name: "AAA Corporate", symbol: "AAA", type: "Corp", price: "7.32%", change: "+0.08%", trend: "up", color: "#60a5fa" },
      { name: "Tax Free 2034", symbol: "TFB", type: "Tax Free", price: "6.12%", change: "+0.02%", trend: "up", color: "#4ade80" },
      { name: "Municipal Bond", symbol: "MUN", type: "Municipal", price: "5.44%", change: "-0.01%", trend: "down", color: "#a78bfa" },
    ],
    insurance: [
      { name: "Secure Health", symbol: "SHP", type: "Health", price: "$42/mo", change: "96% CSR", trend: "up", color: "#4ade80" },
      { name: "Term Life Max", symbol: "TLM", type: "Term", price: "$31/mo", change: "98% CSR", trend: "up", color: "#60a5fa" },
      { name: "Auto Shield", symbol: "AUT", type: "Vehicle", price: "$24/mo", change: "-8% premium", trend: "down", color: "#f59e0b" },
      { name: "Family Cover", symbol: "FAM", type: "Family", price: "$58/mo", change: "94% CSR", trend: "up", color: "#a78bfa" },
    ],
    currencies: [
      { name: "USD / INR", symbol: "USD", type: "Currency", price: "83.12", change: "+0.18%", trend: "up", color: "#34d399" },
      { name: "EUR / USD", symbol: "EUR", type: "Currency", price: "1.09", change: "-0.08%", trend: "down", color: "#60a5fa" },
      { name: "GBP / USD", symbol: "GBP", type: "Currency", price: "1.28", change: "+0.12%", trend: "up", color: "#a78bfa" },
      { name: "JPY / USD", symbol: "JPY", type: "Currency", price: "0.0068", change: "-0.04%", trend: "down", color: "#f59e0b" },
    ],
    news: heroAssets,
  };
  return map[focus] ?? heroAssets;
}

function themedRows(focus: string) {
  return focus === "home" || focus === "metals" ? marketRows : themedAssets(focus).concat(marketRows).slice(0, 6);
}
