"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronRight, CircleHelp, ShieldCheck, X } from "lucide-react";
import AdSlot from "./AdSlot";
import { AssetActionButtons } from "./WatchlistAlertsClient";
import { insuranceCategories, insuranceProviders, insuranceSources, type InsuranceCategory, type InsuranceCategoryKey, type InsuranceProvider } from "../../lib/insurance";

type InsuranceView = "dashboard" | "compare" | "providers" | "category" | "provider" | "calculator" | "claims" | "renewal";

const disclaimer = "Educational information only. It is not insurance, financial, medical, tax or legal advice. Benefits, exclusions, premiums and eligibility vary by insurer and product. Read the policy wording and Customer Information Sheet before buying.";

export default function InsuranceModule({ view = "dashboard", category, provider }: { view?: InsuranceView; category?: InsuranceCategory; provider?: InsuranceProvider }) {
  if (view === "category" && category) return <CategoryPage category={category} />;
  if (view === "provider" && provider) return <ProviderPage provider={provider} />;
  if (view === "compare") return <ComparePage />;
  if (view === "providers") return <ProvidersPage />;
  if (view === "calculator") return <InsuranceCalculator />;
  if (view === "claims" || view === "renewal") return <SupportPage view={view} />;
  return <InsuranceDashboard />;
}

function InsuranceDashboard() {
  const [query, setQuery] = useState("");
  const filtered = insuranceCategories.filter((item) => `${item.name} ${item.summary} ${item.audience}`.toLowerCase().includes(query.toLowerCase().trim()));
  return (
    <div className="insurance-module">
      <section className="insurance-command glass-panel">
        <div><span className="finance-eyebrow">Insurance intelligence</span><h2>Understand, compare and manage insurance in India.</h2><p>Clear explanations of benefits, limitations, providers, claims and renewal decisions.</p></div>
        <div className="insurance-command-actions"><input aria-label="Search insurance" placeholder="Search health, term, car..." value={query} onChange={(event) => setQuery(event.target.value)} /><Link className="primary-button" href="/insurance/compare">Compare policies <ArrowRight size={16} /></Link></div>
      </section>
      <AdSlot id="insurance-dashboard-top" label="Insurance advertisement" />
      <section><div className="insurance-section-heading"><div><span className="finance-eyebrow">Explore cover</span><h2>Insurance categories</h2></div><Link href="/insurance/providers">View providers <ChevronRight size={16} /></Link></div><div className="insurance-category-grid">{filtered.map((item) => <CategoryCard category={item} key={item.key} />)}</div></section>
      <div className="insurance-dashboard-grid">
        <section className="glass-panel insurance-search-panel"><div className="insurance-section-heading"><div><span className="finance-eyebrow">Popular questions</span><h2>What people research most</h2></div></div><div className="insurance-question-list">{insuranceCategories.slice(0, 4).flatMap((item) => item.questions.slice(0, 2).map((question) => <Link href={item.route} key={question}><CircleHelp size={16} />{question}<ChevronRight size={16} /></Link>))}</div></section>
        <section className="glass-panel insurance-benefit-panel"><div className="insurance-section-heading"><div><span className="finance-eyebrow">Decision guide</span><h2>What to check before buying</h2></div></div><div className="insurance-check-list"><p><Check size={17} />Coverage and exclusions</p><p><Check size={17} />Waiting periods and deductibles</p><p><Check size={17} />Claim and grievance process</p><p><Check size={17} />Renewal and portability terms</p><p><Check size={17} />Source date and policy wording</p></div><Link className="outline-button" href="/insurance/claims">Read the buyer checklist</Link></section>
      </div>
      <AdSlot id="insurance-dashboard-mid" label="Sponsored insurance placement" />
      <section><div className="insurance-section-heading"><div><span className="finance-eyebrow">Provider directory</span><h2>Popular providers by segment</h2></div><Link href="/insurance/providers">View all <ChevronRight size={16} /></Link></div><div className="insurance-provider-grid">{insuranceProviders.slice(0, 6).map((item) => <ProviderCard provider={item} key={item.slug} />)}</div></section>
      <SourceNote />
    </div>
  );
}

function CategoryCard({ category }: { category: InsuranceCategory }) {
  return <Link className="insurance-category-card glass-panel" href={category.route} style={{ "--insurance-color": category.color } as React.CSSProperties}><span className="insurance-icon"><ShieldCheck size={20} /></span><h3>{category.name}</h3><p>{category.summary}</p><small>{category.audience}</small><span className="insurance-card-link">Learn more <ChevronRight size={15} /></span></Link>;
}

