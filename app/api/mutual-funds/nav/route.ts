import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 900;

type NavRecord = { schemeCode: string; isin: string; name: string; nav: number; date: string };

function parseNavFile(text: string): NavRecord[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && /^\d+;/.test(line)).map((line) => {
    const parts = line.split(";");
    const nav = Number(parts[4]);
    return { schemeCode: parts[0], isin: parts[1] || "", name: parts[3] || "", nav, date: parts[5] || "" };
  }).filter((item) => item.name && Number.isFinite(item.nav)).slice(0, 500);
}

export async function GET(request: Request) {
  try {
    const response = await fetch("https://www.amfiindia.com/spages/NAVAll.txt", { headers: { accept: "text/plain" }, signal: AbortSignal.timeout(10000), next: { revalidate: 900 } });
    if (!response.ok) throw new Error("AMFI responded with " + response.status);
    const records = parseNavFile(await response.text());
    const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase();
    const filtered = query ? records.filter((item) => (item.name + " " + item.schemeCode + " " + item.isin).toLowerCase().includes(query)).slice(0, 50) : records.slice(0, 50);
    return NextResponse.json({ ok: true, records: filtered, count: records.length, source: "AMFI NAVAll.txt", sourceUrl: "https://www.amfiindia.com/spages/NAVAll.txt", fetchedAt: new Date().toISOString(), status: records.length ? "available" : "unavailable" }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
  } catch (error) {
    return NextResponse.json({ ok: false, records: [], status: "unavailable", source: "AMFI NAVAll.txt", sourceUrl: "https://www.amfiindia.com/spages/NAVAll.txt", error: error instanceof Error ? error.message : "AMFI NAV data is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
