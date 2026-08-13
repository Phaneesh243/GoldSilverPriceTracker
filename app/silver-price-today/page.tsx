import type { Metadata } from "next";
import InfoPage from "../_components/InfoPage";
import MetalDetailExtras from "../_components/MetalDetailExtras";
import { getLiveCityPrices } from "../../lib/live-prices";
import { formatINR } from "../../lib/market-data";

export const metadata: Metadata = {
  title: "Silver Price Today in India",
  description: "Today silver price in India per gram, 10 grams and kilogram with Goodreturns-sourced market information.",
  alternates: { canonical: "/silver-price-today" },
};

export const revalidate = 30;

export default async function Page() {
  let live;

  try {
    live = await getLiveCityPrices("mumbai");
  } catch {
    return (
      <InfoPage title="Silver Price Today" description="Live silver prices are temporarily unavailable.">
        <h2>Live feed unavailable</h2>
        <p>Please try again shortly. GoldSilverPrices does not display estimated prices when the live provider is unavailable.</p>
      </InfoPage>
    );
  }

  return (
    <InfoPage title="Silver Price Today" description={`Goodreturns-sourced silver rate for India. Updated ${live.updatedAt}.`}>
      <h2>Today silver rate</h2>
      <div className="info-stats">
        <b>
          Silver / gram
          <br />
          <strong>{formatINR(live.silver.pricePerGram, 2)}</strong>
        </b>
        <b>
          Silver / 10 grams
          <br />
          <strong>{formatINR(live.silver.pricePerGram * 10, 2)}</strong>
        </b>
        <b>
          Silver / kilogram
          <br />
          <strong>{formatINR(live.silver.pricePerGram * 1000, 2)}</strong>
        </b>
      </div>
      <p>{live.source}. Silver rates can vary by city and jeweller. Use this page as an indicative reference.</p>
      <MetalDetailExtras metal="silver" ratePerGram={live.silver.pricePerGram} />
    </InfoPage>
  );
}
