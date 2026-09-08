import { metalsAdPlacements } from "../../lib/metals-ads";
import Link from "next/link";
import AdSlot from "./AdSlot";
import Breadcrumbs from "./Breadcrumbs";
import CalculatorWorkspace from "./CalculatorWorkspace";
import MetalsCalculatorWorkspace from "./MetalsCalculatorWorkspace";
import { metalTools } from "../../lib/metals-calculators";
import { getCalculatorTitle, type CalculatorKind } from "../../lib/calculators";

export default function CalculatorPage({ kind }: { kind: CalculatorKind }) {
  const title = getCalculatorTitle(kind);
  return (
    <div className="calculator-public-content">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Calculators", href: "/calculators" }, { label: title }]} />
      {Object.hasOwn(metalTools, kind) ? <MetalsCalculatorWorkspace kind={kind} /> : <CalculatorWorkspace kind={kind} />}
      <section className="calculator-related-links">
        <div><span>Continue exploring</span><h2>Related calculators</h2></div>
        <div className="calculator-related-grid">
          <Link href="/calculators/gold">Gold calculator</Link>
          <Link href="/calculators/silver">Silver calculator</Link>
          <Link href="/calculators/investment-return">Investment return</Link>
          <Link href="/calculators/weight-converter">Weight converter</Link>
        </div>
      </section>
      <AdSlot id={metalsAdPlacements.calculator(kind)} />
    </div>
  );
}
