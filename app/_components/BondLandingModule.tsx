"use client";

import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import AdSlot from "./AdSlot";
import { bondCategories } from "../../lib/bonds";

export default function BondLandingModule() {
  return <div className="bonds-module"><section className="bonds-command glass-panel"><div><span className="finance-eyebrow">Fixed-income intelligence</span><h2>Understand bonds without displaying unverified yields.</h2><p>Coupons, YTM, prices, ratings and liquidity require an approved current bond feed. Use the educational guides and official sources until that feed is configured.</p></div><Link className="outline-button" href="/bonds/explore">Open bond research <ArrowRight size={16} /></Link></section><AdSlot id="bonds-dashboard-top" label="Bond advertisement" /><section><div className="bonds-section-heading"><div><span className="finance-eyebrow">Research categories</span><h2>Explore fixed-income types</h2></div></div><div className="bonds-category-grid">{bondCategories.map((category) => <Link className="bonds-category-card glass-panel" href={category.route} key={category.key}><span className="bonds-category-icon"><FileText size={20} /></span><h3>{category.name}</h3><p>{category.summary}</p><small>{category.audience}</small><span className="bonds-card-link">Learn more <ArrowRight size={15} /></span></Link>)}</div></section><section className="glass-panel bonds-content-panel"><div className="bonds-check-list"><p><ShieldCheck size={17} />Verify ISIN, issuer and official offer documents</p><p><ShieldCheck size={17} />Check current price, YTM, rating and liquidity date</p><p><ShieldCheck size={17} />Review tax, interest-rate and default risk</p></div></section></div>;
}
