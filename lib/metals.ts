export type MetalKey = "gold" | "silver" | "platinum" | "copper";
export type MetalStatus = "available" | "unavailable";

export type MetalConfig = {
  key: MetalKey;
  name: string;
  symbol: string;
  route: string;
  last10Route: string;
  color: string;
  unit: "gram" | "kg";
  unitLabel: string;
  apiSymbol?: "XAU" | "XAG" | "XPT" | "HG";
  investorUse: string;
  riskNote: string;
  searchLabel: string;
};

export const metals: MetalConfig[] = [
  {
    key: "gold",
    name: "Gold",
    symbol: "Au",
    route: "/gold-price-today",
    last10Route: "/gold-price-last-10-days",
    color: "#d89b13",
    unit: "gram",
    unitLabel: "per gram",
    apiSymbol: "XAU",
    investorUse: "Store of value, jewellery, coins, ETFs and sovereign gold bonds.",
    riskNote: "Gold can move with currency rates, global yields, central-bank demand and safe-haven sentiment.",
    searchLabel: "Gold price today",
  },
  {
    key: "silver",
    name: "Silver",
    symbol: "Ag",
    route: "/silver-price-today",
    last10Route: "/silver-price-last-10-days",
    color: "#94a3b8",
    unit: "gram",
    unitLabel: "per gram",
    apiSymbol: "XAG",
    investorUse: "Coins, bars, jewellery and industrial demand exposure.",
    riskNote: "Silver is usually more volatile because it reacts to both investment and industrial demand.",
    searchLabel: "Silver price today",
  },
  {
    key: "platinum",
    name: "Platinum",
    symbol: "Pt",
    route: "/platinum-price-today",
    last10Route: "/platinum-price-last-10-days",
    color: "#64748b",
    unit: "gram",
    unitLabel: "per gram",
    apiSymbol: "XPT",
    investorUse: "Premium jewellery, autocatalysts, industrial usage and precious-metal diversification.",
    riskNote: "Platinum can react sharply to mining supply, auto-sector demand and global industrial cycles.",
    searchLabel: "Platinum price today",
  },
  {
    key: "copper",
    name: "Copper",
    symbol: "Cu",
    route: "/copper-price-today",
    last10Route: "/copper-price-last-10-days",
    color: "#b45309",
    unit: "kg",
    unitLabel: "per kg",
    apiSymbol: "HG",
    investorUse: "Industrial metal linked to construction, power, electronics and manufacturing demand.",
    riskNote: "Copper is cyclical and can move with infrastructure demand, China growth, inventories and USD movement.",
    searchLabel: "Copper price today",
  },
];

export function getMetalConfig(key: string | null | undefined) {
  return metals.find((metal) => metal.key === key) ?? metals[0];
}

export function metalFromRouteSlug(slug: string) {
  return metals.find((metal) => metal.key === slug.replace(/-price-today$/, "")) ?? null;
}

export const mostSearchedMetalLinks = [
  { label: "Gold price today", href: "/gold-price-today", helper: "24K, 22K and 18K rates" },
  { label: "Silver price today", href: "/silver-price-today", helper: "Gram, 10g and kg rates" },
  { label: "22K gold price today", href: "/gold-price-today#22k", helper: "Jewellery benchmark" },
  { label: "24K gold price today", href: "/gold-price-today#24k", helper: "Pure gold benchmark" },
  { label: "Silver price per kg", href: "/silver-price-today#kg", helper: "Bulk silver reference" },
  { label: "Platinum price today", href: "/platinum-price-today", helper: "Live Pt spot conversion" },
  { label: "Copper price today", href: "/copper-price-today", helper: "Industrial metal rate" },
  { label: "Gold price in Mumbai", href: "/gold-price/mumbai", helper: "Local city page" },
  { label: "Gold price in Chennai", href: "/gold-price/chennai", helper: "Local city page" },
  { label: "Gold price last 10 days", href: "/gold-price-last-10-days", helper: "Recent daily trend" },
  { label: "Compare metal prices", href: "/metal-comparison", helper: "Gold vs silver vs platinum" },
  { label: "Investment return calculator", href: "/investment-return-calculator", helper: "Profit/loss estimate" },
];
