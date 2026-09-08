import type { Metadata } from "next";
import Link from "next/link";
import MetalPageShell from "../../_components/MetalPageShell";
import { metalTools } from "../../../lib/metals-calculators";
export const metadata: Metadata = { title: "Free metals and jewellery calculators", description: "Manual gold, silver, jewellery, budget, purity, invoice and exchange tools with transparent formulas.", alternates: { canonical: "/metals/calculators" } };
export default function Page() { return <MetalPageShell title="Plan the complete cost" description="All tools work with your own inputs. No paid data feed or sign-in is needed to calculate."><div className="metals-card-grid">{Object.entries(metalTools).map(([key,tool]) => <Link className="metals-guide-card" href={`/calculators/${key}`} key={key}><h2>{tool.title}</h2><p>{tool.description}</p></Link>)}</div></MetalPageShell>; }
