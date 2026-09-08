import { metalsAdPlacements } from "../../../../lib/metals-ads";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MetalPageShell from "../../../_components/MetalPageShell";
import AdSlot from "../../../_components/AdSlot";
import { metalsGuides } from "../../../../lib/metals-guides";
export function generateStaticParams() { return Object.keys(metalsGuides).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const g = Object.hasOwn(metalsGuides, slug) ? metalsGuides[slug] : undefined; return g ? { title: g.title, description: g.summary, alternates: { canonical: `/metals/learn/${slug}` } } : {}; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const g = Object.hasOwn(metalsGuides, slug) ? metalsGuides[slug] : undefined; if (!g) notFound(); return <MetalPageShell title={g.title} description={g.summary}><article className="metals-article"><p className="metals-note">Prepared for GoldSilverPrices · Source review: {g.reviewedAt}. Educational content; not professionally certified advice.</p>{g.sections.map(s => <section key={s.title}><h2>{s.title}</h2><p>{s.text}</p></section>)}<section><h2>Sources and further reading</h2><ul>{g.sources.map(s => <li key={s.url}><a href={s.url} rel="noopener noreferrer" target="_blank">{s.title}</a></li>)}</ul></section></article><AdSlot id={metalsAdPlacements.guide(slug)} module="metals" placement="before-footer" /></MetalPageShell>; }
