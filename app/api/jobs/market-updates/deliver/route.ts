import { deliverMarketEdition } from "../../../../../lib/market-digest";
import { marketJobsConfigured, verifiedJobBody } from "../../../../../lib/market-jobs";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!marketJobsConfigured()) return Response.json({ error: "Market updates disabled or not configured." }, { status: 503 });
  let body;
  try { body = await verifiedJobBody(request); } catch { return Response.json({ error: "Invalid signed job." }, { status: 401 }); }
  if (!["open", "close"].includes(String(body.edition)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) || !/^usr_[a-zA-Z0-9_-]{8,150}$/.test(String(body.userId))) return Response.json({ error: "Invalid delivery job." }, { status: 400 });
  try { return Response.json(await deliverMarketEdition(body.edition as "open" | "close", String(body.date), String(body.userId))); }
  catch { return Response.json({ error: "Delivery incomplete; safe to retry." }, { status: 503 }); }
}
