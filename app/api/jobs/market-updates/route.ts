import { dispatchMarketEdition } from "../../../../lib/market-digest";
import { marketJobsConfigured, verifiedJobBody } from "../../../../lib/market-jobs";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!marketJobsConfigured()) return Response.json({ error: "Market updates disabled or not configured." }, { status: 503 });
  let body;
  try { body = await verifiedJobBody(request); } catch { return Response.json({ error: "Invalid signed job." }, { status: 401 }); }
  if (!["open", "close"].includes(String(body.edition)) || body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) || body.start !== undefined && (!Number.isSafeInteger(body.start) || Number(body.start) < 0)) return Response.json({ error: "Invalid edition." }, { status: 400 });
  try { return Response.json(await dispatchMarketEdition(body.edition as "open" | "close", body.date as string | undefined, body.start as number | undefined)); }
  catch { return Response.json({ error: "Dispatch incomplete; safe to retry." }, { status: 503 }); }
}
