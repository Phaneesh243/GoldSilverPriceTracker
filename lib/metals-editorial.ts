import type { MetalsGuide } from "./metals-guides";
import type { MetalKey } from "./metals";
const bis = { title: "BIS hallmarking consumer guidance", url: "https://www.bis.gov.in/hallmarking-overview/consumer-protection/?lang=en" };
const pgi = { title: "PGI India purity programme (industry body)", url: "https://platinumguild.com/men-of-platinum-strengthens-its-association-with-crickets-shining-star-kl-rahul/" };
const cme = { title: "CME copper product overview", url: "https://www.cmegroup.com/education/lessons/copper-product-overview" };
const amfi = { title: "AMFI scheme categories and gold ETFs", url: "https://www.amfiindia.com/investor/knowledge-center-info?zoneName=CategorizationOfMutualFundSchemes" };
const date = "2026-09-09";
export const extraMetalsGuides: Record<string, MetalsGuide> = {
  "22k-vs-24k-gold": { title: "22K vs 24K gold: purity is not the whole bill", summary: "Separate declared gold content, product purpose and the all-in quotation before choosing.", reviewedAt: date, sources: [bis], sections: [
    { title: "Read the proportion correctly", text: "On the theoretical karat scale, 22/24 is about 91.67% gold; 24/24 is the fine-gold endpoint. Actual fineness declarations and tolerances belong to the item and its applicable standard. The website's international reference does not certify the purity of any jewellery." },
    { title: "Compare the same purchase question", text: "A jewellery design and a bullion product serve different purposes. Ask for net metal weight, declared fineness, stone weight and the rate applying to that exact item. Multiplying a fine-gold reference by 22/24 estimates metal content only: it does not include fabrication, premiums or a seller's quotation." },
    { title: "Avoid a double purity deduction", text: "If a seller already quoted an INR-per-gram rate for 22K, use that rate directly in the jewellery calculator. Do not multiply by 22/24 again. Compare the complete invoice and written buyback terms rather than treating the smaller headline rate as a saving." },
  ] },
  "18k-vs-22k-gold": { title: "18K vs 22K gold: compare content and quotations", summary: "Understand different declared alloy proportions without confusing price, design or resale value.", reviewedAt: date, sources: [bis], sections: [
    { title: "Keep weight and content separate", text: "Theoretical fine-gold fractions are 18/24, or 75%, and 22/24, or about 91.67%. Equal net alloy weights therefore do not contain equal theoretical amounts of gold. These fractions describe content; they are not purity tests or prices." },
    { title: "Ask what the quotation covers", text: "For either item, identify stone weight, net metal weight, the purity-specific rate and all additional charges. A design with a lower gold fraction is not automatically cheaper overall. Design, fabrication and the non-metal components can change the total substantially." },
    { title: "Compare written resale terms", text: "Ask how the buyer assesses purity, how stones are treated and which deductions apply. Enter the proposed buyback rate in the old-gold estimator, not the rate for newly purchased jewellery. Use the purity converter to understand theoretical content separately from the invoice calculation." },
  ] },
  "gold-making-charges": { title: "Gold making charges: compare three quotation methods", summary: "Understand percentage, per-gram and fixed making charges before comparing jewellery bills.", reviewedAt: date, sources: [bis], sections: [
    { title: "Identify the denominator", text: "A percentage charge needs a stated base, usually a quoted metal value; a per-gram charge needs a stated weight basis; a fixed charge applies to the described item or job. Ask whether each method is an alternative or whether the seller adds more than one. The comparison calculator treats them as alternatives." },
    { title: "Use one consistent metal value", text: "Enter the same purity-specific rate and net metal weight for all alternatives. Percentage charge = rate × net grams × percentage / 100. Per-gram charge = net grams × quoted charge per gram. Compare those results with the fixed quotation before adding any tax assumptions." },
    { title: "Check what a discount changes", text: "A discount on making charges is not necessarily a discount on the whole bill. Ask how wastage, stones and other services are charged, and which amounts are discounted. Save the full estimate and compare the written total. Making charges may not be recovered on resale; confirm the buyer's actual terms." },
  ] },
  "silver-purity": { title: "Silver purity: read fineness, weight and product basis", summary: "A silver reference, a silver-alloy item and a plated item are different purchase questions.", reviewedAt: date, sources: [bis], sections: [
    { title: "Fineness describes parts per thousand", text: "A declaration of 925 means 925 parts of silver per thousand parts of the declared alloy, or 92.5%. It does not certify an untested item merely because a number appears on a listing. Check the current applicable hallmarking guidance and obtain the seller's itemised invoice." },
    { title: "Identify which weight is priced", text: "Ask whether the figure is gross item weight or net alloy weight and whether fittings or other non-silver parts are included. A silver-plated base-metal object is not valued like a solid silver-alloy object. Do not multiply a plated item's gross weight by a fine-silver rate." },
    { title: "Keep kilograms and grams consistent", text: "A kilogram contains 1,000 grams. Convert the quotation once before entering the per-gram purchase calculator. Use a rate for the specified purity, then enter fabrication and tax assumptions separately. Obtain a separate buyback quotation instead of assuming the purchase total can be recovered." },
  ] },
  "platinum-purity": { title: "Platinum purity: what a Pt950 declaration means", summary: "Read the item declaration and separate a fine-metal reference from a jewellery quotation.", reviewedAt: date, sources: [pgi], sections: [
    { title: "Understand the declaration", text: "Pt950 denotes a declared platinum proportion of 950 parts per thousand, or 95%. Platinum Guild India's own quality programme describes Pt950 marking and supporting documentation. That programme is not a statement that this website or every platinum item is certified." },
    { title: "A reference is not a finished item", text: "Our platinum reference is converted from the provider's XPT observation into INR per gram. It is not a Pt950 retail quotation. Product design, fabrication, other materials and the seller's terms affect the invoice. Do not describe a theoretical content conversion as a dealer offer." },
    { title: "Obtain the right purchase and resale inputs", text: "Ask for declared fineness, net metal weight, a purity-specific rate and itemised charges. Request buyback terms separately, including assessment and deductions. Use the platinum calculator with the rate actually quoted for the item; leave unsupported assumptions out rather than guessing." },
  ] },
  "copper-spot-vs-scrap": { title: "Copper benchmark vs spot vs scrap: compare the specification", summary: "Grade, delivery basis and units matter before two copper prices can be compared.", reviewedAt: date, sources: [cme], sections: [
    { title: "Know which market you are seeing", text: "A futures quotation describes a contract, while a physical offer specifies a product, quantity and delivery arrangement. The existing provider exposes HG without a contract month or explicit unit field. Our conversion uses the standard HG dollar-per-pound convention and discloses that assumption; it is not a confirmed executable exchange offer." },
    { title: "Do not apply a benchmark to any scrap weight", text: "Scrap offers depend on the buyer's specification, recoverable metal, contamination and processing arrangements. Insulated cable, mixed scrap and a specified refined product are not interchangeable. Ask for the assessed payable weight and grade before comparing offers." },
    { title: "Convert units without changing the offer", text: "Using 0.45359237 kilograms per pound converts a per-pound reference into a per-kilogram reference. It does not add transport, processing, taxes or local premiums. The copper calculator uses a manual INR/kg quotation plus explicit charges. No fabricated city scrap rates are supplied." },
  ] },
};
export type MetalComparison = MetalsGuide & { metals: MetalKey[]; columns: [string, string]; rows: [string, string, string][] };
export const metalComparisons: Record<string, MetalComparison> = {
  "gold-vs-silver": { title: "Gold vs silver: compare ownership, not just unit prices", summary: "Compare reference bases, purchase costs and practical ownership questions without a buy/sell recommendation.", reviewedAt: date, sources: [bis], metals: ["gold", "silver"], columns: ["Gold", "Silver"], rows: [
    ["Reference on this page", "INR per gram; not a jewellery quote", "INR per gram; not a finished-product quote"],
    ["Before buying", "Confirm karat/fineness and net weight", "Confirm fineness and whether the item is solid alloy or plated"],
    ["Costs to compare", "Fabrication, premiums, storage and buyback terms", "Fabrication, premiums, storage and buyback terms"],
  ], sections: [
    { title: "Compare on the same basis", text: "The reference cards here use one gram for both metals. A gold–silver ratio is shown only when currency, unit and basis match and fresh observations are close enough in time. It describes the relative unit prices at those observations, not which metal is a better investment." },
    { title: "Compare an actual purchase", text: "Get written offers for the product and purity you want. Compare charges and proposed resale deductions as well as the metal value. The physical quantities, storage needs and available buyers can differ. Use separate calculator estimates rather than treating a chart return as your net return." },
    { title: "No forecast from a ratio", text: "A high or low ratio does not promise a reversal. Without compatible historical observations we do not show backtested performance or an invented long-term average. Review your intended use and the risk of loss instead of making a decision from a single number." },
  ] },
  "gold-vs-platinum": { title: "Gold vs platinum: compare the product and exit terms", summary: "Separate fine-metal references from purity-specific jewellery and resale quotations.", reviewedAt: date, sources: [bis, pgi], metals: ["gold", "platinum"], columns: ["Gold", "Platinum"], rows: [
    ["Reference unit", "INR per gram", "INR per gram"],
    ["Item declaration", "Karat/fineness of the actual item", "Declared platinum fineness of the actual item"],
    ["Resale questions", "Assessed purity, payable weight and deductions", "Assessed purity, payable weight and a willing buyer's terms"],
  ], sections: [
    { title: "The chart price is not the invoice", text: "These per-gram provider references exclude finished-product costs. A gold jewellery item and a platinum jewellery item can have different alloy proportions, weights and fabrication charges. Comparing only their headline metal rates does not compare their complete purchase prices." },
    { title: "Ask about the exit before entry", text: "For each product, request the seller's buyback policy and check whether other buyers will quote for it. Document assessment, deductions and settlement conditions. A reference price cannot guarantee liquidity or the amount you receive when selling." },
    { title: "Use explicit assumptions", text: "Create one manual estimate per written quotation. Do not apply a theoretical purity fraction to a rate already quoted for that purity. No allocation recommendation or prediction follows from one metal having a lower nominal price." },
  ] },
  "gold-etf-vs-physical-gold": { title: "Gold ETF vs physical gold: ownership, access and costs", summary: "Understand the differences between holding fund units and owning a physical gold product.", reviewedAt: date, sources: [amfi, bis], metals: [], columns: ["Gold ETF", "Physical gold"], rows: [
    ["What you hold", "Units of a scheme; read its documents", "A specific physical product"],
    ["Trading", "Exchange access, market price and available liquidity", "A dealer or buyer's quotation and settlement terms"],
    ["Costs to check", "Expense ratio, tracking difference, spreads and account/trading fees", "Premiums, fabrication, storage, insurance and resale deductions"],
    ["Personal use", "Not wearable jewellery; redemption terms depend on scheme", "Product may meet jewellery or physical possession needs"],
  ], sections: [
    { title: "Different ways to get exposure", text: "A gold ETF holds assets under its scheme documents, while a physical purchase gives you the specific item. AMFI describes ETFs as exchange-traded products. Inspect the individual fund documents for investment policy, expenses, tracking and redemption; do not assume a retail unit can always be exchanged for a small gold bar." },
    { title: "Compare total costs, not promised returns", text: "For an ETF, check trading spreads, scheme costs and applicable account fees. For physical gold, obtain the all-in purchase and achievable resale quotations. Neither the website reference nor past price performance guarantees your result. No fund rankings or unsupported live NAVs are invented here." },
    { title: "Choose according to the task", text: "Personal use, custody preferences, access to exchange trading and resale arrangements are different considerations. Tax treatment can change and depends on the transaction; consult current official guidance rather than assuming one option is tax-free. This comparison is educational, not a personalized recommendation." },
  ] },
};
