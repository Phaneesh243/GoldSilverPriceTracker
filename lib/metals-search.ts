export type MetalSearchEntry = { url: string; title: string; group: string; hint: string };
export function searchMetalEntries(entries: MetalSearchEntry[], query: string) {
  const tokens = query.slice(0, 80).toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(entry => tokens.every(token => `${entry.title} ${entry.group} ${entry.hint}`.toLowerCase().includes(token))).slice(0, 8);
}
