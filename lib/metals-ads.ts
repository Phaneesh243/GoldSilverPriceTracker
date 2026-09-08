/** IDs must be the publisher's real inventory IDs. No default advertisers. */
export function adConfiguration(id: string, env: { enabled?: string; client?: string; slots?: string; test?: string }) {
  if (env.enabled !== "true" || env.test === "true" || !/^ca-pub-\d{16}$/.test(env.client || "")) return null;
  try { const map = JSON.parse(env.slots || "{}"); const slot = map[id]; return typeof slot === "string" && /^\d{6,20}$/.test(slot) ? { client: env.client!, slot } : null; } catch { return null; }
}
export const metalsAdPlacements = {
  overview: { after: "metals-after-overview", middle: "metals-mid-content", footer: "metals-before-footer-content" },
  detail: (metal: string) => ({ after: metal + "-after-overview", footer: metal + "-before-footer" }),
  calculator: (tool: string) => tool + "-after-content",
  guide: (slug: string) => "metals-guide-" + slug + "-footer",
};
