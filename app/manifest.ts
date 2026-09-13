import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GoldSilverPrices",
    short_name: "GoldSilverPrices",
    description: "India-focused gold, silver, platinum and copper references, buying guides and calculators.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef4f8",
    theme_color: "#0b1324",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
