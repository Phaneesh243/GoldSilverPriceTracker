import { metals } from "./metals";
import { metalTools } from "./metals-calculators";
import { metalsGuides } from "./metals-guides";
import { metalComparisons } from "./metals-editorial";
export type MetalsRoute = { url: string; title: string; intent: string; type: string; existingEquivalent: string | null; distinctValue: string; requiredContent: string; canonical: string; indexable: boolean; sitemap: boolean; parents: string[]; dependencies: string; status: "available" | "data-unavailable"; updatedAt?: string };
const route = (url: string, title: string, type: string, intent: string, parents: string[], dependencies = "Original educational content", indexable = true, updatedAt?: string): MetalsRoute => ({ url, title, intent, type, existingEquivalent: updatedAt === "2026-09-09" ? null : url, distinctValue: intent, requiredContent: dependencies, canonical: url, indexable, sitemap: indexable, parents, dependencies, status: indexable ? "available" : "data-unavailable", updatedAt });
// Names only: deliberately do not import the old mock city-price dataset.
export const existingCityTools = ["Mumbai", "Delhi", "Chennai", "Bengaluru", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Kerala", "Vadodara"].map(name => ({ name, slug: name.toLowerCase() }));
export const metalsRouteManifest: MetalsRoute[] = [
  route("/metals", "Metals in India", "Metals", "Explore references and tools", ["/"], "Current provider references + original tools"),
  route("/metals/calculators", "Metal calculators", "Calculators", "Find a purchase tool", ["/metals"]),
  route("/metals/learn", "Metal buying guides", "Guides", "Understand a purchase", ["/metals"]),
  route("/metal-comparison", "Compare metal references", "Comparisons", "Understand comparable units", ["/metals"], "Compatible provider references"),
  ...metals.map(m => route(m.route, `${m.name} price in India`, "Metals", `${m.name} INR reference, tools and news`, ["/metals"], "Gold API + Frankfurter; reference not retail")),
  ...Object.entries(metalTools).map(([slug,t]) => route(`/calculators/${slug}`, t.title, "Calculators", t.description, ["/metals/calculators"], "User-entered assumptions")),
  ...Object.entries(metalsGuides).map(([slug,g]) => route(`/metals/learn/${slug}`, g.title, "Guides", g.summary, ["/metals/learn"], "Original explanation and linked primary sources", true, g.reviewedAt)),
  ...Object.entries(metalComparisons).map(([slug,g]) => route(`/metals/compare/${slug}`, g.title, "Comparisons", g.summary, ["/metals", "/metal-comparison", "/metals/learn"], "Original comparison; numeric cards require compatible observations", true, g.reviewedAt)),
  ...metals.map(m => route(`/news/${m.key}`, `${m.name} news`, "News", `Read attributed ${m.name.toLowerCase()} headlines`, [m.route], "Existing attributed news links")),
  ...metals.map(m => route(m.last10Route, `${m.name} history coverage`, "History", "See historical feed limitations", [m.route], "No approved historical adapter/coverage", false)),
  route("/historical-prices", "Historical coverage", "History", "Understand current history availability", ["/metals"], "No approved historical adapter/coverage", false),
  ...existingCityTools.map(c => route(`/gold-price/${c.slug}`, `${c.name} gold quotation tools`, "Location tools", "Manual tools only — no verified local price feed", ["/gold-price-today"], "Local retail data unavailable", false)),
];
export const metalSearchEntries = metalsRouteManifest.map(r => ({ url: r.url, title: r.title, group: r.type, hint: r.status === "data-unavailable" ? r.intent : r.type }));
