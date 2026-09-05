"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert, TrendingUp } from "lucide-react";
import AdSlot from "./AdSlot";
import { cryptoCategories } from "../../lib/crypto";

export default function CryptoLandingModule() {
  return <div className="crypto-module"><section className="crypto-command glass-panel"><div><span className="finance-eyebrow">Digital-asset intelligence</span><h2>Track crypto prices, risk, tax and market signals in India.</h2><p>Current numeric values are loaded only from the live CoinGecko layer. Educational categories and safety guidance remain available when a market provider is unavailable.</p></div><Link className="primary-button" href="/crypto/explore">Explore live assets <ArrowRight size={16} /></Link></section><AdSlot id="crypto-dashboard-top" label="Crypto advertisement" /><section><div className="crypto-section-heading"><div><span className="finance-eyebrow">Research themes</span><h2>Learn without invented market numbers</h2></div></div><div className="crypto-category-grid">{cryptoCategories.map((category) => <Link className="crypto-category-card glass-panel" href={category.route} key={category.key}><span className="crypto-category-icon"><TrendingUp size={20} /></span><h3>{category.name}</h3><p>{category.summary}</p><small>{category.audience}</small><span className="crypto-card-link">Learn more <ArrowRight size={15} /></span></Link>)}</div></section><section className="glass-panel crypto-content-panel"><div className="crypto-warning"><ShieldAlert size={18} /><b>Public market data can be delayed, rate-limited or unavailable. Verify the source timestamp and official platform information before making decisions.</b></div></section></div>;
}
