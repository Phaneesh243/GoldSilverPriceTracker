import { metalsAdPlacements } from "../../lib/metals-ads";
import Link from "next/link";
import MetalPageShell from "./MetalPageShell";
import AdSlot from "./AdSlot";
import MetalPriceChart from "./MetalPriceChart";
import MetalQuoteCards from "./MetalQuoteCards";
import { getMetalPrice } from "../../lib/metal-prices";
import { getMetalConfig, metals, type MetalKey } from "../../lib/metals";
export default async function MetalDetailPage({ metalKey }: { metalKey: MetalKey }) {
  const config = getMetalConfig(metalKey); const price = await getMetalPrice(metalKey);
  return <MetalPageShell title={config.name + " price reference"} description={"Understand " + config.name.toLowerCase() + " reference prices, units and purchase estimates. No local quotation is implied."}>
    <MetalQuoteCards initial={[price]} showTools />
    <AdSlot id={metalsAdPlacements.detail(metalKey).after} module="metals" placement="after-hero" />
    <section className="metals-disclosure"><h2>Price basis matters</h2><p>{price.message}</p><p>{config.investorUse}</p><p>{config.riskNote}</p><p>No buy/wait recommendation is generated from a short price series.</p></section>
    <MetalPriceChart metal={metalKey} color={config.color} />
    <section className="metals-card-grid"><Link className="metals-guide-card" href="/metals/learn/price-basis">Retail, spot and futures explained</Link><Link className="metals-guide-card" href="/metals/learn/invoice">Understand charges on your bill</Link><Link className="metals-guide-card" href={config.last10Route}>History and coverage</Link></section>
    <AdSlot id={metalsAdPlacements.detail(metalKey).footer} module="metals" placement="before-footer" />
    <section><h2>Explore other metals</h2><div className="metals-actions">{metals.filter(m => m.key !== metalKey).map(m => <Link key={m.key} href={m.route}>{m.name}</Link>)}<Link href="/metal-comparison">Compare metals</Link><Link href={"/news/" + metalKey}>Read sourced news</Link></div></section>
  </MetalPageShell>;
}
