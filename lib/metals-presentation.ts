import type { MetalKey } from "./metals";
export const weightsFor = (metal: MetalKey) => metal === "copper" ? [1, 10, 100, 1000] : [1, 8, 10, 100, 1000];
export const defaultWeight = (metal: MetalKey) => metal === "gold" ? 10 : 1;
export function validWeight(metal: MetalKey, value: unknown) {
  return typeof value === "number" && weightsFor(metal).includes(value);
}
export function weightedReference(price: number | null, weight: number) {
  return price !== null && Number.isFinite(price) && price > 0 && Number.isFinite(weight) && weight > 0 ? price * weight : null;
}
export const inr = (price: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(price);
export const weightLabel = (metal: MetalKey, weight: number) => metal === "copper" ? `${weight.toLocaleString("en-IN")} kg` : weight === 1000 ? "1 kg" : `${weight} g`;
