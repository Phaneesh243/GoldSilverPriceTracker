import { metals } from "./metals";

// Legacy account records remain readable/deletable. Only metals can be added now.
type SavedAsset = { assetType?: string; assetKey?: string | null; route?: string };
export function isRetiredAsset(asset: SavedAsset) {
  return asset.assetType !== "metal" || !metals.some(metal => metal.key === asset.assetKey);
}
export function activeResearchRoute(asset: SavedAsset) {
  if (isRetiredAsset(asset)) return null;
  return metals.find(metal => metal.key === asset.assetKey)?.route ?? null;
}
