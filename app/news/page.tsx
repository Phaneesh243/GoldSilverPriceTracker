import type { Metadata } from "next";
import { Suspense } from "react";
import InfoPage from "../_components/InfoPage";
import MetalNewsClient from "../_components/MetalNewsClient";

export const metadata: Metadata = {
  title: "Gold, Silver & Precious Metals News",
  description: "Latest market headlines about gold, silver, platinum and copper prices.",
};

const sections = [
  ["Gold news", "gold"],
  ["Silver news", "silver"],
  ["Platinum news", "platinum"],
  ["Copper news", "copper"],
] as const;

export default function NewsPage() {
  return (
    <InfoPage
      title="Precious metals news"
      description="Fresh headlines related to gold, silver, platinum and copper markets, bullion and jewellery."
      pageClassName="news-page"
    >
      <div className="news-page-sections">
        {sections.map(([title, metal]) => (
          <section className="metal-section-card metal-news-card" key={metal}>
            <div className="metal-section-heading">
              <div>
                <span>Market headlines</span>
                <h2>{title}</h2>
              </div>
            </div>
            <Suspense fallback={<p>Loading latest market headlines...</p>}>
              <MetalNewsClient metal={metal} />
            </Suspense>
          </section>
        ))}
      </div>
    </InfoPage>
  );
}
