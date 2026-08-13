export type CountryOption = {
  code: string;
  name: string;
  currency: string;
  locale: string;
};

export const countryOptions: CountryOption[] = [
  { code: "IN", name: "India", currency: "INR", locale: "en-IN" },
  { code: "US", name: "United States", currency: "USD", locale: "en-US" },
  { code: "AE", name: "UAE", currency: "AED", locale: "en-AE" },
  { code: "GB", name: "United Kingdom", currency: "GBP", locale: "en-GB" },
  { code: "CA", name: "Canada", currency: "CAD", locale: "en-CA" },
  { code: "AU", name: "Australia", currency: "AUD", locale: "en-AU" },
  { code: "SG", name: "Singapore", currency: "SGD", locale: "en-SG" },
];

export function getCountry(code?: string) {
  return countryOptions.find((country) => country.code === code?.toUpperCase()) ?? countryOptions[0];
}

export function formatCurrency(value: number, countryCode?: string, maximumFractionDigits = 2) {
  const country = getCountry(countryCode);

  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    maximumFractionDigits,
  }).format(value);
}
