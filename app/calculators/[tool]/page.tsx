import { metalsAdPlacements } from "../../../lib/metals-ads";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdSlot from "../../_components/AdSlot";
import MetalPageShell from "../../_components/MetalPageShell";
import MetalsCalculatorWorkspace from "../../_components/MetalsCalculatorWorkspace";
import { metalTools } from "../../../lib/metals-calculators";
const newTools = ["making-charge-comparison", "budget-to-gold", "invoice-checker", "old-gold-exchange", "wedding-budget"];
export function generateStaticParams() { return newTools.map(tool => ({ tool })); }
export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> { const { tool } = await params; const config = newTools.includes(tool) ? metalTools[tool] : undefined; return config ? { title: config.title, description: config.description, alternates: { canonical: `/calculators/${tool}` } } : {}; }
export default async function Page({ params }: { params: Promise<{ tool: string }> }) { const { tool } = await params; if (!newTools.includes(tool)) notFound(); return <MetalPageShell title={metalTools[tool].title} description={metalTools[tool].description}><MetalsCalculatorWorkspace kind={tool} /><AdSlot id={metalsAdPlacements.calculator(tool)} module="metals" placement="before-footer" /></MetalPageShell>; }
