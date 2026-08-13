export type MetalTrend = "up" | "down" | "flat";

export type CityRate = {
  slug: string;
  name: string;
  sourceName: string;
  state: string;
  trend: MetalTrend;
  localNote: string;
};

export const liveDataSource = "Goodreturns";

export const cityRates: CityRate[] = [
  {
    slug: "mumbai",
    name: "Mumbai",
    sourceName: "Mumbai",
    state: "Maharashtra",
    trend: "up",
    localNote: "High jewellery demand can keep the retail premium slightly firm.",
  },
  {
    slug: "delhi",
    name: "Delhi",
    sourceName: "Delhi",
    state: "NCR",
    trend: "up",
    localNote: "Rates are usually competitive across large bullion markets.",
  },
  {
    slug: "chennai",
    name: "Chennai",
    sourceName: "Chennai",
    state: "Tamil Nadu",
    trend: "up",
    localNote: "South Indian retail rates can include city-specific premiums.",
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    sourceName: "Bangalore",
    state: "Karnataka",
    trend: "flat",
    localNote: "Retail quotes may vary by area and making-charge slabs.",
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    sourceName: "Hyderabad",
    state: "Telangana",
    trend: "up",
    localNote: "Festival-season demand can move retail premiums quickly.",
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    sourceName: "Kolkata",
    state: "West Bengal",
    trend: "flat",
    localNote: "Compare hallmark purity and final invoice value before buying.",
  },
  {
    slug: "pune",
    name: "Pune",
    sourceName: "Pune",
    state: "Maharashtra",
    trend: "up",
    localNote: "Rates are close to Mumbai with small retailer-level variation.",
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    sourceName: "Ahmedabad",
    state: "Gujarat",
    trend: "flat",
    localNote: "Bullion rates are active, but final jewellery quotes differ.",
  },
  {
    slug: "kerala",
    name: "Kerala",
    sourceName: "Kerala",
    state: "Kerala",
    trend: "flat",
    localNote: "Local association rates and making charges can vary by district.",
  },
  {
    slug: "vadodara",
    name: "Vadodara",
    sourceName: "Vadodara",
    state: "Gujarat",
    trend: "up",
    localNote: "Compare bullion-led rates with final jeweller invoice values.",
  },
];

export function getCityRate(slug?: string) {
  return cityRates.find((city) => city.slug === slug?.toLowerCase()) ?? cityRates[0];
}

export function formatINR(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(value);
}