function CategoryPage({ category }: { category: InsuranceCategory }) {
  return <div className="insurance-module"><div className="insurance-breadcrumb"><Link href="/insurance">Insurance</Link><ChevronRight size={14} />{category.name}</div><section className="insurance-detail-hero glass-panel" style={{ "--insurance-color": category.color } as React.CSSProperties}><span className="insurance-icon"><ShieldCheck size={23} /></span><div><span className="finance-eyebrow">{category.shortName} insurance</span><h2>{category.name}</h2><p>{category.summary}</p><small>Useful for: {category.audience}</small></div><Link className="primary-button" href="/insurance/compare">Compare <ArrowRight size={16} /></Link></section><AdSlot id={`${category.key}-insurance-top`} label="Insurance advertisement" /><div className="insurance-benefit-columns"><BenefitPanel title="Main benefits" items={category.benefits} positive /><BenefitPanel title="Limitations and disadvantages" items={category.disadvantages} /></div><section className="glass-panel insurance-content-panel"><span className="finance-eyebrow">Buyer questions</span><h2>Common {category.shortName.toLowerCase()} insurance questions</h2><div className="insurance-question-list">{category.questions.map((question) => <div key={question}><CircleHelp size={16} />{question}</div>)}</div></section><section className="glass-panel insurance-content-panel"><span className="finance-eyebrow">Before you buy</span><h2>Use the policy wording as the final reference</h2><p>Compare the coverage, exclusions, waiting periods, deductibles, co-payments, claim procedure, renewal terms and Customer Information Sheet. Advertised features are only a summary and may not describe every condition.</p><div className="insurance-inline-actions"><Link className="outline-button" href="/insurance/claims">Claims guide</Link><Link className="outline-button" href="/insurance/renewal">Renewal guide</Link><Link className="outline-button" href="/insurance/compare">Compare policies</Link></div></section><SourceNote /></div>;
}

