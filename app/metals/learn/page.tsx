import type { Metadata } from "next";
import Link from "next/link";
import MetalPageShell from "../../_components/MetalPageShell";
import { metalsGuides } from "../../../lib/metals-guides";
export const metadata: Metadata = { title: "Metals buying guides and methodology", description: "Understand purity, jewellery bills, exchange estimates and metal price references.", alternates: { canonical: "/metals/learn" } };
export default function Page() { return <MetalPageShell title="Understand before you buy" description="Practical explanations, explicit assumptions and official resources."><div className="metals-card-grid">{Object.entries(metalsGuides).map(([slug,g]) => <Link className="metals-guide-card" href={`/metals/learn/${slug}`} key={slug}><h2>{g.title}</h2><p>{g.summary}</p></Link>)}</div></MetalPageShell>; }
