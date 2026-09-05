import { currentStorageUser, errorResponse, ok } from "../../../../../lib/storage-route";
import { getPortfolioSummary } from "../../../../../lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await currentStorageUser();
    return ok(await getPortfolioSummary(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
