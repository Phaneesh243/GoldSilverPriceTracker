import Link from "next/link";
import { Suspense } from "react";
import SiteHeader from "./SiteHeader";

export default function InfoPage({
  title,
  description,
  children,
  pageClassName = "",
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  pageClassName?: string;
}) {
  return (
    <main className={`info-page ${pageClassName}`.trim()}>
      <Suspense fallback={null}>
        <SiteHeader />
      </Suspense>
      <article className="wrap info-content">
        <span className="eyebrow">GoldSilverPrices India</span>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
        <div className="info-card">
          {children || (
            <>
              <h2>Reliable market information</h2>
              <p>GoldSilverPrices shows Goodreturns-sourced gold and silver rates for India. Actual jeweller prices can vary by city, taxes, making charges and retailer.</p>
              <h2>Last updated</h2>
              <p>Prices are shown with an update timestamp and source so you can understand how current the information is.</p>
            </>
          )}
        </div>
      </article>
      <footer className="footer">
        <div className="wrap footer-inner">
          <Link className="logo" href="/">
            <span>Gold</span>SilverPrices
          </Link>
          <small>Informational use only.</small>
        </div>
      </footer>
    </main>
  );
}
