import Link from "next/link";
import { Bell, Wallet, ArrowRight } from "lucide-react";
import { getAllMetalPrices } from "../../lib/metal-prices";
import MetalQuoteCards from "./MetalQuoteCards";
import DashboardNewsPreview from "./DashboardNewsPreview";
import AdSlot from "./AdSlot";

export default async function LiveDashboardModule() {
  const prices = await getAllMetalPrices("mumbai", "IN");
  return <div className="dashboard-module">
    <section className="dashboard-hero glass-panel">
      <div><span className="finance-eyebrow">India metals intelligence</span><h1>Your metals, in focus.</h1><p>Explore gold, silver, platinum and copper with provider-backed INR references, practical buying guides and calculators.</p></div>
      <div className="dashboard-hero-actions"><Link className="primary-button" href="/portfolio"><Wallet size={16} />Open portfolio</Link><Link className="outline-button" href="/notifications"><Bell size={16} />Market updates</Link></div>
    </section>
    <div className="metals-module"><MetalQuoteCards initial={prices.metals} /></div>
    <div className="dashboard-main-grid">
      <section className="glass-panel dashboard-panel"><span className="finance-eyebrow">Before you buy</span><h2>Understand the final price.</h2><p>Compare purity, weight, making charges and taxes. International references are not local retail quotations.</p><div className="dashboard-portfolio-actions"><Link className="outline-button" href="/metal-comparison">Compare metals <ArrowRight size={15} /></Link><Link className="outline-button" href="/calculators">Buying calculators</Link><Link className="outline-button" href="/metals/learn">Buying guides</Link></div></section>
      <aside className="glass-panel dashboard-panel dashboard-portfolio-panel"><span className="finance-eyebrow">Personal view</span><h2>Your watchlist and holdings</h2><p>Save the metals you follow and review your own transactions. Your account records remain private.</p><div className="dashboard-portfolio-actions"><Link className="primary-button" href="/watchlist">Open watchlist</Link><Link className="outline-button" href="/portfolio">View holdings</Link></div></aside>
    </div>
    <AdSlot id="dashboard-between-sections" module="dashboard" placement="mid-content" />
    <DashboardNewsPreview />
  </div>;
}
