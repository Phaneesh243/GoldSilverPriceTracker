import Link from "next/link";
import MetalPageShell from "./MetalPageShell";
import MetalPriceChart from "./MetalPriceChart";
import { getMetalConfig, type MetalKey } from "../../lib/metals";
export default function Last10DaysPage({ metalKey }: { metalKey: MetalKey }) {
 const config = getMetalConfig(metalKey);
 return <MetalPageShell title={config.name + " historical prices"} description="Explore verified historical coverage. Missing observations are not generated or replaced with today's exchange rate.">
  <MetalPriceChart metal={metalKey} color={config.color} />
  <section className="metals-disclosure"><h2>How to read this history</h2><p>A historical range needs observations spanning that range. A short table is not a year of history. Returns require matching purity, currency, unit and price basis. Gaps are retained, and OHLC values are displayed only if supplied.</p><p>INR history requires date-matched exchange rates; a current FX conversion is not historical INR pricing.</p><Link href="/metals/learn/methodology">Read data limitations</Link> · <Link href="/calculators/investment-return">Calculate your own purchase return</Link></section>
 </MetalPageShell>;
}
