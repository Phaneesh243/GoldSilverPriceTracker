import { NextResponse } from "next/server";
import { insuranceProviders } from "../../../../lib/insurance";

export const revalidate = 86400;

export function GET() {
  return NextResponse.json({ providers: insuranceProviders, updatedAt: "FY 2024–25 reference data" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
