import Link from "next/link";
import { BarChart3, Calculator, Coins, CreditCard, Percent, RefreshCw, Scale, TrendingUp } from "lucide-react";
import AdSlot from "./AdSlot";
import Breadcrumbs from "./Breadcrumbs";

const groups = [
  {
    title: "Metal calculators",
    items: [
      ["Gold Calculator", "/calculators/gold", "Estimate gold value by purity, weight, charges and tax.", Coins],
      ["Silver Calculator", "/calculators/silver", "Calculate silver value by gram, kilogram or bulk weight.", Coins],
      ["Platinum Calculator", "/calculators/platinum", "Estimate platinum value using the current reference price.", Coins],
      ["Copper Calculator", "/calculators/copper", "Calculate copper value by kilogram or tonne.", Coins],
      ["Gold Jewellery Calculator", "/calculators/gold-jewellery", "Include making charge, wastage, GST and discount.", Calculator],
      ["Investment Return", "/calculators/investment-return", "Estimate current value and profit or loss.", TrendingUp],
    ],
  },
  {
    title: "Conversion tools",
    items: [
      ["Purity Converter", "/calculators/purity-converter", "Convert Gold between 24K, 22K and 18K.", Scale],
      ["Weight Converter", "/calculators/weight-converter", "Convert grams, kilograms, tola, ounces and tonnes.", Scale],
      ["Currency Converter", "/calculators/currency", "Convert an amount using a visible reference rate.", RefreshCw],
    ],
  },
  {
    title: "Finance calculators",
    items: [
      ["SIP Calculator", "/calculators/sip", "Estimate recurring investment growth and gains.", TrendingUp],
      ["CAGR Calculator", "/calculators/cagr", "Calculate annualized growth between two values.", BarChart3],
      ["EMI Calculator", "/calculators/emi", "Estimate monthly loan payment and total interest.", CreditCard],
      ["Tax Estimator", "/calculators/tax", "Preview tax, surcharge and after-tax value.", Percent],
    ],
  },
] as const;

export default function CalculatorsHub() {
  return (
    <div className="calculator-public-content">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Calculators" }]} />
      <AdSlot id="calculators-after-intro" />
      {groups.map((group) => (
        <section className="calculator-hub-group" key={group.title}>
          <div className="calculator-hub-heading"><span>Tools</span><h2>{group.title}</h2></div>
          <div className="calculator-hub-grid">
            {group.items.map(([label, href, description, Icon]) => <Link className="calculator-hub-card" href={href} key={href}><Icon size={24} /><h3>{label}</h3><p>{description}</p><span>Open calculator →</span></Link>)}
          </div>
        </section>
      ))}
      <AdSlot id="calculators-before-footer" />
    </div>
  );
}
