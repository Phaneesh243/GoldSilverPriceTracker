export type BondType = "government" | "treasury" | "corporate" | "tax-free" | "green";

export type Bond = {
  slug: string;
  name: string;
  issuer: string;
  type: BondType;
  coupon: string;
  ytm: string;
  maturity: string;
  rating: string;
  minimum: string;
  frequency: string;
  summary: string;
  risk: string;
  source: string;
};

export type BondCategory = {
  key: BondType;
  name: string;
  summary: string;
  audience: string;
  color: string;
  route: string;
  benefits: string[];
  disadvantages: string[];
};

export const bondCategories: BondCategory[] = [
  { key: "government", name: "Government bonds", summary: "Government of India securities with different maturities and coupon structures.", audience: "Capital preservation and long-term planning", color: "#38bdf8", route: "/bonds/government-bonds", benefits: ["Sovereign issuer backing", "Multiple maturity choices", "Can provide predictable coupon income"], disadvantages: ["Prices can fall when market yields rise", "Longer maturities can be rate-sensitive", "Some issues may have limited liquidity"] },
  { key: "treasury", name: "Treasury bills", summary: "Short-term government securities issued below face value and redeemed at maturity.", audience: "Short-term cash management", color: "#34d399", route: "/bonds/treasury-bills", benefits: ["Short maturity options", "Government issuer", "Useful for parking money for a defined period"], disadvantages: ["No regular coupon payments", "Reinvestment risk at maturity", "Returns vary with auction yields"] },
  { key: "corporate", name: "Corporate bonds", summary: "Debt issued by companies, banks and NBFCs with issuer-specific credit and liquidity risk.", audience: "Income seekers who understand credit risk", color: "#a78bfa", route: "/bonds/corporate-bonds", benefits: ["Potentially higher yield than government securities", "Regular income options", "Issuer and maturity variety"], disadvantages: ["Credit and default risk", "Liquidity may be limited", "Ratings are not guarantees"] },
  { key: "tax-free", name: "Tax-free bonds", summary: "Eligible issues whose interest treatment depends on the current rules and issue terms.", audience: "Tax-aware long-term investors", color: "#f59e0b", route: "/bonds/tax-free-bonds", benefits: ["May offer tax-efficient interest under applicable rules", "Often long-term instruments", "Useful for income planning"], disadvantages: ["Availability can be limited", "Long maturities can increase rate risk", "Tax treatment must be verified from issue documents"] },
  { key: "green", name: "Green bonds", summary: "Debt instruments linked to eligible environmental or climate projects.", audience: "Investors seeking fixed income with an impact theme", color: "#22c55e", route: "/bonds/green-bonds", benefits: ["Fixed-income structure", "Project-use disclosures may be available", "Supports an environmental theme"], disadvantages: ["Green label does not remove investment risk", "Liquidity varies by issue", "Review the framework and reporting documents"] },
];

export const bonds: Bond[] = [
  { slug: "goi-2034", name: "7.18% Government Security 2034", issuer: "Government of India", type: "government", coupon: "7.18%", ytm: "7.04%", maturity: "2034", rating: "Sovereign", minimum: "₹10,000", frequency: "Half-yearly", summary: "A dated government security for investors seeking a sovereign fixed-income allocation.", risk: "Interest-rate and liquidity risk before maturity", source: "RBI reference data" },
  { slug: "91-day-tbill", name: "91-Day Treasury Bill", issuer: "Government of India", type: "treasury", coupon: "Zero coupon", ytm: "6.72%", maturity: "91 days", rating: "Sovereign", minimum: "₹10,000", frequency: "At maturity", summary: "A short-term government instrument issued at a discount and redeemed at face value.", risk: "Reinvestment risk at maturity", source: "RBI auction reference" },
  { slug: "pfc-2029", name: "PFC Secured Bond 2029", issuer: "Power Finance Corporation", type: "corporate", coupon: "8.15%", ytm: "8.42%", maturity: "2029", rating: "AAA*", minimum: "₹10,000", frequency: "Annual", summary: "A reference corporate bond profile showing the income and issuer checks investors should review.", risk: "Credit, liquidity and interest-rate risk", source: "Issuer document reference" },
  { slug: "nha-green-2033", name: "NHAI Green Bond 2033", issuer: "National Highways Authority of India", type: "green", coupon: "7.30%", ytm: "7.24%", maturity: "2033", rating: "AAA*", minimum: "₹10,000", frequency: "Annual", summary: "A green-bond reference profile with project-use and issuer disclosures to verify.", risk: "Market, liquidity and issuer-related risk", source: "Issuer document reference" },
  { slug: "irfc-2030", name: "IRFC Taxable Bond 2030", issuer: "Indian Railway Finance Corporation", type: "corporate", coupon: "7.70%", ytm: "7.82%", maturity: "2030", rating: "AAA*", minimum: "₹10,000", frequency: "Annual", summary: "A long-term public-sector issuer reference for comparing coupon, yield and maturity.", risk: "Rate and secondary-market liquidity risk", source: "Issuer document reference" },
  { slug: "sdl-2031", name: "State Development Loan 2031", issuer: "State Government issuer", type: "government", coupon: "7.65%", ytm: "7.61%", maturity: "2031", rating: "State-backed", minimum: "₹10,000", frequency: "Half-yearly", summary: "A state-government security reference with market-yield and maturity information.", risk: "Interest-rate and liquidity risk", source: "RBI reference data" },
];

export const bondSources = [
  { label: "RBI government securities information", href: "https://www.rbi.org.in/" },
  { label: "SEBI investor education", href: "https://investor.sebi.gov.in/" },
  { label: "NSE debt market", href: "https://www.nseindia.com/market-data/debt-market" },
];

export const bondQuestions = [
  "What are bonds and how do they work?",
  "Are government bonds safer than corporate bonds?",
  "How to buy government bonds in India?",
  "What is yield to maturity?",
  "Can bond prices fall before maturity?",
  "Bonds versus fixed deposits: which is better?",
  "How are bond returns taxed?",
  "What does an AAA rating mean?",
];
