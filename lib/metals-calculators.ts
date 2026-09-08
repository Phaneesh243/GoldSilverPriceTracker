/** Manual assumptions, never market quotes. Money is rounded only at output. */
export type MetalTool = { title: string; description: string; fields: { key: string; label: string; initial?: string; placeholder: string }[]; formula: string };
const field = (key: string, label: string, initial?: string) => ({ key, label, initial,
  placeholder: initial === "0" ? "0 if not applicable" : key === "rate" ? "Enter your quoted rate" : key === "weight" ? (label.includes("kg") ? "Enter weight in kg" : "Enter weight in grams") : key === "karat" ? "Enter karat from 1 to 24" : key === "days" ? "Enter number of days" : "Enter " + label.toLowerCase(),
});
const rate = field("rate", "Rate for selected purity (INR per gram)");
const weight = field("weight", "Gross weight (grams)");
const purchaseFields = [rate, weight, field("stones", "Non-metal weight (grams)", "0"), field("making", "Making charge (%)", "0"), field("perGram", "Making charge (INR per net gram)", "0"), field("fixed", "Fixed making charge (INR)", "0"), field("wastage", "Additional wastage charge (%)", "0"), field("discount", "Pre-tax discount (INR)", "0"), field("tax", "Assumed tax on discounted subtotal (%)", "0")];
export const metalTools: Record<string, MetalTool> = {
  gold: { title: "Gold value calculator", description: "Estimate a purchase using your quotation. The rate must already match the jewellery purity.", fields: purchaseFields, formula: "Net weight = gross − non-metal weight. Metal value = net weight × purity-specific rate. Add selected charges, subtract discount, then apply your assumed tax to the subtotal." },
  silver: { title: "Silver purchase calculator", description: "Enter a per-gram quotation for the silver purity you intend to buy.", fields: purchaseFields, formula: "Use the same purchase calculation as gold; a quoted kilogram price must first be divided by 1,000." },
  platinum: { title: "Platinum value calculator", description: "Manual quotation calculator; not a jeweller price feed.", fields: purchaseFields, formula: "Net grams × quoted rate, plus entered charges and assumed tax." },
  copper: { title: "Copper value calculator", description: "Manual per-kilogram quotation; exchange, industrial and scrap quotations are not interchangeable.", fields: [field("rate", "Quoted rate (INR per kg)"), field("weight", "Weight (kg)"), field("fixed", "Additional charges (INR)", "0"), field("tax", "Assumed tax (%)", "0")], formula: "(Kilograms × quoted price + entered charges) × (1 + assumed tax / 100)." },
  "gold-jewellery": { title: "Gold jewellery bill calculator", description: "Separate metal weight, making charges, wastage and your tax assumptions.", fields: purchaseFields, formula: "Charges are additive. Use only the charge methods on your quotation. Purity is not applied again to a purity-specific rate. Discount is applied before the assumed subtotal tax." },
  "making-charge-comparison": { title: "Making-charge comparison", description: "Compare alternative percentage, per-gram and fixed making-charge quotes on the same metal value, before tax.", fields: [rate, weight, field("making", "Percentage quotation (%)"), field("perGram", "Per-gram quotation (INR)"), field("fixed", "Fixed quotation (INR)")], formula: "Compare rate × grams × percentage / 100, grams × per-gram charge, and fixed charge. These are alternatives, not added together." },
  "budget-to-gold": { title: "Budget-to-gold calculator", description: "Find the maximum net metal weight within your budget under explicit charge assumptions.", fields: [field("budget", "Total budget (INR)"), rate, field("making", "Making charge (%)", "0"), field("perGram", "Making charge per gram (INR)", "0"), field("fixed", "Fixed charge (INR)", "0"), field("tax", "Assumed tax (%)", "0")], formula: "Grams = (budget / (1 + tax / 100) − fixed charge) / (rate × (1 + making / 100) + per-gram charge). No stones or additional fees included." },
  "weight-converter": { title: "Metal weight converter", description: "Convert using explicit mass definitions; troy ounces differ from ordinary ounces.", fields: [weight], formula: "1 troy ounce = 31.1034768 g; 1 ordinary ounce = 28.349523125 g; 1 tola = 11.6638125 g. Local units are not assumed." },
  "purity-converter": { title: "Gold fine-metal content", description: "Calculate theoretical fine-gold content from net alloy weight. This does not test or certify purity.", fields: [field("weight", "Net alloy weight (grams)"), field("karat", "Declared karat (1–24)")], formula: "Fine-gold grams = alloy grams × karat / 24. This theoretical factor is not a retail quotation or assay result." },
  "invoice-checker": { title: "Jewellery invoice arithmetic checker", description: "Compare an entered bill total with the stated calculation. Not a tax or legal certification.", fields: [...purchaseFields, field("invoice", "Invoice total to check (INR)")], formula: "Calculate the purchase total from your inputs and subtract it from the entered invoice total. Differences may reflect excluded services, stones or a different tax basis." },
  "old-gold-exchange": { title: "Old-gold exchange estimator", description: "Use the dealer's purity-specific buyback quotation, not a retail purchase rate.", fields: [field("rate", "Purity-specific buyback rate (INR per gram)"), weight, field("stones", "Non-metal weight (grams)", "0"), field("deduction", "Buyback deduction (%)", "0"), field("fixed", "Assay/other deduction (INR)", "0")], formula: "Estimated proceeds = net grams × buyback rate × (1 − deduction / 100) − fixed deductions. Not a guaranteed offer." },
  "investment-return": { title: "Metal purchase return calculator", description: "Use your total acquisition cost and achievable net sale proceeds, including charges.", fields: [field("cost", "Total acquisition cost (INR)"), field("proceeds", "Net sale proceeds (INR)"), field("days", "Holding period (days)")], formula: "Profit = proceeds − cost. Return = profit / cost × 100. Annualised return = ((proceeds / cost)^(365 / days) − 1) × 100; not a forecast." },
  "wedding-budget": { title: "Wedding jewellery budget planner", description: "Allocate a budget to three editable quotation amounts. Values are your estimates, not retailer offers.", fields: [field("budget", "Total budget (INR)"), field("item1", "Item / group 1 total (INR)"), field("item2", "Item / group 2 total (INR)"), field("item3", "Item / group 3 total (INR)")], formula: "Planned spend = three item totals. Remaining budget = total budget − planned spend. Include charges in each item total." },
};
export type ToolResult = { label: string; value: number; unit: "INR" | "g" | "kg" | "%" | "tola" | "troy oz" | "oz" }[];
export function calculateMetalTool(kind: string, raw: Record<string, string>): ToolResult {
  const tool = metalTools[kind];
  if (!Object.hasOwn(metalTools, kind)) throw new Error("Unsupported calculator.");
  const v: Record<string, number> = {};
  for (const f of tool.fields) {
    const input = raw[f.key];
    if (typeof input !== "string" || !input.trim()) throw new Error(`Enter ${f.label.toLowerCase()}.`);
    const n = Number(input);
    if (!Number.isFinite(n) || n < 0 || n > 1e10) throw new Error(`${f.label}: enter a finite value from 0 to 10,000,000,000.`);
    if (["tax", "making", "wastage", "deduction"].includes(f.key) && n > 100) throw new Error(`${f.label}: maximum 100%.`);
    v[f.key] = n;
  }
  const result: ToolResult = [];
  const add = (label: string, value: number, unit: ToolResult[number]["unit"] = "INR") => { if (!Number.isFinite(value) || Math.abs(value) > 1e15) throw new Error("Result exceeds the supported range. Check inputs."); result.push({ label, value: Math.round((value + Number.EPSILON) * (unit === "INR" ? 100 : 1e6)) / (unit === "INR" ? 100 : 1e6), unit }); };
  if ("rate" in v && v.rate <= 0) throw new Error("Rate must be greater than zero.");
  if (kind === "weight-converter") { add("Grams", v.weight, "g"); add("Kilograms", v.weight / 1000, "kg"); add("Troy ounces", v.weight / 31.1034768, "troy oz"); add("Ordinary ounces", v.weight / 28.349523125, "oz"); add("Tola", v.weight / 11.6638125, "tola"); }
  else if (kind === "purity-converter") { if (v.karat < 1 || v.karat > 24) throw new Error("Declared karat must be between 1 and 24."); add("Fine-gold content", v.weight * v.karat / 24, "g"); add("Theoretical fineness", v.karat / 24 * 100, "%"); }
  else if (kind === "making-charge-comparison") { add("Percentage charge", v.rate * v.weight * v.making / 100); add("Per-gram charge", v.weight * v.perGram); add("Fixed charge", v.fixed); }
  else if (kind === "budget-to-gold") { const available = v.budget / (1 + v.tax / 100) - v.fixed; if (available < 0) throw new Error("Budget does not cover fixed charges and assumed tax."); add("Maximum net weight", available / (v.rate * (1 + v.making / 100) + v.perGram), "g"); }
  else if (kind === "investment-return") { if (v.cost <= 0 || v.days <= 0) throw new Error("Cost and holding period must be greater than zero."); add("Profit / loss", v.proceeds - v.cost); add("Holding-period return", (v.proceeds / v.cost - 1) * 100, "%"); add("Annualised return (not a forecast)", ((v.proceeds / v.cost) ** (365 / v.days) - 1) * 100, "%"); }
  else if (kind === "wedding-budget") { const spend = v.item1 + v.item2 + v.item3; add("Planned spend", spend); add("Remaining / overspend", v.budget - spend); }
  else if (kind === "copper") { const base = v.rate * v.weight + v.fixed; add("Subtotal", base); add("Assumed tax", base * v.tax / 100); add("Estimated total", base * (1 + v.tax / 100)); }
  else {
    if (v.stones > v.weight) throw new Error("Non-metal weight cannot exceed gross weight.");
    const net = v.weight - v.stones;
    const metal = net * v.rate;
    add("Net metal weight", net, "g"); add("Metal value", metal);
    if (kind === "old-gold-exchange") { const proceeds = metal * (1 - v.deduction / 100) - v.fixed; if (proceeds < 0) throw new Error("Deductions exceed the buyback value."); add("Estimated proceeds", proceeds); }
    else {
      const making = metal * v.making / 100 + net * v.perGram + v.fixed;
      const wastage = metal * v.wastage / 100;
      const subtotal = metal + making + wastage - v.discount;
      if (subtotal < 0) throw new Error("Discount exceeds the subtotal.");
      add("Making charges", making); add("Wastage charge", wastage); add("Discount", v.discount); add("Discounted subtotal", subtotal); add("Assumed tax", subtotal * v.tax / 100); add("Estimated total", subtotal * (1 + v.tax / 100));
      if (kind === "invoice-checker") add("Invoice minus calculated total", v.invoice - subtotal * (1 + v.tax / 100));
    }
  }
  return result;
}
export function safeCsvCell(value: string | number) { const s = String(value); return `"${(/^[\s]*[=+@-]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`; }
export function initialToolInputs(kind: string) { return Object.fromEntries(metalTools[kind].fields.map(f => [f.key, f.initial ?? ""])); }
export function validateSavedInputs(kind: string, input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid saved estimate.");
  const raw = input as Record<string, unknown>;
  const values: Record<string, string> = Object.fromEntries(metalTools[kind].fields.map(f => { const v = raw[f.key]; return [f.key, typeof v === "string" ? v : ""]; }));
  calculateMetalTool(kind, values); return values;
}