function BenefitPanel({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return <section className={positive ? "glass-panel insurance-benefit-box positive" : "glass-panel insurance-benefit-box caution"}><h2>{title}</h2>{items.map((item) => <p key={item}>{positive ? <Check size={17} /> : <X size={17} />}{item}</p>)}</section>;
}

function ProvidersPage() {
  const [segment, setSegment] = useState("all");
  const providers = segment === "all" ? insuranceProviders : insuranceProviders.filter((item) => item.type === segment);
  return <div className="insurance-module"><section className="insurance-command glass-panel"><div><span className="finance-eyebrow">Provider directory</span><h2>Popular insurance providers in India.</h2><p>Explore providers by segment. Presence or market significance is not a personal recommendation.</p></div><Link className="outline-button" href="/insurance/compare">Compare policies</Link></section><div className="insurance-tabs">{[["all", "All"], ["health", "Health"], ["life", "Life"], ["general", "General"], ["broker", "Intermediaries"]].map(([value, label]) => <button className={segment === value ? "active" : ""} key={value} onClick={() => setSegment(value)} type="button">{label}</button>)}</div><div className="insurance-provider-grid large">{providers.map((item) => <ProviderCard provider={item} key={item.slug} />)}</div><SourceNote /></div>;
}

function ProviderCard({ provider }: { provider: InsuranceProvider }) {
  return <article className="glass-panel insurance-provider-card" data-provider-type={provider.type}><div className="insurance-provider-head"><span className="insurance-provider-mark">{provider.name.slice(0, 2).toUpperCase()}</span><div className="insurance-provider-identity"><div className="insurance-provider-title-row"><h3>{provider.name}</h3><span className="insurance-provider-kind">{provider.type === "broker" ? "Intermediary" : `${provider.type} insurer`}</span></div><small>Reference profile · {provider.sourceDate}</small></div></div><p className="insurance-provider-summary">{provider.summary}</p><div className="insurance-chip-row">{provider.segments.slice(0, 4).map((segment) => <span key={segment}>{segment}</span>)}</div><div className="insurance-metrics">{provider.metrics.slice(0, 2).map((metric) => <div key={metric.label}><small>{metric.label}</small><b>{metric.value}</b><em>{metric.source}</em></div>)}</div><div className="insurance-provider-footer"><Link className="insurance-profile-button" href={`/insurance/providers/${provider.slug}`}>View profile <ChevronRight size={15} /></Link><a className="insurance-official-link" href={provider.website} target="_blank" rel="noreferrer">Official site</a></div><AssetActionButtons compact asset={{ assetKey: `insurance:${provider.slug}`, symbol: provider.slug, name: provider.name, assetType: "other", route: `/insurance/providers/${provider.slug}`, market: provider.type }} /></article>;
}

function ProviderPage({ provider }: { provider: InsuranceProvider }) {
  return <div className="insurance-module"><div className="insurance-breadcrumb"><Link href="/insurance/providers">Providers</Link><ChevronRight size={14} />{provider.name}</div><section className="insurance-detail-hero glass-panel"><span className="insurance-provider-mark large">{provider.name.slice(0, 2).toUpperCase()}</span><div><span className="finance-eyebrow">Provider profile</span><h2>{provider.name}</h2><p>{provider.summary}</p></div><a className="outline-button" href={provider.website} target="_blank" rel="noreferrer">Official website <ArrowRight size={16} /></a></section><div className="insurance-provider-detail-grid"><section className="glass-panel insurance-content-panel"><span className="finance-eyebrow">Segments</span><h2>Products and coverage areas</h2><div className="insurance-chip-row large">{provider.segments.map((segment) => <span key={segment}>{segment}</span>)}</div><p>Use this profile as a starting point. Check the provider&apos;s current policy wording, product UIN, claims documentation and grievance contact before making a decision.</p></section><section className="glass-panel insurance-content-panel"><span className="finance-eyebrow">Published metrics</span><h2>Reference data</h2>{provider.metrics.map((metric) => <div className="insurance-metric-row" key={metric.label}><span>{metric.label}</span><b>{metric.value}</b><small>{metric.source}</small></div>)}</section></div><AdSlot id={`provider-${provider.slug}-mid`} label="Sponsored insurance placement" /><SourceNote /></div>;
}

function ComparePage() {
  const [category, setCategory] = useState<InsuranceCategoryKey>("health");
  const selected = insuranceCategories.find((item) => item.key === category)!;
  const rows = category === "health" ? [["Coverage focus", "Hospitalisation and treatment", "Hospitalisation and treatment"], ["Waiting period", "Varies by product", "Check policy wording"], ["Network access", "Provider network", "Provider network"], ["Co-pay / deductible", "Product-specific", "Product-specific"], ["Claim route", "Cashless or reimbursement", "Cashless or reimbursement"]] : category === "term" ? [["Primary purpose", "Income protection", "Income protection"], ["Maturity benefit", "Usually none", "Product-specific"], ["Medical underwriting", "May be required", "May be required"], ["Riders", "Optional", "Optional"], ["Payout", "Nominee benefit", "Nominee benefit"]] : [["Cover type", "Third-party and/or own damage", "Third-party and/or own damage"], ["Vehicle value", "IDV based", "IDV based"], ["Deductible", "Policy-specific", "Policy-specific"], ["Add-ons", "Optional", "Optional"], ["Renewal", "Annual", "Annual"]];
  return <div className="insurance-module"><section className="insurance-command glass-panel"><div><span className="finance-eyebrow">Transparent comparison</span><h2>Compare what matters before choosing a policy.</h2><p>This is an educational comparison framework, not a quote or recommendation.</p></div><select aria-label="Insurance comparison category" value={category} onChange={(event) => setCategory(event.target.value as InsuranceCategoryKey)}>{insuranceCategories.slice(0, 5).map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></section><AdSlot id="insurance-compare-top" label="Insurance advertisement" /><section className="glass-panel insurance-comparison-panel"><div className="insurance-comparison-title"><div><span className="finance-eyebrow">{selected.name}</span><h2>Policy comparison checklist</h2></div><Link href={selected.route}>Read category guide <ChevronRight size={16} /></Link></div><div className="insurance-comparison-table-wrap"><table className="insurance-comparison-table"><thead><tr><th>Feature</th><th>Option A</th><th>Option B</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><th>{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div><p className="insurance-table-note">Actual terms differ by insurer and policy. Compare product documents, Customer Information Sheets and exclusions instead of relying on a single score.</p></section><section className="insurance-benefit-columns"><BenefitPanel title="Compare benefits" items={selected.benefits} positive /><BenefitPanel title="Compare limitations" items={selected.disadvantages} /></section><SourceNote /></div>;
}

function InsuranceCalculator() {
  const [type, setType] = useState<"health" | "term">("health");
  const [age, setAge] = useState(30);
  const [income, setIncome] = useState(1200000);
  const [dependents, setDependents] = useState(2);
  const [cover, setCover] = useState(1000000);
  const result = type === "health" ? Math.max(1000000, dependents * 500000 + (age > 50 ? 500000 : 0)) : Math.max(income * 10, income * Math.max(10, 20 - dependents));
  return <div className="insurance-module"><section className="insurance-command glass-panel"><div><span className="finance-eyebrow">Planning tool</span><h2>Insurance cover calculator.</h2><p>Get an indicative coverage starting point. This is not an insurer quote or underwriting decision.</p></div></section><section className="glass-panel insurance-calculator-panel"><div className="insurance-tabs">{[["health", "Health cover"], ["term", "Term cover"]].map(([value, label]) => <button className={type === value ? "active" : ""} key={value} onClick={() => setType(value as "health" | "term")} type="button">{label}</button>)}</div><div className="insurance-calculator-grid"><div className="insurance-form"><label>Age<input type="number" min="18" value={age} onChange={(event) => setAge(Number(event.target.value))} /></label><label>Annual income<input type="number" min="0" value={income} onChange={(event) => setIncome(Number(event.target.value))} /></label><label>Dependents<input type="number" min="0" value={dependents} onChange={(event) => setDependents(Number(event.target.value))} /></label>{type === "health" ? <label>Existing cover<input type="number" min="0" value={cover} onChange={(event) => setCover(Number(event.target.value))} /></label> : null}</div><aside className="insurance-calculator-result"><span>Indicative starting point</span><strong>₹{result.toLocaleString("en-IN")}</strong><p>{type === "health" ? `Consider reviewing at least ₹${result.toLocaleString("en-IN")} of health cover, subject to city, family profile, medical history and policy terms.` : `A term-cover range of ₹${result.toLocaleString("en-IN")} may be a starting point before accounting for liabilities, assets, inflation and retirement needs.`}</p><small>Assumption-based estimate. Compare actual insurer quotes and policy documents.</small></aside></div></section><SourceNote /></div>;
}

function SupportPage({ view }: { view: "claims" | "renewal" }) {
  const claims = view === "claims";
  const title = claims ? "Insurance claims guide" : "Insurance renewal guide";
  const items = claims ? ["Read the policy and Customer Information Sheet before submitting documents.", "For cashless treatment, use an eligible network provider and follow pre-authorisation steps.", "For reimbursement, preserve bills, discharge summaries, prescriptions and payment proofs.", "If a claim is rejected, ask for the written reason and use the insurer grievance officer first.", "Escalate unresolved complaints through IRDAI Bima Bharosa or the Insurance Ombudsman route."] : ["Review coverage, exclusions and nominees before paying the renewal premium.", "Renew on time so you do not lose continuity benefits or no-claim benefits.", "Compare premium changes with coverage, deductibles, co-pay and IDV—not premium alone.", "Update address, nominee, dependents, vehicle details and disclosed medical information.", "Keep the renewed policy, Customer Information Sheet and payment receipt safely stored."];
  return <div className="insurance-module"><section className="insurance-command glass-panel"><div><span className="finance-eyebrow">Policyholder support</span><h2>{title}</h2><p>Practical steps for Indian policyholders. Exact procedures depend on the product and insurer.</p></div></section><AdSlot id={`insurance-${view}-top`} label="Insurance advertisement" /><section className="glass-panel insurance-support-panel"><div className="insurance-check-list large">{items.map((item, index) => <p key={item}><b>{index + 1}</b>{item}</p>)}</div>{claims ? <div className="insurance-escalation"><h3>Grievance escalation</h3><p>Approach the insurer first. If the complaint is not resolved or you are dissatisfied, use IRDAI&apos;s grievance channels, including Bima Bharosa. IRDAI lists the grievance call centre at 155255 / 1800 425 4732.</p><a href="https://bimabharosa.irdai.gov.in/" target="_blank" rel="noreferrer">Open Bima Bharosa <ArrowRight size={16} /></a></div> : null}</section><SourceNote /></div>;
}

function SourceNote() {
  return <section className="insurance-source-note"><strong>Sources and disclosure</strong><p>{disclaimer}</p><div>{insuranceSources.map((source) => <a href={source.href} key={source.href} target="_blank" rel="noreferrer">{source.label}</a>)}</div></section>;
}
