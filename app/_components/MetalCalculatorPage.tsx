import type { MetalKey } from "../../lib/metals";
import Breadcrumbs from "./Breadcrumbs";
import InfoPage from "./InfoPage";
import MetalCalculator from "./MetalCalculator";
import { getMetalPrice } from "../../lib/metal-prices";

export default async function MetalCalculatorPage({ metal }: { metal: MetalKey }) {
  const price = await getMetalPrice(metal);
  const label = metal[0].toUpperCase() + metal.slice(1);

  return (
    <InfoPage title={`${label} Calculator`} description={`Estimate ${metal} value by weight and premium using the latest available India quote.`}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Calculators", href: "/calculators" }, { label: `${label} calculator` }]} />
      <MetalCalculator metal={metal} price={price.price} />
      <section className="calculator-explanation">
        <h2>How this estimate works</h2>
        <p>The calculator multiplies the current displayed unit price by your weight and applies the premium or making-charge percentage you enter.</p>
        <p>It is an estimate only. Taxes, local premiums, wastage, making charges, and retailer buyback policies may change the final amount.</p>
      </section>
    </InfoPage>
  );
}
