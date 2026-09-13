import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MetalPageShell from "../../../_components/MetalPageShell";
import MetalQuoteCards from "../../../_components/MetalQuoteCards";
import AdSlot from "../../../_components/AdSlot";
import { metalComparisons } from "../../../../lib/metals-editorial";
import { getMetalPrice } from "../../../../lib/metal-prices";
export const revalidate = 300;
export function generateStaticParams() { return Object.keys(metalComparisons).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; if (!Object.hasOwn(metalComparisons, slug)) return {};
  const guide = metalComparisons[slug];
  return { title: guide.title, description: guide.summary, alternates: { canonical: `/metals/compare/${slug}` }, openGraph: { title: guide.title, description: guide.summary, type: "article", modifiedTime: guide.reviewedAt } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; if (!Object.hasOwn(metalComparisons, slug)) notFound();
  const guide = metalComparisons[slug]; const quotes = await Promise.all(guide.metals.map(metal => getMetalPrice(metal)));
  return <MetalPageShell title={guide.title} description={guide.summary}>
    <p className="metals-note">Editorial review: {guide.reviewedAt}. Educational comparison, not a recommendation.</p>
    <div className="metals-table" role="region" aria-label="Comparison details" tabIndex={0}><table><caption>Compare ownership and quotation basis</caption><thead><tr><th>Question</th>{guide.columns.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{guide.rows.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>
    {guide.sections.map(section => <section className="metals-disclosure" key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
    {quotes.length ? <MetalQuoteCards initial={quotes} uniformWeight /> : null}
    <section className="metals-disclosure"><h2>Sources and further tools</h2><ul>{guide.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul><div className="metals-actions"><Link href="/metals/calculators">Purchase calculators</Link><Link href="/calculators/investment-return">Manual return calculator</Link><Link href="/metals/learn/price-basis">Price methodology</Link></div></section>
    <AdSlot id={`metals-compare-${slug}-footer`} module="metals" placement="before-footer" />
  </MetalPageShell>;
}
