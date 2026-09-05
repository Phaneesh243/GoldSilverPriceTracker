import type { Metadata, Viewport } from "next";
import "./globals.css";
import ConsentPrompt from "./_components/ConsentPrompt";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://goldsilverprices.in").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GoldSilverPrices - Gold & Silver Rates in India",
    template: "%s | GoldSilverPrices",
  },
  description: "Fast, simple gold and silver price tracking for India with city-wise rates, historical charts and calculators.",
  keywords: [
    "gold price today",
    "silver price today",
    "gold rate India",
    "22 carat gold price",
    "silver rate India",
    "gold price in Mumbai",
  ],
  alternates: { canonical: "/" },
  applicationName: "GoldSilverPrices",
  category: "finance",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "GoldSilverPrices - Gold & Silver Rates in India",
    description: "Track gold and silver prices across Indian cities with calculators and historical trends.",
    url: siteUrl,
    siteName: "GoldSilverPrices",
    type: "website",
    images: [{ url: "/opengraph-image.svg", width: 1200, height: 630, alt: "GoldSilverPrices market intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoldSilverPrices - Gold & Silver Rates in India",
    description: "Track gold and silver prices across Indian cities with calculators and historical trends.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export const viewport: Viewport = {
  themeColor: "#0b1324",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
try {
  var theme = window.localStorage.getItem("gsp-theme");
  if (theme === "dark" || theme === "light") {
    document.documentElement.dataset.theme = theme;
  }
} catch (_) {}
`;

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "GoldSilverPrices",
      url: siteUrl,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "GoldSilverPrices",
      url: siteUrl,
      publisher: {
        "@id": "https://goldsilverprices.in/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema).replace(/</g, "\\u003c") }} />
        {children}
        <ConsentPrompt />
      </body>
    </html>
  );
}
