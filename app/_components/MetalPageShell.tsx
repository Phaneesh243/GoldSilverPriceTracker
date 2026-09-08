import Link from "next/link";
import FinancePlatform from "./FinancePlatform";
import Breadcrumbs from "./Breadcrumbs";
export default function MetalPageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://goldsilverprices.in").replace(/\/$/, "");
  const schema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: origin + "/" }, { "@type": "ListItem", position: 2, name: "Metals", item: origin + "/metals" }, { "@type": "ListItem", position: 3, name: title }] };
  return <FinancePlatform screen="metals" customHeading={{ title, subtitle: description }}><div className="metals-module"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll("<", "\\u003c") }} /><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Metals", href: "/metals" }, { label: title }]} />{children}<footer className="metals-disclosure"><p>Informational estimates, not investment advice or a dealer offer. Check units, purity, source and observation time before use.</p><Link href="/metals/learn/methodology">Data and calculation methodology</Link> · <Link href="/metals/learn">Buying guides</Link></footer></div></FinancePlatform>;
}
