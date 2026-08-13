import { NextResponse } from "next/server";
import { cityRates } from "../../../lib/market-data";

export async function GET() {
  return NextResponse.json(
    cityRates.map(({ slug, name, state }) => ({
      slug,
      name,
      state,
      route: `/gold-price/${slug}`,
    })),
  );
}
