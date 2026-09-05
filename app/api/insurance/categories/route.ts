import { NextResponse } from "next/server";
import { insuranceCategories } from "../../../../lib/insurance";

export const revalidate = 86400;

export function GET() {
  return NextResponse.json({ categories: insuranceCategories, updatedAt: "FY 2024–25 reference data" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
