import InfoPage from "./InfoPage";
import { formatCurrency } from "../../lib/country-data";
import { getMetalHistory, getMetalPrice } from "../../lib/metal-prices";
import { getMetalConfig, type MetalKey } from "../../lib/metals";

export default async function Last10DaysPage({ metalKey }: { metalKey: MetalKey }) {
  const config = getMetalConfig(metalKey);
  const [price, history] = await Promise.all([getMetalPrice(metalKey), getMetalHistory(metalKey, "IN", "10d")]);

  return (
    <InfoPage
      title={`${config.name} Price Last 10 Days`}
      description={`Recent ${config.name.toLowerCase()} price history for India with current price and clear unavailable states when a reliable historical provider is not connected.`}
    >
      <div className="history-summary">
        <b>Current {config.name} price</b>
        <strong>{price.price ? formatCurrency(price.price, price.currency, metalKey === "copper" ? 0 : 2) : "Unavailable"}</strong>
        <small>{config.unitLabel}. Source: {price.source}</small>
      </div>
      {history.status === "available" && history.data.length ? (
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
                <th>Change</th>
                <th>Change %</th>
              </tr>
            </thead>
            <tbody>
              {history.data.map((row) => (
                <tr key={String(row.date)}>
                  <td>{String(row.date)}</td>
                  <td>{typeof row.open === "number" ? formatCurrency(row.open, price.currency, 2) : "—"}</td>
                  <td>{typeof row.high === "number" ? formatCurrency(row.high, price.currency, 2) : "—"}</td>
                  <td>{typeof row.low === "number" ? formatCurrency(row.low, price.currency, 2) : "—"}</td>
                  <td>{formatCurrency(row.close, price.currency, 2)}</td>
                  <td>{typeof row.change === "number" ? formatCurrency(row.change, price.currency, 2) : "—"}</td>
                  <td>{typeof row.changePercentage === "number" ? `${row.changePercentage.toFixed(2)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="inline-error">{history.message || "Historical data is unavailable right now."}</div>
      )}
      <p>GoldSilverPrices does not create synthetic history. If the data provider does not return reliable daily values, we show an unavailable message.</p>
    </InfoPage>
  );
}
