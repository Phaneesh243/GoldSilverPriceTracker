"use client";

import Link from "next/link";
import { ArrowRight, PieChart, ShieldCheck } from "lucide-react";
import AdSlot from "./AdSlot";
import { fundCategories } from "../../lib/mutual-funds";

export default function MutualFundLandingModule() {
  return <div className="funds-module"><section className="funds-command glass-panel"><div><span className="finance-eyebrow">Fund discovery intelligence</span><h2>Find and understand mutual funds in India.</h2><p>Current NAV values are loaded from AMFI above. Returns, costs and holdings are shown only when refreshed from official scheme data.</p></div><Link className="primary-button" href="/mutual-funds/explore">Open live explorer <ArrowRight size={16} /></Link></section><AdSlot id="funds-dashboard-top" label="Mutual fund advertisement" /><section><div className="funds-section-heading"><div><span className="finance-eyebrow">Research categories</span><h2>Explore fund types</h2></div></div><div className="funds-category-grid">{fundCategories.map((category) => <Link className="funds-category-card glass-panel" href={category.route} key={category.key}><span className="funds-category-icon"><PieChart size={20} /></span><h3>{category.name}</h3><p>{category.summary}</p><small>{category.audience}</small><span className="funds-card-link">Learn more <ArrowRight size={15} /></span></Link>)}</div></section><section className="glass-panel funds-content-panel"><div className="funds-check-list"><p><ShieldCheck size={17} />Verify NAV date, plan, option and scheme code</p><p><ShieldCheck size={17} />Read the current factsheet, SID and KIM</p><p><ShieldCheck size={17} />Review riskometer, expense ratio and exit load</p></div></section></div>;
}
