import { NextResponse } from "next/server";
import { currencyDefinitions, currencyPairs } from "../../../../lib/currencies";

export function GET() {
  return NextResponse.json({ currencies: currencyDefinitions, pairs: currencyPairs }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
