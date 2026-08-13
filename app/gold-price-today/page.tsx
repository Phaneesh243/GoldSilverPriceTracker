import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";
import MetalDetailExtras from "../_components/MetalDetailExtras";
import { getLiveCityPrices } from "../../lib/live-prices";
import { formatINR } from "../../lib/market-data";

export const metadata: Metadata = {
  title: "Gold Price Today in India",
  description: "Today gold price in India for 24K, 22K and 18K gold with Goodreturns-sourced city-wise rates and historical trends.",
  alternates: { canonical: "/gold-price-today" },
};

export const revalidate = 30;

export default async function Page() {
  let live;

  try {
    live = await getLiveCityPrices("mumbai");
  } catch {
    return (
      <InfoPage title="Gold Price Today" description="Live gold prices are temporarily unavailable.">
        <h2>Live feed unavailable</h2>
        <p>Please try again shortly. GoldSilverPrices does not display estimated prices when the live provider is unavailable.</p>
      </InfoPage>
    );
  }

  const gold24 = live.gold.find((item) => item.purity === "24K");
  const gold22 = live.gold.find((item) => item.purity === "22K");
  const gold18 = live.gold.find((item) => item.purity === "18K");

  return (
    <InfoPage title="Gold Price Today" description={`Goodreturns-sourced gold rates for India. Updated ${live.updatedAt}.`}>
      <h2>Today gold rate</h2>
      <div className="info-stats">
        <b>
          24K Gold
          <br />
          <strong>{gold24 ? `${formatINR(gold24.pricePerGram, 2)} / gram` : "Unavailable"}</strong>
        </b>
        <b>
          22K Gold
          <br />
          <strong>{gold22 ? `${formatINR(gold22.pricePerGram, 2)} / gram` : "Unavailable"}</strong>
        </b>
        <b>
          18K Gold
          <br />
          <strong>{gold18 ? `${formatINR(gold18.pricePerGram, 2)} / gram` : "Unavailable"}</strong>
        </b>
      </div>
      <p>{live.source}. Actual jewellery prices may include making charges, GST, local taxes and jeweller margins.</p>
      <MetalDetailExtras metal="gold" ratePerGram={gold22?.pricePerGram || gold24?.pricePerGram || 0} />
    </InfoPage>
  );
}
