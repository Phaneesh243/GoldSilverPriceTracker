import type { Metadata, Viewport } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://goldsilverprices.in"),
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
  openGraph: {
    title: "GoldSilverPrices - Gold & Silver Rates in India",
    description: "Track gold and silver prices across Indian cities with calculators and historical trends.",
    url: "https://goldsilverprices.in",
    siteName: "GoldSilverPrices",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "GoldSilverPrices - Gold & Silver Rates in India",
    description: "Track gold and silver prices across Indian cities with calculators and historical trends.",
  },
  robots: { index: true, follow: true },
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
      "@id": "https://goldsilverprices.in/#organization",
      name: "GoldSilverPrices",
      url: "https://goldsilverprices.in",
    },
    {
      "@type": "WebSite",
      "@id": "https://goldsilverprices.in/#website",
      name: "GoldSilverPrices",
      url: "https://goldsilverprices.in",
      publisher: {
        "@id": "https://goldsilverprices.in/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://goldsilverprices.in/gold-price/{search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${plusJakartaSans.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
        {children}
      </body>
    </html>
  );
}
