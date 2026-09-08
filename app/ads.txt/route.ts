export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true" || !/^ca-pub-\d{16}$/.test(client || "")) return new Response("Advertising is not configured.", { status: 404, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
  return new Response(`google.com, ${client!.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`, { headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" } });
}
