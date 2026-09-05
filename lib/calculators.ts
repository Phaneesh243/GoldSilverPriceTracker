export type CalculatorKind =
  | "gold"
  | "silver"
  | "platinum"
  | "copper"
  | "gold-jewellery"
  | "purity-converter"
  | "weight-converter"
  | "investment-return"
  | "sip"
  | "cagr"
  | "emi"
  | "currency"
  | "tax";

export type CalculatorValue = string | number | boolean | null;
export type CalculatorInputs = Record<string, CalculatorValue>;

export type MetalUnit = "gram" | "kg";
export type WeightUnit = "gram" | "10g" | "kg" | "tola" | "oz" | "lb" | "tonne";

export type MetalCalculationInput = {
  price: number;
  priceUnit: MetalUnit;
  weight: number;
  weightUnit: WeightUnit;
  purityFactor?: number;
  makingPercent?: number;
  wastagePercent?: number;
  taxPercent?: number;
  discount?: number;
};

export type MetalCalculation = {
  quantityInPriceUnit: number;
  weightInGrams: number;
  marketValue: number;
  makingCharge: number;
  wastageValue: number;
  taxableValue: number;
  tax: number;
  discount: number;
  total: number;
};

export type InvestmentCalculation = {
  quantity: number;
  cost: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
};

export const weightMultipliers: Record<WeightUnit, number> = {
  gram: 1,
  "10g": 10,
  kg: 1000,
  tola: 11.6638125,
  oz: 28.349523125,
  lb: 453.59237,
  tonne: 1_000_000,
};

export const purityFactors: Record<string, number> = {
  "24K": 1,
  "22K": 22 / 24,
  "18K": 18 / 24,
};

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function nonNegative(value: number) {
  return Math.max(0, finite(value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit = "gram") {
  const grams = nonNegative(value) * weightMultipliers[from];
  return round(grams / weightMultipliers[to], 6);
}

export function calculateMetal(input: MetalCalculationInput): MetalCalculation {
  const weightInGrams = convertWeight(input.weight, input.weightUnit, "gram");
  const quantityInPriceUnit = input.priceUnit === "kg" ? weightInGrams / 1000 : weightInGrams;
  const purityFactor = input.purityFactor ?? 1;
  const marketValue = nonNegative(input.price) * quantityInPriceUnit * nonNegative(purityFactor);
  const makingCharge = marketValue * (nonNegative(input.makingPercent ?? 0) / 100);
  const wastageValue = marketValue * (nonNegative(input.wastagePercent ?? 0) / 100);
  const taxableValue = marketValue + makingCharge + wastageValue;
  const tax = taxableValue * (nonNegative(input.taxPercent ?? 0) / 100);
  const discount = Math.min(nonNegative(input.discount ?? 0), taxableValue + tax);

  return {
    quantityInPriceUnit: round(quantityInPriceUnit, 6),
    weightInGrams: round(weightInGrams, 6),
    marketValue: round(marketValue),
    makingCharge: round(makingCharge),
    wastageValue: round(wastageValue),
    taxableValue: round(taxableValue),
    tax: round(tax),
    discount: round(discount),
    total: round(taxableValue + tax - discount),
  };
}

export function calculateInvestmentReturn(input: { investmentAmount: number; buyPrice: number; currentPrice: number; quantity?: number }): InvestmentCalculation {
  const buyPrice = nonNegative(input.buyPrice);
  const currentPrice = nonNegative(input.currentPrice);
  const investmentAmount = nonNegative(input.investmentAmount);
  const quantity = nonNegative(input.quantity ?? 0) || (buyPrice ? investmentAmount / buyPrice : 0);
  const cost = nonNegative(input.quantity ?? 0) ? quantity * buyPrice : investmentAmount;
  const currentValue = quantity * currentPrice;
  const profit = currentValue - cost;
  return { quantity: round(quantity, 6), cost: round(cost), currentValue: round(currentValue), profit: round(profit), profitPercent: cost ? round((profit / cost) * 100, 4) : 0 };
}

export function calculateSip(input: { monthlyInvestment: number; annualReturnPercent: number; years: number }) {
  const monthly = nonNegative(input.monthlyInvestment);
  const months = Math.max(0, Math.round(nonNegative(input.years) * 12));
  const monthlyRate = nonNegative(input.annualReturnPercent) / 100 / 12;
  const invested = monthly * months;
  const futureValue = monthlyRate ? monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate) : invested;
  return { invested: round(invested), futureValue: round(futureValue), gains: round(futureValue - invested) };
}

export function calculateCagr(input: { initial: number; final: number; years: number }) {
  const initial = nonNegative(input.initial);
  const final = nonNegative(input.final);
  const years = nonNegative(input.years);
  const cagr = initial > 0 && years > 0 ? ((final / initial) ** (1 / years) - 1) * 100 : 0;
  return { cagr: round(cagr, 4), gain: round(final - initial) };
}

export function calculateEmi(input: { principal: number; annualInterestPercent: number; months: number }) {
  const principal = nonNegative(input.principal);
  const months = Math.max(0, Math.round(nonNegative(input.months)));
  const monthlyRate = nonNegative(input.annualInterestPercent) / 100 / 12;
  const payment = months === 0 ? 0 : monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
  const totalPayment = payment * months;
  return { payment: round(payment), totalPayment: round(totalPayment), totalInterest: round(totalPayment - principal) };
}

export function calculateInflation(input: { currentAmount: number; annualInflationPercent: number; years: number }) {
  const amount = nonNegative(input.currentAmount);
  const futureAmount = amount * (1 + nonNegative(input.annualInflationPercent) / 100) ** nonNegative(input.years);
  return { futureAmount: round(futureAmount), additional: round(futureAmount - amount) };
}

export function calculateTax(input: { amount: number; taxPercent: number; surchargePercent?: number }) {
  const amount = nonNegative(input.amount);
  const tax = amount * nonNegative(input.taxPercent) / 100;
  const surcharge = tax * nonNegative(input.surchargePercent ?? 0) / 100;
  return { taxableAmount: round(amount), tax: round(tax), surcharge: round(surcharge), totalTax: round(tax + surcharge), afterTax: round(amount - tax - surcharge) };
}

export function getCalculatorTitle(kind: CalculatorKind) {
  const titles: Record<CalculatorKind, string> = {
    gold: "Gold Calculator",
    silver: "Silver Calculator",
    platinum: "Platinum Calculator",
    copper: "Copper Calculator",
    "gold-jewellery": "Gold Jewellery Calculator",
    "purity-converter": "Gold Purity Converter",
    "weight-converter": "Metal Weight Converter",
    "investment-return": "Metal Investment Return Calculator",
    sip: "SIP Calculator",
    cagr: "CAGR Calculator",
    emi: "EMI Calculator",
    currency: "Currency Converter",
    tax: "Tax Estimator",
  };
  return titles[kind];
}
